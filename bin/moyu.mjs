#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { get } from 'https';

const REPO = 'https://raw.githubusercontent.com/uucz/moyu/main';
const cwd = process.cwd();

const TOOLS = [
  {
    name: 'Cursor',
    detect: () => existsSync(join(cwd, '.cursor')),
    files: [{ src: 'cursor/rules/moyu.mdc', enSrc: 'cursor/rules/moyu-en.mdc', dest: '.cursor/rules/moyu.mdc' }],
  },
  {
    name: 'VS Code / Copilot',
    detect: () => existsSync(join(cwd, '.vscode')),
    files: [{ src: 'vscode/copilot-instructions.md', enSrc: 'vscode/copilot-instructions-en.md', dest: '.github/copilot-instructions.md' }],
  },
  {
    name: 'Windsurf',
    detect: () => existsSync(join(cwd, '.windsurf')),
    files: [{ src: 'windsurf/rules/moyu.md', enSrc: 'windsurf/rules/moyu-en.md', dest: '.windsurf/rules/moyu.md' }],
  },
  {
    name: 'Cline',
    detect: () => existsSync(join(cwd, '.cline')),
    files: [{ src: 'cline/moyu.md', enSrc: 'cline/moyu-en.md', dest: '.cline/rules/moyu.md' }],
  },
  {
    name: 'Codex',
    detect: () => existsSync(join(cwd, 'AGENTS.md')) || existsSync(join(cwd, 'codex.md')),
    files: [{ src: 'codex/moyu/SKILL.md', enSrc: 'codex/moyu-en/SKILL.md', dest: 'AGENTS.md' }],
  },
  {
    name: 'Kiro',
    detect: () => existsSync(join(cwd, '.kiro')),
    files: [{ src: 'kiro/steering/moyu.md', enSrc: 'kiro/steering/moyu-en.md', dest: '.kiro/steering/moyu.md' }],
  },
  {
    name: 'Aider',
    detect: () => existsSync(join(cwd, '.aider')) || existsSync(join(cwd, '.aider.conf.yml')),
    files: [{ src: 'aider/CONVENTIONS.md', enSrc: 'aider/CONVENTIONS-en.md', dest: '.aider/CONVENTIONS.md' }],
  },
  {
    name: 'Continue',
    detect: () => existsSync(join(cwd, '.continue')),
    files: [{ src: 'continue/rules/moyu.md', enSrc: 'continue/rules/moyu-en.md', dest: '.continue/rules/moyu.md' }],
  },
];

const SKILL_PLATFORMS = ['Claude Code', 'CodeBuddy', 'Antigravity', 'OpenCode'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function install(tool, lang) {
  for (const { src, enSrc, dest } of tool.files) {
    const fileSrc = lang === 'en' && enSrc ? enSrc : src;
    const url = `${REPO}/${fileSrc}`;
    const destPath = join(cwd, dest);
    const dir = join(destPath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const content = await fetch(url);
    writeFileSync(destPath, content);
    console.log(`    ${dest}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  moyu — anti-over-engineering rules for AI coding assistants

  Usage: npx moyu-dev [options]

  Options:
    --all        Install for all supported tools (not just detected ones)
    --lang en    Install English variants (default: Chinese)
    --list       Show all supported platforms
    --claude     Show Claude Code install command
    -h, --help   Show this help

  Supported tools: ${TOOLS.map((t) => t.name).join(', ')}
  Skill-based:    ${SKILL_PLATFORMS.join(', ')}
`);
    return;
  }

  console.log('\n  🐟 moyu — anti-over-engineering\n');

  if (args.includes('--list')) {
    console.log('  Auto-detect platforms (file-based install):');
    for (const t of TOOLS) console.log(`    - ${t.name}`);
    console.log('\n  Skill-based platforms (manual install):');
    for (const p of SKILL_PLATFORMS) console.log(`    - ${p}`);
    console.log('\n  Use --claude to see Claude Code install command.\n');
    return;
  }

  if (args.includes('--claude')) {
    console.log('  Run this command:');
    console.log('  claude skill install --url https://github.com/uucz/moyu --skill moyu\n');
    return;
  }

  const langIdx = args.indexOf('--lang');
  const lang = langIdx !== -1 && args[langIdx + 1] ? args[langIdx + 1] : 'zh';
  const all = args.includes('--all');
  const detected = TOOLS.filter((t) => all || t.detect());

  if (detected.length === 0) {
    console.log('  No AI tools detected in current directory.');
    console.log(`  Supported: ${TOOLS.map((t) => t.name).join(', ')}`);
    console.log('  Use --all to install for all tools, or --list to see all platforms.\n');
    return;
  }

  const skipped = TOOLS.filter((t) => !detected.includes(t));
  let installed = 0;

  for (const tool of detected) {
    console.log(`  ✓ ${tool.name} (${all ? 'all' : 'detected'})`);
    try {
      await install(tool, lang);
      installed++;
    } catch (e) {
      console.log(`    Failed: ${e.message}`);
    }
  }

  if (skipped.length > 0 && !all) {
    console.log(`\n  Skipped (not detected): ${skipped.map((t) => t.name).join(', ')}`);
  }

  console.log(`\n  Installed for ${installed}/${TOOLS.length} platforms.`);
  console.log('  Done. Three rules, zero over-engineering.\n');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
