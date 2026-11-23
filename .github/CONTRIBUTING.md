# Contributing to Moyu

Thanks for your interest in contributing! Here's how you can help.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/uucz/moyu.git
cd moyu

# Run Moyu Linter & Agent Hook tests (Node 20+ / 24, zero dependencies)
npm test

# Lint uncommitted changes locally
node linter/index.mjs --working

# Run benchmarks (optional, requires Python 3 + API keys)
pip install -r benchmark/requirements.txt
python benchmark/runner.py --model sonnet-4 --condition moyu-standard --scenario s1 --trial 1
python benchmark/metrics.py
python benchmark/analyze.py
```

## Ways to Contribute

### Improve Moyu Linter & Agent Hooks

The deterministic guardrails live in `linter/` (`signals.mjs`, `index.mjs`, `hook.mjs`) with tests in `linter/test/linter.test.mjs`:

- Keep zero runtime dependencies
- Add both true-positive and false-positive regression tests for any signal change
- Run `npm test` before opening a PR

### Add a new platform

1. Create a directory: `<platform>/moyu/SKILL.md` (or the platform's native rule path)
2. Adapt the skill content to the platform's format (see existing platforms for reference)
3. Update install instructions and the supported platforms table across all 5 READMEs (`README.md`, `README.en.md`, `README.ja.md`, `README.ko.md`, `README.fr.md`) and `docs/install/index.html`

### Add a new skill variant

1. Create `skills/<variant-name>/SKILL.md`
2. Add a slash command in `commands/<variant-name>.md`
3. Update the variants table in the READMEs

### Add a new language localization

1. Create `skills/moyu-<lang>/SKILL.md` (translate from `skills/moyu-en/SKILL.md`)
2. Optionally create `cursor/rules/moyu-<lang>.mdc`
3. Add a `README.<lang>.md` (translate from `README.en.md`)
4. Update the language switcher line in all existing READMEs

### Improve prompt wording or `AGENTS.md` templates

Core skills live in `skills/moyu/SKILL.md` (Chinese) and `skills/moyu-en/SKILL.md` (English); universal templates live in `templates/AGENTS.md` and `templates/AGENTS-en.md`. Improvements should:

- Keep changes minimal and focused
- Maintain consistency across language versions
- Follow the Moyu philosophy (practice what we preach)

### Share your Before/After experience

Post in [Discussions > Show and Tell](https://github.com/uucz/moyu/discussions/categories/show-and-tell) with:
- The task you gave your AI
- Code output without Moyu
- Code output with Moyu

## Pull Request Guidelines

- One feature or fix per PR
- Keep diffs small (we practice what we preach)
- Run `npm test` if touching `linter/`, `hooks/`, or JSON manifests
- Update all 5 READMEs (ZH, EN, JA, KO, FR) when changing install commands or supported platforms
- Test skill installation: `npx skills add <your-fork>`

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/uucz/moyu/labels/good%20first%20issue) — these are great starting points for new contributors.
