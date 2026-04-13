# Moyu Lint

Detect over-engineering signals in your pull requests. Zero dependencies.

## Quick Start

Add to `.github/workflows/moyu-lint.yml`:

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
```

## What It Detects

| Signal | What It Looks For |
|--------|-------------------|
| Unnecessary docstrings | Docstrings added to existing functions |
| Excessive error handling | High ratio of try/catch/except in new code |
| New files created | Entirely new files that may be scope creep |
| Type-check bloat | Excessive isinstance/typeof checks |
| Unnecessary abstractions | New classes, interfaces, design pattern names |
| Scope creep | Many files changed relative to PR scope |

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `threshold` | `0` | Score above which the action fails (0 = report only) |
| `github-token` | `github.token` | Token for posting PR comments |
| `comment` | `true` | Whether to post a PR comment |

## CLI Usage

```bash
# Lint last commit
node linter/index.mjs

# Lint specific range
node linter/index.mjs HEAD~3

# Lint from stdin
git diff main...HEAD | node linter/index.mjs --stdin

# Set failure threshold
node linter/index.mjs --threshold=5
```

## Score Guide

| Score | Grade | Meaning |
|-------|-------|---------|
| 0 | 🐟 Perfect | No over-engineering detected |
| 1-3 | 🐠 Minor | A few signals, probably fine |
| 4-6 | 🐠 Moderate | Consider simplifying |
| 7+ | 🐡 High | PR may be over-engineered |
