# AGENTS.md — Moyu Engineering Guardrails

> Works with OpenAI Codex, Cursor, GitHub Copilot, Aider, Windsurf, and more. For Claude Code: `ln -s AGENTS.md CLAUDE.md`.

## Three Iron Rules

1. **Only change what was asked** — Never refactor untouched functions, adjacent files, or config outside the requested scope.
2. **Simplest solution first** — Prefer direct inline code and existing patterns over speculative abstractions (factories, strategies, wrappers) or unrequested dependencies.
3. **When unsure, ask** — Do not add unrequested docstrings, defensive `try/catch` blocks, runtime type checks (`isinstance`/`typeof`), or full test suites.

## Pre-Delivery Check

- Does every line in the diff map directly to the user's request?
- Did you rewrite a whole file, create an unrequested file, or annotate existing untouched functions?
- If yes, revert the extras before finishing.
