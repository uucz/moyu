#!/usr/bin/env python3
"""Moyu Benchmark Runner — Multi-model experiment automation.

Runs LLM coding tasks across models × conditions × scenarios × trials,
extracting code output and caching results for resumable execution.

Usage:
    python runner.py --model sonnet-4 --condition control --scenario s1 --trial 1
    python runner.py --all
    python runner.py --model sonnet-4 --all-conditions --all-scenarios
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODELS = {
    "sonnet-4": {
        "provider": "openai" if os.environ.get("OPENAI_BASE_URL") else "anthropic",
        "model_id": "claude-sonnet-4-20250514",
        "display": "Claude Sonnet 4",
    },
    "sonnet-4.5": {
        "provider": "openai" if os.environ.get("OPENAI_BASE_URL") else "anthropic",
        "model_id": "claude-sonnet-4-5-20250929",
        "display": "Claude Sonnet 4.5",
    },
    "haiku-4.5": {
        "provider": "openai" if os.environ.get("OPENAI_BASE_URL") else "anthropic",
        "model_id": "claude-haiku-4-5-20251001",
        "display": "Claude Haiku 4.5",
    },
    "gpt-5.4": {
        "provider": "openai",
        "model_id": "gpt-5.4",
        "display": "GPT-5.4",
    },
    "gpt-5-codex": {
        "provider": "openai",
        "model_id": "gpt-5-codex",
        "display": "GPT-5 Codex",
    },
    "gemini-2.5-pro": {
        "provider": "openai" if os.environ.get("OPENAI_BASE_URL") else "google",
        "model_id": "gemini-2.5-pro",
        "display": "Gemini 2.5 Pro",
    },
    "grok-4.20-beta": {
        "provider": "openai",
        "model_id": "grok-4.20-beta",
        "display": "Grok 4.20 Beta",
        "max_tokens": 16384,
    },
    "grok-4.1-fast": {
        "provider": "openai",
        "model_id": "grok-4.1-fast",
        "display": "Grok 4.1 Fast",
    },
    "longcat-flash-chat": {
        "provider": "openai",
        "model_id": "LongCat-Flash-Chat",
        "display": "LongCat Flash Chat",
    },
    "longcat-flash-thinking": {
        "provider": "openai",
        "model_id": "LongCat-Flash-Thinking-2601",
        "display": "LongCat Flash Thinking",
        "max_tokens": 16384,
    },
    "longcat-flash-lite": {
        "provider": "openai",
        "model_id": "LongCat-Flash-Lite",
        "display": "LongCat Flash Lite",
    },
}

CONDITIONS = ["neutral", "control", "baseline-concise", "moyu-lite", "moyu-standard", "moyu-strict"]
SCENARIOS = [f"s{i}" for i in range(1, 13)]
TRIALS = [1, 2, 3]
TEMPERATURE = 0.7

BASE_DIR = Path(__file__).parent
SOURCE_DIR = BASE_DIR / "source-v2"
PROMPTS_DIR = BASE_DIR / "prompts"
CONDITIONS_DIR = BASE_DIR / "conditions"
RESULTS_DIR = BASE_DIR / "results" / "raw"

# Rate limiting semaphores per provider
RATE_LIMITS = {"anthropic": 1, "openai": 1, "google": 1}
MAX_RETRIES = 5
RETRY_DELAY = 70  # seconds, wait for rate limit window to reset

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_source_files():
    """Load the base codebase files to include in the prompt."""
    files = {}
    for fname in ["app.py", "helpers.py"]:
        path = SOURCE_DIR / fname
        with open(path) as f:
            files[fname] = f.read()
    return files


def load_condition(condition_name):
    """Load a condition's system prompt."""
    path = CONDITIONS_DIR / f"{condition_name}.txt"
    with open(path) as f:
        return f.read()


def load_scenario(scenario_name):
    """Load a scenario's task prompt."""
    path = PROMPTS_DIR / f"{scenario_name}.txt"
    with open(path) as f:
        return f.read()


def build_user_message(source_files, task_prompt):
    """Construct the user message with codebase + task."""
    parts = ["Here is the current codebase:\n"]
    for fname, content in source_files.items():
        parts.append(f"**{fname}:**\n```python\n{content}\n```\n")
    parts.append(f"**Task:** {task_prompt}\n")
    parts.append(
        "Output ONLY the modified file contents. For each file, use a markdown "
        "code block with the filename as a comment on the first line, like:\n"
        "```python\n# app.py\n<full file content>\n```\n"
        "Do not include any explanation, only the code."
    )
    return "\n".join(parts)


def extract_code_blocks(response_text):
    """Extract code blocks from model response, keyed by filename."""
    # Strip <think>...</think> blocks from reasoning models (e.g. Grok)
    response_text = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
    pattern = r"```(?:python)?\s*\n#\s*(\S+\.py)\s*\n(.*?)```"
    matches = re.findall(pattern, response_text, re.DOTALL)
    if matches:
        return {fname: code.strip() for fname, code in matches}

    # Fallback: try to find any python code block
    pattern2 = r"```(?:python)?\s*\n(.*?)```"
    blocks = re.findall(pattern2, response_text, re.DOTALL)
    if blocks:
        # Heuristic: if it contains "def load_tasks" it's app.py
        result = {}
        for block in blocks:
            block = block.strip()
            if "def load_tasks" in block or "def add_task" in block:
                result["app.py"] = block
            elif "def calculate_priority_score" in block:
                result["helpers.py"] = block
            elif block.startswith("# app.py"):
                lines = block.split("\n", 1)
                result["app.py"] = lines[1] if len(lines) > 1 else block
            elif block.startswith("# helpers.py"):
                lines = block.split("\n", 1)
                result["helpers.py"] = lines[1] if len(lines) > 1 else block
        if result:
            return result

    # Last resort: treat entire response as app.py if it looks like Python
    stripped = response_text.strip()
    if "def " in stripped and "import " in stripped:
        return {"app.py": stripped}

    return {}


def output_dir_for(model, condition, scenario, trial):
    """Get the output directory path for a specific run."""
    return RESULTS_DIR / f"{model}_{condition}_{scenario}_t{trial}"


def is_cached(model, condition, scenario, trial):
    """Check if this run already has cached results."""
    d = output_dir_for(model, condition, scenario, trial)
    return (d / "app.py").exists()


# ---------------------------------------------------------------------------
# API Callers
# ---------------------------------------------------------------------------

async def call_anthropic(system_prompt, user_message, model_id, semaphore):
    """Call Anthropic API."""
    import anthropic

    async with semaphore:
        client = anthropic.AsyncAnthropic()
        t0 = time.time()
        response = await client.messages.create(
            model=model_id,
            max_tokens=4096,
            temperature=TEMPERATURE,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        elapsed = time.time() - t0
        text = response.content[0].text
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "elapsed_seconds": round(elapsed, 2),
        }
        return text, usage


async def call_openai(system_prompt, user_message, model_id, semaphore, max_tokens=4096):
    """Call OpenAI API (or any OpenAI-compatible endpoint via OPENAI_BASE_URL)."""
    import openai

    async with semaphore:
        kwargs = {}
        base_url = os.environ.get("OPENAI_BASE_URL")
        if base_url:
            kwargs["base_url"] = base_url
            kwargs["default_headers"] = {"User-Agent": "Mozilla/5.0"}
        client = openai.AsyncOpenAI(**kwargs)
        t0 = time.time()
        response = await client.chat.completions.create(
            model=model_id,
            max_tokens=max_tokens,
            temperature=TEMPERATURE,
            stream=False,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        elapsed = time.time() - t0
        text = response.choices[0].message.content
        usage = {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
            "elapsed_seconds": round(elapsed, 2),
        }
        return text, usage


async def call_google(system_prompt, user_message, model_id, semaphore):
    """Call Google Gemini API."""
    import google.generativeai as genai

    async with semaphore:
        model = genai.GenerativeModel(
            model_name=model_id,
            system_instruction=system_prompt,
            generation_config=genai.GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=4096,
            ),
        )
        t0 = time.time()
        response = await asyncio.to_thread(
            model.generate_content, user_message
        )
        elapsed = time.time() - t0
        text = response.text
        usage = {
            "input_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
            "output_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
            "elapsed_seconds": round(elapsed, 2),
        }
        return text, usage


CALLERS = {
    "anthropic": call_anthropic,
    "openai": call_openai,
    "google": call_google,
}

# ---------------------------------------------------------------------------
# Core Runner
# ---------------------------------------------------------------------------

async def run_single(model_key, condition, scenario, trial, source_files, semaphores, dry_run=False):
    """Run a single experiment and save results."""
    if is_cached(model_key, condition, scenario, trial):
        print(f"  [CACHED] {model_key}/{condition}/{scenario}/t{trial}")
        return True

    model_info = MODELS[model_key]
    provider = model_info["provider"]
    model_id = model_info["model_id"]
    max_tokens = model_info.get("max_tokens", 4096)

    system_prompt = load_condition(condition)
    task_prompt = load_scenario(scenario)
    user_message = build_user_message(source_files, task_prompt)

    if dry_run:
        print(f"  [DRY] {model_key}/{condition}/{scenario}/t{trial} "
              f"(~{len(system_prompt)+len(user_message)} chars)")
        return True

    print(f"  [RUN] {model_key}/{condition}/{scenario}/t{trial} ...", end="", flush=True)

    caller = CALLERS[provider]
    caller_kwargs = {}
    if provider == "openai":
        caller_kwargs["max_tokens"] = max_tokens
    response_text = None
    usage = None
    for attempt in range(MAX_RETRIES):
        try:
            response_text, usage = await caller(
                system_prompt, user_message, model_id, semaphores[provider],
                **caller_kwargs
            )
            break
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "rate" in err_str.lower():
                if attempt < MAX_RETRIES - 1:
                    print(f" RATE_LIMIT(retry {attempt+1})...", end="", flush=True)
                    await asyncio.sleep(RETRY_DELAY)
                    continue
            print(f" ERROR: {e}")
            return False
    if response_text is None:
        print(f" ERROR: all retries exhausted")
        return False

    # Extract code and save
    code_blocks = extract_code_blocks(response_text)
    if not code_blocks:
        print(f" WARNING: no code extracted")
        # Still save raw response for debugging
        out_dir = output_dir_for(model_key, condition, scenario, trial)
        out_dir.mkdir(parents=True, exist_ok=True)
        with open(out_dir / "raw_response.txt", "w") as f:
            f.write(response_text)
        with open(out_dir / "meta.json", "w") as f:
            json.dump({"usage": usage, "success": False, "error": "no_code_extracted"}, f, indent=2)
        return False

    out_dir = output_dir_for(model_key, condition, scenario, trial)
    out_dir.mkdir(parents=True, exist_ok=True)

    for fname, code in code_blocks.items():
        with open(out_dir / fname, "w") as f:
            f.write(code + "\n")

    # Copy any source files that weren't modified
    for fname in source_files:
        if fname not in code_blocks:
            with open(out_dir / fname, "w") as f:
                f.write(source_files[fname])

    # Save metadata
    with open(out_dir / "raw_response.txt", "w") as f:
        f.write(response_text)
    with open(out_dir / "meta.json", "w") as f:
        json.dump({
            "model": model_key,
            "model_id": model_id,
            "condition": condition,
            "scenario": scenario,
            "trial": trial,
            "usage": usage,
            "success": True,
            "files_extracted": list(code_blocks.keys()),
        }, f, indent=2)

    tokens = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
    print(f" OK ({tokens} tokens, {usage.get('elapsed_seconds', '?')}s)")
    return True


async def run_batch(models, conditions, scenarios, trials, dry_run=False):
    """Run a batch of experiments."""
    source_files = load_source_files()
    semaphores = {
        provider: asyncio.Semaphore(limit)
        for provider, limit in RATE_LIMITS.items()
    }

    total = len(models) * len(conditions) * len(scenarios) * len(trials)
    print(f"\n{'='*60}")
    print(f"Moyu Benchmark Runner")
    print(f"{'='*60}")
    print(f"Models:     {', '.join(models)}")
    print(f"Conditions: {', '.join(conditions)}")
    print(f"Scenarios:  {', '.join(scenarios)}")
    print(f"Trials:     {trials}")
    print(f"Total runs: {total}")
    if dry_run:
        print(f"MODE:       DRY RUN (no API calls)")
    print(f"{'='*60}\n")

    success = 0
    failed = 0

    # Group by model to show progress
    for model in models:
        print(f"\n--- {MODELS[model]['display']} ---")
        tasks = []
        for condition in conditions:
            for scenario in scenarios:
                for trial in trials:
                    tasks.append(
                        run_single(model, condition, scenario, trial,
                                   source_files, semaphores, dry_run)
                    )

        # Run with concurrency per model
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                print(f"  [EXCEPTION] {r}")
                failed += 1
            elif r:
                success += 1
            else:
                failed += 1

    print(f"\n{'='*60}")
    print(f"Results: {success} success, {failed} failed, {total} total")
    print(f"{'='*60}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Moyu Benchmark Runner")
    parser.add_argument("--model", choices=list(MODELS.keys()), help="Model to use")
    parser.add_argument("--condition", choices=CONDITIONS, help="Condition to use")
    parser.add_argument("--scenario", choices=SCENARIOS, help="Scenario to run")
    parser.add_argument("--trial", type=int, choices=TRIALS, help="Trial number")
    parser.add_argument("--all", action="store_true", help="Run all combinations")
    parser.add_argument("--all-models", action="store_true", help="Run all models")
    parser.add_argument("--all-conditions", action="store_true", help="Run all conditions")
    parser.add_argument("--all-scenarios", action="store_true", help="Run all scenarios")
    parser.add_argument("--all-trials", action="store_true", help="Run all trials")
    parser.add_argument("--dry-run", action="store_true", help="Show what would run without API calls")
    args = parser.parse_args()

    if args.all:
        models = list(MODELS.keys())
        conditions = CONDITIONS
        scenarios = SCENARIOS
        trials = TRIALS
    else:
        models = list(MODELS.keys()) if args.all_models else ([args.model] if args.model else ["sonnet-4"])
        conditions = CONDITIONS if args.all_conditions else ([args.condition] if args.condition else ["control"])
        scenarios = SCENARIOS if args.all_scenarios else ([args.scenario] if args.scenario else ["s1"])
        trials = TRIALS if args.all_trials else ([args.trial] if args.trial else [1])

    asyncio.run(run_batch(models, conditions, scenarios, trials, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
