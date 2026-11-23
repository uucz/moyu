# Changelog

## v1.9.0 (2026-11-22)

### Added
- **One-command hook installer** (`node linter/index.mjs --install-hook=git|claude|cursor`): idempotently configures `.git/hooks/pre-commit`, `.claude/settings.json`, or `.cursor/hooks.json` without overwriting existing user hooks
- **Cursor IDE `stop` hook support** (`linter/hook.mjs --mode=cursor-stop`): speaks Cursor's native `.cursor/hooks.json` protocol (`followup_message` + `loop_count` / `status` recursion guards)
- **Bilingual Blog #2** (`docs/blog/from-prompts-to-hooks.html` + `docs/blog/index.html`): full Chinese/English toggle with `?lang=en` direct URL support

### Changed
- Pointed `package.json` `bin` entry to `moyu-lint` (`linter/index.mjs`) and aligned docs & tests (16 unit tests passing)

### Removed
- Removed unpublished, superseded `bin/moyu.mjs` installer CLI (`npx skills add uucz/moyu` is now the standard cross-platform skill installer)

## v1.8.1 (2026-11-22)

### Added
- Blog post #2 on GitHub Pages (`docs/blog/from-prompts-to-hooks.html`): engineering retrospective on moving from prompt-only rules to deterministic Agent Hooks
- `node linter/index.mjs --init` command to scaffold `.moyurc.json`
- Dogfood GitHub Action workflow (`.github/workflows/moyu-lint.yml`) running Moyu Linter on repository pull requests
- Live CI status badges in `README.md` and `README.en.md`

### Fixed
- **Research Page real data accuracy**: replaced approximated B-Type LOC chart (`locByCondition * 1.3`) in `docs/index.html` with exact S9–S11 means from `metrics.csv` (`btypeLocByCondition` in `docs/chart_data.js` and `benchmark/analyze.py`), and hid the unrun `0.0%` "Tests Passed" series from the Correctness chart
- **Moyu Linter GitHub Action resilience**: added GitHub Pull Request Diff API fallback (`Accept: application/vnd.github.v3.diff`) for shallow checkouts / fork PRs, and replaced literal `EOF` delimiter in `GITHUB_OUTPUT` with a unique delimiter
- Updated `.github/CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, and `bin/moyu.mjs` help text to remove outdated `npx moyu-dev` and 3-README references

## v1.8.0 (2026-11-22)

### Added
- **Claude Code Agent Hooks** (`linter/hook.mjs`, `hooks/hooks.json`): deterministic `Stop` and `PostToolUse` guardrails that inspect `git diff` in-loop before the agent finishes (with `stop_hook_active` recursion guard and `.moyurc.json` opt-out)
- **Whole-file rewrite detector** (`detectFileRewrite`) in Moyu Linter to catch symmetric single-hunk file rewrites
- **Linter CLI & config upgrades**: `--staged` (git pre-commit), `--working`, `--json`, `--max-files`, `--ignore`, and optional `.moyurc.json` config
- **Universal `AGENTS.md` templates** (`templates/AGENTS.md`, `templates/AGENTS-en.md`) for Codex, Cursor, Copilot, Aider, and Claude Code symlinks
- **Automated test suite & CI** (`linter/test/linter.test.mjs`, `.github/workflows/test.yml`) covering all 7 detectors, false-positive regressions, CLI flags, and Agent Hook protocols

### Changed
- **Moyu Linter false-positive reduction**: automatically skips lockfiles, build artifacts, markdown/docs, and test files for noisy code checks; stops falsely flagging ordinary TypeScript `type` aliases and single interfaces; uses block-level docstring analysis; upgraded GitHub Action runtime from `node20` to `node24`
- **Modernized installation routes**: replaced non-existent `claude skill install` commands across all 5 READMEs, docs site, and blog posts with the working `npx skills add uucz/moyu`, native Claude Code plugin marketplace commands (`/plugin marketplace add uucz/moyu`), and `AGENTS.md`
- **Plugin manifests**: updated `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` to match official Claude Code plugin marketplace schemas and wire `hooks/hooks.json`

### Fixed
- Corrected model vendor attribution for LongCat Flash models (`DeepSeek` → `Meituan`) in `docs/index.html`, `docs/blog/ai-people-pleasing.html`, and `blog/benchmark-post-draft.md`
- Aligned `docs/index.html` methodology section with actual benchmark scripts (Control prompt description, syntax validity vs unit tests, One-way ANOVA + Bonferroni t-tests + Cohen's d 95% CI)
- Removed lingering `npx moyu-dev` CTA from PR comments in `linter/index.mjs` and replaced shell-interpolated `execSync` with safe `execFileSync`
- Fixed stray `.github/instructions` directory creation in VSCode/Copilot install snippets

## v1.7.0 (2026-07-30)

### Added
- Moyu Linter: GitHub Action that scores over-engineering signals on pull requests and posts a report comment (`linter/`, `docs/linter/`)
- English variants for 9 platforms: Antigravity, CodeBuddy, Cline, Continue, Kiro, OpenCode, VSCode, Windsurf, Aider
- Root-level `rules/moyu.mdc` and `rules/moyu-en.mdc` for Open Plugins / cursor.directory auto-detection
- GitHub Pages blog at `docs/blog/` with the "你的 AI 有讨好型人格" benchmark post and embedded charts
- Install and Linter documentation pages (`docs/install/`, `docs/linter/`) plus shared stylesheet `docs/shared.css`
- Pixel-art logo and refreshed hero artwork (`assets/logo.svg`, `assets/hero.svg`), demo GIF in all 5 READMEs
- `bin/moyu.mjs` installer CLI (in-repo only — not published to npm, see Notes)

### Changed
- Benchmark results replaced with real 1460-experiment data across 10 models; removed placeholder figures
- Research page and all README benchmark sections updated to match the real dataset
- Cursor MDC rules: fixed `alwaysApply` frontmatter so rules load automatically
- Blog design unified with the main site
- Versions aligned across `package.json`, `.claude-plugin/plugin.json` and this changelog (previously 1.0.0 / 1.5.0 / 1.6.0)
- `.claude-plugin/marketplace.json`: platforms 10 → 12 (Aider, Continue), languages 3 → 5 (Korean, French)
- README.ja.md: added the missing Roadmap section, bringing it level with the other four languages

### Notes
- The `npx moyu-dev` command was previously advertised in `README.md` and the docs site, but the package was never published to npm. Those references now point at the working install routes instead. The CLI source remains in `bin/` for a future release.

## v1.6.0 (2026-03-27)

### Added
- Korean (한국어) localization: `moyu-ko` skill, `README.ko.md`, `commands/moyu-ko.md`
- French (Français) localization: `moyu-fr` skill, `README.fr.md`, `commands/moyu-fr.md`
- Aider platform support: `aider/CONVENTIONS.md`
- Continue platform support: `continue/rules/moyu.md`
- TypeScript benchmark scenarios: `s7-ts`, `s8-ts`, `s9-ts`, `s10-ts` with TypeScript source codebase
- English command reference: `commands/moyu-en.md`

### Changed
- All 5 READMEs updated with new platforms and languages
- Platform count: 10 → 12 (added Aider, Continue)
- Language count: 3 → 5 (added Korean, French)

## v1.5.0 (2026-03-24)

### Added
- "Engineering culture standard" positioning: philosophy section now frames Moyu as engineering discipline, not just AI fix
- Honest NoPUA differentiation: Three Schools section now explicitly distinguishes NoPUA (changes drive) vs Moyu (constrains behavior)
- Platform tier system: supported platforms table now shows Core vs Community maintenance status
- Community section with GitHub Discussions links and Before/After submission call-to-action
- Roadmap section: Moyu Linter, GitHub Action, more localizations (README.md, README.en.md)

### Changed
- All 3 READMEs updated with above additions
- Version bumped to 1.5.0

## v1.4.0 (2026-03-24)

### Changed
- Narrative consistency: all SKILL.md and platform rule files now say "AI restrains itself so the developer can moyu" instead of "AI moyu"
- VSCode copilot-instructions.md: added developer-benefit framing
- Benchmark results.md: added "Impact on developers" conclusion
- README.en.md: added Moyu brand explanation for English-speaking users
- All 3 READMEs: added install quick-route section for faster onboarding
- All 3 READMEs: added "5 signals reduced to zero" emphasis line in benchmark section
- README.ja.md: added missing "Science Behind Moyu" and "Supported Platforms" sections

### Fixed
- Narrative gap: SKILL.md (core product) now aligns with README's "human benefits" framing

## v1.3.0 (2026-03-23)

### Changed
- Narrative repositioning: "摸鱼" subject shifted from AI to human
- Tagline, opening hook, philosophy, and three schools sections rewritten
- Hero SVG subtitle updated
- GitHub description updated
- Added "Ultimate Setup" combination table to Three Schools section

## v1.2.0 (2026-03-24)

### Added
- Hero image (SVG) for visual identity
- Colorful platform badges row (10 platforms)
- Japanese README (`README.ja.md`)
- `.github` infrastructure: CONTRIBUTING.md, issue/PR templates
- CI/Release workflow (auto-release on tag push)
- "Three Schools of AI Coding" ecosystem positioning (PUA × NoPUA × Moyu)
- Before/After code comparison prominently displayed in README

### Changed
- GitHub description updated to bilingual (Chinese + English)
- marketplace.json platforms array completed (added antigravity, opencode)

## v1.1.0 (2026-03-23)

### Added
- 3 new skill variants: `moyu-lite` (lightweight), `moyu-strict` (team enforcement), `moyu-ja` (Japanese)
- 2 new platforms: Google Antigravity, OpenCode (10 platforms total)
- Quick-install command at top of README
- Usage section with per-platform activation guide
- Benchmark results with 6 controlled experiments (66% code reduction)

### Changed
- Consolidated install section (Claude Code / Codex / Kiro / CodeBuddy / Antigravity / OpenCode share same format)
- Added Japanese to supported languages

## v1.0.0 (2026-03-19)

### Added
- Core moyu skill (Chinese and English)
- 10 over-engineering behavior categories with real-world examples
- 3 Iron Rules: scope discipline, minimal solution, ask before acting
- Grinding vs Moyu comparison table (7 dimensions)
- Moyu Checklist (7-point pre-delivery check)
- Anti-Grinding Table (15 specific behavioral corrections)
- 4-level over-engineering detection and escalation system (L1-L4)
- Positive reinforcement system (Moyu Recognition)
- Corporate culture flavor packs (Alibaba, ByteDance, Silicon Valley, Microsoft)
- 8 platform support: Claude Code, Cursor, Codex CLI, VSCode/Copilot, Windsurf, Cline, Kiro, CodeBuddy
- PUA compatibility guidance
