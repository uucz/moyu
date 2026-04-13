#!/usr/bin/env node

/**
 * Moyu Lint — detect over-engineering signals in PRs.
 * Zero dependencies. Works as GitHub Action or standalone CLI.
 *
 * GitHub Action: reads GITHUB_EVENT_PATH for PR context
 * CLI: reads diff from stdin or git diff
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { request } from 'https';
import {
  detectUnnecessaryDocstrings,
  detectExcessiveErrorHandling,
  detectNewFiles,
  detectTypeCheckBloat,
  detectUnnecessaryAbstractions,
  detectScopeCreep,
} from './signals.mjs';

// ---------------------------------------------------------------------------
// Diff parser
// ---------------------------------------------------------------------------

function parseDiff(diffText) {
  const files = [];
  let current = null;

  for (const line of diffText.split('\n')) {
    // New file in diff
    if (line.startsWith('diff --git')) {
      if (current) files.push(current);
      const match = line.match(/b\/(.+)$/);
      current = { path: match ? match[1] : '?', added: [], removed: [], isNew: false };
      continue;
    }
    if (!current) continue;

    if (line.startsWith('new file mode')) {
      current.isNew = true;
      continue;
    }

    // Hunk header: @@ -a,b +c,d @@
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (m) current._lineNum = parseInt(m[1], 10);
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      current.added.push({ num: current._lineNum || 0, content: line.slice(1) });
      if (current._lineNum) current._lineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      current.removed.push({ content: line.slice(1) });
    } else {
      if (current._lineNum) current._lineNum++;
    }
  }
  if (current) files.push(current);
  return files;
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function generateReport(results, totalScore, prTitle) {
  const FISH = totalScore === 0 ? '🐟' : totalScore <= 3 ? '🐠' : '🐡';
  const grade =
    totalScore === 0 ? 'Perfect — no over-engineering detected'
    : totalScore <= 3 ? 'Minor — a few signals detected'
    : totalScore <= 6 ? 'Moderate — consider simplifying'
    : 'High — this PR may be over-engineered';

  let md = `<!-- moyu-lint -->\n`;
  md += `## ${FISH} Moyu Lint Report\n\n`;
  md += `**Score: ${totalScore}** — ${grade}\n\n`;

  if (totalScore === 0) {
    md += `> Three rules, zero over-engineering. Well done!\n`;
    return md;
  }

  md += `| Signal | Score | Details |\n`;
  md += `|--------|------:|--------|\n`;

  for (const r of results) {
    if (r.score === 0) continue;
    const details = r.details.length > 0
      ? r.details.map((d) => `\`${d}\``).join('<br>')
      : '—';
    md += `| ${r.signal} | ${r.score} | ${details} |\n`;
  }

  md += `\n> **Moyu says:** The best code is the code you didn't write.\n`;
  md += `> Run \`npx moyu-dev\` to install anti-over-engineering rules.\n`;
  return md;
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

function githubApi(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'moyu-lint',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GitHub API ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          resolve(data ? JSON.parse(data) : null);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function postOrUpdateComment(repo, prNumber, report, token) {
  const MARKER = '<!-- moyu-lint -->';
  const commentsPath = `/repos/${repo}/issues/${prNumber}/comments`;

  // Find existing comment
  const comments = await githubApi('GET', `${commentsPath}?per_page=100`, null, token);
  const existing = comments.find((c) => c.body && c.body.includes(MARKER));

  if (existing) {
    await githubApi('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, { body: report }, token);
  } else {
    await githubApi('POST', commentsPath, { body: report }, token);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isGitHubAction = !!process.env.GITHUB_ACTIONS;

  let diffText = '';
  let prTitle = '';
  let prBody = '';
  let prNumber = null;
  let repo = '';
  let token = '';
  let threshold = 0;
  let shouldComment = true;

  if (isGitHubAction) {
    // GitHub Action mode
    const eventPath = process.env.GITHUB_EVENT_PATH;
    const event = JSON.parse(readFileSync(eventPath, 'utf-8'));

    prNumber = event.pull_request?.number || event.number;
    prTitle = event.pull_request?.title || '';
    prBody = event.pull_request?.body || '';
    repo = process.env.GITHUB_REPOSITORY;
    token = process.env.INPUT_GITHUB_TOKEN || process.env['INPUT_GITHUB-TOKEN'] || process.env.GITHUB_TOKEN || '';
    threshold = parseInt(process.env.INPUT_THRESHOLD || '0', 10);
    shouldComment = (process.env.INPUT_COMMENT || 'true') !== 'false';

    const baseSha = event.pull_request?.base?.sha;
    const headSha = event.pull_request?.head?.sha;

    if (baseSha && headSha) {
      // Fetch full history for the diff
      try { execSync('git fetch --depth=100 origin', { stdio: 'pipe' }); } catch {}
      diffText = execSync(`git diff ${baseSha}...${headSha}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } else {
      diffText = execSync('git diff HEAD~1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    }
  } else {
    // CLI mode: read from git diff or stdin
    const args = process.argv.slice(2);
    threshold = parseInt(args.find((a) => a.startsWith('--threshold='))?.split('=')[1] || '0', 10);

    if (args.includes('--stdin')) {
      diffText = readFileSync('/dev/stdin', 'utf-8');
    } else {
      const diffTarget = args.find((a) => !a.startsWith('--')) || 'HEAD~1';
      diffText = execSync(`git diff ${diffTarget}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    }
    shouldComment = false;
  }

  if (!diffText.trim()) {
    console.log('No diff found. Nothing to lint.');
    return;
  }

  // Parse and analyze
  const files = parseDiff(diffText);
  const results = [
    detectUnnecessaryDocstrings(files),
    detectExcessiveErrorHandling(files),
    detectNewFiles(files),
    detectTypeCheckBloat(files),
    detectUnnecessaryAbstractions(files),
    detectScopeCreep(files, prTitle, prBody),
  ];

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const report = generateReport(results, totalScore, prTitle);

  // Output
  console.log(report);

  if (isGitHubAction) {
    // Set outputs
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      writeFileSync(outputFile, `score=${totalScore}\nreport<<EOF\n${report}\nEOF\n`, { flag: 'a' });
    }

    // Post PR comment
    if (shouldComment && prNumber && token) {
      try {
        await postOrUpdateComment(repo, prNumber, report, token);
        console.log(`Comment posted on PR #${prNumber}`);
      } catch (e) {
        console.log(`Warning: could not post comment: ${e.message}`);
      }
    }

    // Fail if over threshold
    if (threshold > 0 && totalScore > threshold) {
      console.log(`Score ${totalScore} exceeds threshold ${threshold}`);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
