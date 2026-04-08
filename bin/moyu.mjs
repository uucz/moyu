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
    files: [{ src: 'cursor/rules/moyu.mdc', dest: '.cursor/rules/moyu.mdc' }],
  },
  {
    name: 'VS Code / Copilot',
    detect: () => existsSync(join(cwd, '.vscode')),
    files: [{ src: 'vscode/copilot-instructions.md', dest: '.github/copilot-instructions.md' }],
  },
  {
    name: 'Windsurf',
    detect: () => existsSync(join(cwd, '.windsurf')),
    files: [{ src: 'windsurf/rules/moyu.md', dest: '.windsurf/rules/moyu.md' }],
  },
  {
    name: 'Cline',
    detect: () => existsSync(join(cwd, '.cline')),
    files: [{ src: 'cline/moyu.md', dest: '.cline/rules/moyu.md' }],
  },
  {
    name: 'Codex',
    detect: () => existsSync(join(cwd, 'AGENTS.md')) || existsSync(join(cwd, 'codex.md')),
    files: [{ src: 'codex/moyu/SKILL.md', dest: 'AGENTS.md' }],
  },
  {
    name: 'Kiro',
    detect: () => existsSync(join(cwd, '.kiro')),
    files: [{ src: 'kiro/steering/moyu.md', dest: '.kiro/steering/moyu.md' }],
  },
];

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

async function install(tool) {
  for (const { src, dest } of tool.files) {
    const url = `${REPO}/${src}`;
    const destPath = join(cwd, dest);
    const dir = join(destPath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const content = await fetch(url);
    writeFileSync(destPath, content);
    console.log(`  ${dest}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  moyu — anti-over-engineering rules for AI coding assistants

  Usage: npx moyu-dev [options]

  Options:
    --all       Install for all supported tools (not just detected ones)
    --claude    Show Claude Code install command
    -h, --help  Show this help

  Detected tools in current directory are installed automatically.
  For Claude Code, use: claude skill install --url https://github.com/uucz/moyu --skill moyu
`);
    return;
  }

  console.log('\n  🐟 moyu — anti-over-engineering\n');

  if (args.includes('--claude')) {
    console.log('  Run this command:');
    console.log('  claude skill install --url https://github.com/uucz/moyu --skill moyu\n');
    return;
  }

  const all = args.includes('--all');
  const detected = TOOLS.filter((t) => all || t.detect());

  if (detected.length === 0) {
    console.log('  No AI tools detected in current directory.');
    console.log('  Supported: Cursor, VS Code, Windsurf, Cline, Codex, Kiro');
    console.log('  Use --all to install for all tools, or --claude for Claude Code.\n');
    return;
  }

  for (const tool of detected) {
    console.log(`  Installing for ${tool.name}...`);
    try {
      await install(tool);
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }

  console.log('\n  Done. Three rules, zero over-engineering.\n');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
