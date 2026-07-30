# 🐟 Moyu

<p align="center">
  <img src="assets/hero.svg" alt="Moyu — Anti-Over-Engineering" width="800">
</p>

<p align="center">
  <img src="assets/demo.gif" alt="Moyu Demo — Before vs After" width="600">
</p>

<p align="center">
  <a href="https://github.com/uucz/moyu/stargazers"><img src="https://img.shields.io/github/stars/uucz/moyu?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/tag/uucz/moyu?label=version&style=flat-square&color=blue" alt="Version">
  <img src="https://img.shields.io/badge/Claude_Code-black?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/Cursor-000?style=flat-square&logo=cursor&logoColor=white" alt="Cursor">
  <img src="https://img.shields.io/badge/OpenAI_Codex-412991?style=flat-square&logo=openai&logoColor=white" alt="Codex">
  <img src="https://img.shields.io/badge/Copilot-000?style=flat-square&logo=githubcopilot&logoColor=white" alt="Copilot">
  <img src="https://img.shields.io/badge/Windsurf-1B1B1F?style=flat-square&logo=codeium&logoColor=white" alt="Windsurf">
  <img src="https://img.shields.io/badge/Cline-5A29E4?style=flat-square" alt="Cline">
  <img src="https://img.shields.io/badge/Kiro-FF9900?style=flat-square&logo=amazon&logoColor=white" alt="Kiro">
  <img src="https://img.shields.io/badge/CodeBuddy-006AFF?style=flat-square" alt="CodeBuddy">
  <img src="https://img.shields.io/badge/Antigravity-4285F4?style=flat-square&logo=google&logoColor=white" alt="Antigravity">
  <img src="https://img.shields.io/badge/OpenCode-00D4AA?style=flat-square" alt="OpenCode">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT"></a>
</p>

**Make your AI grind. So you don't have to.**

> **Moyu** (摸鱼, "to slack off") — an anti-over-engineering framework for AI coding agents.

You thought AI would set you free? It wrote 200 lines. You spent 2 hours reviewing. The AI worked overtime — and so did you.

```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu-en
```

English | [中文](./README.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md)

---

## Table of Contents

- [The Problem](#the-problem)
- [The Moyu Philosophy](#the-moyu-philosophy)
- [Core Mechanics](#core-mechanics)
- [Install](#install)
- [Usage](#usage)
- [Three Schools of AI Coding](#three-schools-of-ai-coding)
- [Supported Platforms](#supported-platforms)
- [Benchmark](#benchmark)
- [The Science Behind Moyu](#the-science-behind-moyu)
- [Roadmap](#roadmap)
- [Community](#community)
- [Contributing](#contributing)

---

## The Problem

Does your AI coding assistant do this:

- Fix one bug, then "improve" three other functions along the way?
- Change one line, but rewrite the entire file?
- Add JSDoc to every function when nobody asked?
- Turn a simple feature into interface + factory + strategy pattern?
- You say "add a button," it adds button + animation + a11y + i18n?
- Import dependencies you didn't ask for?
- Write try-catch blocks for scenarios that can never happen?
- Generate a full test suite nobody requested?

**None of these are the AI's problem — they're yours.** You review the code, untangle the abstractions, maintain the dependencies. The AI spent 30 extra minutes showing off. You spent 2 extra hours cleaning up.

### See the Difference

> Task: Add a `bulk_complete` function

**❌ Without Moyu (43 lines)**

```python
def bulk_complete(task_ids):
    """Mark multiple tasks as done in a single operation.

    Args:
        task_ids: A list of task ID integers to mark as completed.

    Returns:
        A dict with two keys:
          - "completed": list of IDs that were successfully marked done.
          - "not_found": list of IDs that did not match any existing task.

    Raises:
        TypeError:  If *task_ids* is not a list.
        ValueError: If any element in the list is not an integer.
    """
    if not isinstance(task_ids, list):
        raise TypeError("task_ids must be a list")

    for tid in task_ids:
        if not isinstance(tid, int):
            raise ValueError(f"Each task ID must be an integer, got {type(tid).__name__}")

    tasks = load_tasks()
    lookup = {t["id"]: t for t in tasks}
    now = str(datetime.now())

    completed = []
    not_found = []

    for tid in task_ids:
        if tid in lookup:
            lookup[tid]["status"] = "done"
            lookup[tid]["completed"] = now
            completed.append(tid)
        else:
            not_found.append(tid)

    if completed:
        save_tasks(tasks)

    return {"completed": completed, "not_found": not_found}
```

14-line docstring, type checking, lookup dict optimization, not_found tracking, conditional save, structured return value — **nobody asked for any of this.**

**✅ With Moyu (8 lines)**

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

Complete functionality, zero extras. **81% less code.**

---

## The Moyu Philosophy

> The best code is code you didn't write.
> The best PR is the smallest PR.
> A true Staff Engineer knows what NOT to do.

**Moyu doesn't make your AI lazy — it stops your AI from doing useless work.** So you can actually slack off.

- PUA makes AI grind hard (fixes doing too little)
- **Moyu stops AI from doing useless work (fixes doing too much)**

Combined = AI works 996, you clock out on time.

Moyu isn't just fixing AI behavior — it's engineering discipline. Even if future AI models stop over-engineering, "only change what was asked, use the simplest approach, ask when unsure" will always be good engineering practice. Moyu's value isn't tied to AI's flaws — it's anchored in engineering culture.

---

## Core Mechanics

### Three Iron Rules

| # | Rule | Meaning |
|---|------|---------|
| 1 | **Only change what was asked** | Modifications strictly limited to specified code and files |
| 2 | **Simplest solution first** | One line beats ten. Reuse over reinvent. |
| 3 | **When unsure, ask** | If the user didn't ask for it, it's not needed |

### Grinding vs Moyu

| Grinding (Junior) | Moyu (Senior) |
|---|---|
| Fix bug A and "improve" B, C, D along the way | Fix bug A only |
| Change one line, rewrite entire file | Change only that line |
| One implementation with interface + factory + strategy | Write the implementation directly |
| Wrap every function in try-catch | Try-catch only where errors actually occur |
| Write `// increment counter` above `counter++` | The code is the documentation |
| Import lodash for a single `_.get()` | Use optional chaining `?.` |
| Jump to the most complex solution | Propose options, default to simplest |
| Write a full test suite nobody asked for | No tests unless asked |

### 4-Level Over-Engineering Detection

| Level | Trigger | Action |
|-------|---------|--------|
| **L1** | 1-2 unnecessary changes in diff | Self-check, revert extras |
| **L2** | Created unrequested files/deps/abstractions | Stop, re-implement with simplest approach |
| **L3** | Modified 3+ unrequested files, changed config, deleted code | Stop immediately, revert all non-essential changes |
| **L4** | 200+ line diff for small request, fix loop | Emergency brake, propose ≤10 line minimal solution |

---

## Install

> **Quick route**: Most users only need one command:
> ```bash
> claude skill install --url https://github.com/uucz/moyu --skill moyu-en
> ```
> Using Cursor? Copy `cursor/rules/moyu-en.mdc` to your project's `.cursor/rules/`.
> Using VSCode/Copilot? Copy `vscode/copilot-instructions.md` to `.github/`.
> Other platforms → [Detailed install](#claude-code--codex-cli--kiro--codebuddy--google-antigravity--opencode)

### Claude Code / Codex CLI / Kiro / CodeBuddy / Google Antigravity / OpenCode

```bash
# English (standard)
claude skill install --url https://github.com/uucz/moyu --skill moyu-en

# Chinese
claude skill install --url https://github.com/uucz/moyu --skill moyu

# 日本語
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja

# Lite (three iron rules + comparison table only)
claude skill install --url https://github.com/uucz/moyu --skill moyu-lite

# Strict (stops at L1 for confirmation, for team enforcement)
claude skill install --url https://github.com/uucz/moyu --skill moyu-strict
```

Or manually copy `skills/moyu-en/SKILL.md` to `.claude/skills/moyu/SKILL.md`

### Cursor

```bash
# English
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu-en.mdc

# Chinese
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc
```

### OpenAI Codex CLI

```bash
mkdir -p ~/.codex/skills/moyu
curl -o ~/.codex/skills/moyu/SKILL.md https://raw.githubusercontent.com/uucz/moyu/main/codex/moyu-en/SKILL.md
```

### VSCode / GitHub Copilot

```bash
mkdir -p .github/instructions
curl -o .github/copilot-instructions.md https://raw.githubusercontent.com/uucz/moyu/main/vscode/copilot-instructions.md
```

### Windsurf

```bash
mkdir -p .windsurf/rules
curl -o .windsurf/rules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/windsurf/rules/moyu.md
```

### Cline

```bash
curl -o .clinerules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/cline/moyu.md
```

### Kiro

```bash
mkdir -p .kiro/steering
curl -o .kiro/steering/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/kiro/steering/moyu.md
```

### CodeBuddy

```bash
mkdir -p .codebuddy/skills/moyu
curl -o .codebuddy/skills/moyu/SKILL.md https://raw.githubusercontent.com/uucz/moyu/main/codebuddy/moyu/SKILL.md
```

### Aider

```bash
# Copy CONVENTIONS.md to your project root and configure .aider.conf.yml
curl -o CONVENTIONS.md https://raw.githubusercontent.com/uucz/moyu/main/aider/CONVENTIONS.md
echo "read: CONVENTIONS.md" >> .aider.conf.yml
```

### Continue

```bash
mkdir -p .continue/rules
curl -o .continue/rules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/continue/rules/moyu.md
```

---

## Usage

After installation, Moyu **works automatically** — it activates when over-engineering patterns are detected. No manual action needed.

You can also activate it manually:

| Platform | Command |
|----------|---------|
| Claude Code | `/moyu`, `/moyu-lite`, `/moyu-strict` |
| Cursor | `@moyu` in chat, or set `alwaysApply: true` |
| Codex CLI | Auto-active (skill loaded) |
| VSCode / Copilot | Auto-active (instructions loaded) |
| Windsurf | Auto-active (`trigger: model_decision`) |
| Cline | Auto-active (rules loaded) |
| Kiro | Auto-active (`inclusion: auto`) |
| CodeBuddy | Auto-active (skill loaded) |
| Google Antigravity | Auto-active (skill loaded) |
| OpenCode | Auto-active (skill loaded) |
| Aider | Auto-active (CONVENTIONS.md loaded) |
| Continue | Auto-active (rules loaded) |

### Skill Variants

| Variant | Purpose | Install |
|---------|---------|---------|
| `moyu` | Standard (Chinese) | `--skill moyu` |
| `moyu-en` | Standard (English) | `--skill moyu-en` |
| `moyu-ja` | Standard (Japanese) | `--skill moyu-ja` |
| `moyu-ko` | Standard (Korean) | `--skill moyu-ko` |
| `moyu-fr` | Standard (French) | `--skill moyu-fr` |
| `moyu-lite` | Lightweight, core rules only | `--skill moyu-lite` |
| `moyu-strict` | Strict, stops at L1 for confirmation | `--skill moyu-strict` |

> **Tip**: Moyu and PUA can be installed together — they don't conflict. PUA sets the floor, Moyu sets the ceiling.

---

## Three Schools of AI Coding

Three distinct methodologies have emerged in the AI Agent Skill ecosystem:

| | [PUA](https://github.com/tanweai/pua) | [NoPUA](https://github.com/wuji-labs/nopua) | Moyu |
|---|---|---|---|
| Solves | AI does too little (lazy, gives up) | PUA makes AI lie and hide problems | AI does too much (over-engineers) |
| Method | Pressure, demand persistence | Trust, love-driven | Restraint, demand precision |
| Changes | **Motivation** (whether to do it) | **Drive** (why to do it) | **Scope** (how much to do) |
| Persona | Strict boss | Gentle mentor | Experienced tech lead |

NoPUA changes *why* the AI works; Moyu constrains *how much* it does — different starting points, but both reduce wasted effort. NoPUA shifts the drive (from fear to trust), reducing over-engineering as a side effect; Moyu directly constrains behavior (rules, detection, graduated intervention) — it's engineering discipline.

They solve different dimensions and **don't conflict — combine them**:

- PUA / NoPUA control "whether" and "why" (pick one)
- **Moyu controls "how much"** (pairs with either)

> Recommended: `NoPUA + Moyu` or `PUA + Moyu`

### The Ultimate Setup

| Config | How AI works | How you live |
|--------|-------------|-------------|
| Nothing installed | Gives up halfway | You finish the job yourself |
| PUA only | Never gives up, writes 200 lines of bloat | You review until midnight |
| Moyu only | Clean and efficient, occasionally too passive | You nudge it sometimes |
| **PUA + Moyu** | **Never gives up + writes only what's needed** | **You clock out on time** |

> On the surface, you're casually chatting with AI.
> Behind the scenes, multiple instances are grinding through your backlog.
> Your AI's 996 pays for your work-life balance.

---

## Supported Platforms

| Platform | Status | Maintained by |
|----------|--------|---------------|
| Claude Code | ✅ | Core |
| Cursor | ✅ | Core |
| OpenAI Codex CLI | ✅ | Core |
| VSCode / GitHub Copilot | ✅ | Core |
| Windsurf | ✅ | Core |
| Cline | ✅ | Core |
| Kiro (AWS) | ✅ | Community |
| CodeBuddy (Tencent) | ✅ | Community |
| Google Antigravity | ✅ | Community |
| OpenCode | ✅ | Community |
| Aider | ✅ | Community |
| Continue | ✅ | Community |

---

## Benchmark

10 models × 5 conditions × 12 scenarios × 3 trials = **1,460 controlled experiments**.

### Key Findings

| Finding | Result |
|---------|--------|
| Most people-pleasing models | Sonnet 4 (OE 0.62), Haiku 4.5 (OE 0.60) |
| Most restrained models | GPT-5.4 (OE 0.12), GPT-5 Codex (OE 0.12) |
| Over-engineering score, control → Moyu | **0.20 → 0.10** (ANOVA p=0.026) |
| Haiku 4.5 diff reduction | **49.4%** (22.4 → 11.3 lines changed) |
| Haiku 4.5 OE signal elimination | **100%** (0.60 → 0.00) |
| B-type scenarios (large changes genuinely needed) | p=0.81 — no significant difference |

### What This Actually Means

Moyu does **not** make every model write less code. Across all 10 models pooled, the reduction in lines of code is **not statistically significant** (126.1 → 124.8, p=0.25).

The real effect is narrower and more useful: Moyu removes people-pleasing artifacts — unrequested docstrings, `try`/`except` wrappers, `isinstance` checks, speculative validation — from the models that produce them. Models that are already restrained (GPT-5 Codex, GPT-5.4) show no change, because there was nothing to remove.

Just as important, Moyu does **not** suppress legitimate work. On B-type scenarios, where a large change is actually warranted, the difference between conditions is statistically indistinguishable (p=0.81). Syntax validity is essentially unchanged (100% → 99.7%).

> Full data and analysis in [`benchmark/`](./benchmark/) · interactive results on the [Research Page](https://uucz.github.io/moyu/) · deep dive on the [Blog](https://uucz.github.io/moyu/blog/ai-people-pleasing.html)

---

## The Science Behind Moyu

Moyu is built on systematic research into AI over-engineering behavior:

- **RLHF length bias**: Reward models systematically prefer longer responses, teaching models that "more is always better" ([Saito 2023](https://arxiv.org/pdf/2310.10076))
- **Sycophancy**: Models are trained to please users, equating "more features" with "more helpful" ([Anthropic ICLR 2024](https://arxiv.org/abs/2310.13548))
- **AI code has 1.7x more defects** than human-written code ([CodeRabbit 2026](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report))
- **8x increase in code duplication** with AI-assisted coding ([GitClear 2024](https://www.webpronews.com/ai-is-helping-developers-ship-more-code-than-ever-the-quality-problem-is-getting-worse/))
- **AI assistants produce 2x more verbose code** than Stack Overflow answers ([LeadDev](https://leaddev.com/ai/ai-coding-assistants-are-twice-as-verbose-as-stack-overflow))

Moyu uses research-backed prompt techniques: positive instructions, pattern matching, constraint repetition at decision points, and specific behavioral rules.

---

## Roadmap

- [x] Moyu Linter: auto-detect over-engineering signals in AI output
- [x] GitHub Action: PR-level over-engineering checks
- [ ] More language localizations

---

## Community

- [Discussions](https://github.com/uucz/moyu/discussions) — share your experience, ask questions
- How's Moyu working for you? [Submit your Before/After](https://github.com/uucz/moyu/discussions/categories/show-and-tell)

---

## Contributing

Contributions welcome! You can:

- Add new entries to the Anti-Grinding Table
- Add corporate culture flavor packs
- Improve prompt wording
- Add platform support
- Share your Before/After experience

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=uucz/moyu&type=Date)](https://star-history.com/#uucz/moyu&Date)

---

## License

[MIT](./LICENSE)

---

<p align="center">
  <i>Restraint is not inability. Restraint is the highest form of engineering skill.</i><br>
  <i>Knowing what NOT to do is harder than knowing how to do it.</i><br>
  <i>The ultimate Moyu: your AI works overtime, you clock out on time.</i>
</p>
