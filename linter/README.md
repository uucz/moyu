# Moyu Lint & Agent Hooks

Deterministic over-engineering detection for **pull requests**, **local git commits**, and **AI coding agent hooks** (Claude Code `Stop` / `PostToolUse`). Zero dependencies, Node 20+ / Node 24.

## 1. GitHub Action (PR Linting)

Add `.github/workflows/moyu-lint.yml`:

```yaml
name: Moyu Lint
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: uucz/moyu/linter@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          threshold: 0 # Set > 0 to fail CI when score exceeds threshold
```

## 2. One-Command Agent & Git Hooks (Claude Code, Cursor, Git)

Catch over-engineering *before* the agent finishes its turn (or before a git commit). All installers merge idempotently and preserve your existing hooks:

```bash
# Claude Code Stop hook (.claude/settings.json)
node linter/index.mjs --install-hook=claude

# Cursor IDE stop hook (.cursor/hooks.json)
node linter/index.mjs --install-hook=cursor

# Git pre-commit hook (.git/hooks/pre-commit)
node linter/index.mjs --install-hook=git

# Optional: custom score threshold (default: 6)
node linter/index.mjs --install-hook=claude --threshold=4
```

- **`--mode=stop`** (Claude Code): Checks `git diff HEAD` before Claude ends a turn. Returns `decision: "block"` with trim instructions if score exceeds threshold; steps aside when `stop_hook_active` is `true`.
- **`--mode=cursor-stop`** (Cursor IDE): Checks `git diff HEAD` on Cursor `stop` events and returns `followup_message` when `loop_count === 0`.
- **`--mode=post-tool`** (Claude Code): Non-blocking nudge after `Edit` / `Write` calls via `additionalContext`.
- Set `MOYU_HOOK_DISABLED=1` or `"enabled": false` in `.moyurc.json` to bypass anytime.

## 3. CLI & Config

```bash
# Scaffold .moyurc.json
node linter/index.mjs --init

# Lint last commit
node linter/index.mjs

# Lint staged changes (git pre-commit)
node linter/index.mjs --staged --threshold=6

# Lint all uncommitted changes
node linter/index.mjs --working

# Lint from stdin as JSON
git diff main...HEAD | node linter/index.mjs --stdin --json
```

## 4. What It Detects (7 Signals)

Non-code files, lockfiles, build outputs, and test files are automatically excluded from noisy code checks.

| Signal ID | Signal | What It Detects |
|-----------|--------|-----------------|
| `docstrings` | Unnecessary docstrings | Docstring/JSDoc blocks added to existing functions, or bloated docstrings (>12 lines/func) |
| `error-handling` | Excessive error handling | >25% of added code lines (min 3 lines) are `try`/`catch`/`except`/`raise`/`throw` |
| `new-files` | New files created | Newly created non-test code files (>15 lines) |
| `type-checks` | Type-check bloat | 3+ runtime `isinstance`/`typeof`/`Array.isArray` checks added |
| `abstractions` | Unnecessary abstractions | Speculative pattern declarations (`Factory`, `Strategy`, `Builder`, etc.) or 3+ classes/interfaces in one file (ordinary TS `type` aliases are ignored) |
| `file-rewrite` | Whole-file rewrite | Existing file with >=35 added & >=35 removed lines in a single symmetric hunk |
| `scope-creep` | Scope creep | More than `maxFiles` (default 8) non-lockfile files changed, or short PR title with >5 files |

## 5. Configuration (`.moyurc.json`)

Place an optional `.moyurc.json` in your repository root:

```json
{
  "threshold": 0,
  "hookThreshold": 6,
  "maxFiles": 8,
  "ignore": ["generated/**", "migrations/**"],
  "disableSignals": [],
  "enabled": true
}
```

## 6. Inputs (GitHub Action)

| Input | Default | Description |
|-------|---------|-------------|
| `threshold` | `0` | Score above which the action fails (0 = report only) |
| `github-token` | `github.token` | Token for posting PR comments |
| `comment` | `true` | Whether to post a PR comment |
| `ignore` | `""` | Comma-separated glob patterns to ignore |

## Score Guide

| Score | Grade | Meaning |
|-------|-------|---------|
| 0 | 🐟 Perfect | No over-engineering detected |
| 1-3 | 🐠 Minor | A few signals, probably fine |
| 4-6 | 🐠 Moderate | Consider simplifying |
| 7+ | 🐡 High | PR may be over-engineered |

## Tests

```bash
node --test linter/test/linter.test.mjs
```
