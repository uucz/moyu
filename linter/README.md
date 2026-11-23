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

## 2. Claude Code Agent Hook (In-Loop Guardrail)

Catch over-engineering *before* the agent finishes its turn.

Add to `.claude/settings.json` (or install Moyu as a Claude Code plugin — `hooks/hooks.json` configures this automatically):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ./linter/hook.mjs --mode=stop --threshold=6",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

- **`--mode=stop`** (default): Checks `git diff HEAD` when Claude tries to end a turn. Blocks with concrete trim instructions if score exceeds threshold. Automatically steps aside when `stop_hook_active` is `true` so it never loops.
- **`--mode=post-tool`**: Non-blocking nudge after `Edit` / `Write` calls via `additionalContext`.
- Set `MOYU_HOOK_DISABLED=1` or `"enabled": false` in `.moyurc.json` to bypass anytime.

## 3. CLI & Git Pre-Commit

```bash
# Lint last commit
node linter/index.mjs

# Lint staged changes (ideal for .git/hooks/pre-commit)
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
