# Changelog

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
