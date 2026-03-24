# Contributing to Moyu

Thanks for your interest in contributing! Here's how you can help.

## Ways to Contribute

### Add a new platform

1. Create a directory: `<platform>/moyu/SKILL.md`
2. Adapt the skill content to the platform's format
3. Add install instructions to `README.md` and `README.en.md`
4. Update `marketplace.json` platforms array

### Add a new skill variant

1. Create `skills/<variant-name>/SKILL.md`
2. Add a slash command in `commands/<variant-name>.md`
3. Update the variants table in both READMEs

### Improve prompt wording

The core skills are in `skills/moyu/SKILL.md` (Chinese) and `skills/moyu-en/SKILL.md` (English). Improvements should:

- Keep changes minimal and focused
- Maintain consistency across language versions
- Follow the Moyu philosophy (practice what we preach)

### Share your Before/After experience

Open an issue with:
- The task you gave your AI
- Code output without Moyu
- Code output with Moyu

## Pull Request Guidelines

- One feature per PR
- Keep diffs small (we practice what we preach)
- Update both Chinese and English READMEs if applicable
- Test skill installation: `claude skill install --url <your-fork> --skill moyu`
