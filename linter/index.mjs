#!/usr/bin/env node

/**
 * Moyu Lint — detect over-engineering signals in PRs and local git diffs.
 * Zero dependencies. Works as GitHub Action, git pre-commit check, or standalone CLI.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { request } from 'https';
import { pathToFileURL } from 'url';
import { analyzeDiff, loadConfig } from './signals.mjs';

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

export function generateReport(analysis) {
  const { totalScore, results } = analysis;
  const FISH = totalScore === 0 ? '🐟' : totalScore <= 3 ? '🐠' : '🐡';
  const gradeDesc =
    totalScore === 0 ? 'Perfect — no over-engineering detected'
    : totalScore <= 3 ? 'Minor — a few signals detected'
    : totalScore <= 6 ? 'Moderate — consider simplifying'
    : 'High — this PR may be over-engineered';

  let md = `<!-- moyu-lint -->\n`;
  md += `## ${FISH} Moyu Lint Report\n\n`;
  md += `**Score: ${totalScore}** — ${gradeDesc}\n\n`;

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
  md += `> Install anti-over-engineering rules: \`npx skills add uucz/moyu\`\n`;
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

  const comments = await githubApi('GET', `${commentsPath}?per_page=100`, null, token);
  const existing = comments.find((c) => c.body && c.body.includes(MARKER));

  if (existing) {
    await githubApi('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, { body: report }, token);
  } else {
    await githubApi('POST', commentsPath, { body: report }, token);
  }
}

// ---------------------------------------------------------------------------
// Git diff helper
// ---------------------------------------------------------------------------

function runGitDiff(gitArgs) {
  return execFileSync('git', ['diff', ...gitArgs], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

function printHelp() {
  console.log(`
  Moyu Lint — detect over-engineering signals in diffs and PRs

  Usage:
    node linter/index.mjs [diff-target] [options]

  Modes:
    <ref>               Diff against git ref (default: HEAD~1)
    --staged            Lint staged changes (ideal for git pre-commit)
    --working           Lint all uncommitted working-tree changes (git diff HEAD)
    --stdin             Read unified diff from stdin

  Options:
    --threshold=N       Exit with code 1 if score exceeds N (default: 0 = report only)
    --max-files=N       Scope-creep file threshold (default: 8)
    --ignore=a,b        Comma-separated glob patterns to ignore
    --json              Output structured JSON instead of markdown
    -h, --help          Show this help
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const isGitHubAction = Boolean(process.env.GITHUB_ACTIONS) && !args.includes('--stdin') && !args.includes('--staged') && !args.includes('--working');
  const config = loadConfig(process.cwd());

  let diffText = '';
  let prTitle = '';
  let prBody = '';
  let prNumber = null;
  let repo = '';
  let token = '';
  let threshold = config.threshold || 0;
  let maxFiles = config.maxFiles || 8;
  let ignore = [...config.ignore];
  let shouldComment = true;
  let jsonMode = args.includes('--json');

  if (isGitHubAction) {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    const event = eventPath ? JSON.parse(readFileSync(eventPath, 'utf-8')) : {};

    prNumber = event.pull_request?.number || event.number;
    prTitle = event.pull_request?.title || '';
    prBody = event.pull_request?.body || '';
    repo = process.env.GITHUB_REPOSITORY || '';
    token = process.env.INPUT_GITHUB_TOKEN || process.env['INPUT_GITHUB-TOKEN'] || process.env.GITHUB_TOKEN || '';
    if (process.env.INPUT_THRESHOLD) threshold = parseInt(process.env.INPUT_THRESHOLD, 10);
    if (process.env.INPUT_IGNORE) {
      ignore.push(...process.env.INPUT_IGNORE.split(',').map((s) => s.trim()).filter(Boolean));
    }
    shouldComment = (process.env.INPUT_COMMENT || 'true') !== 'false';

    const baseSha = event.pull_request?.base?.sha;
    const headSha = event.pull_request?.head?.sha;

    if (baseSha && headSha) {
      try { execFileSync('git', ['fetch', '--depth=100', 'origin'], { stdio: 'pipe' }); } catch {}
      diffText = runGitDiff([`${baseSha}...${headSha}`]);
    } else {
      diffText = runGitDiff(['HEAD~1']);
    }
  } else {
    const thresholdArg = args.find((a) => a.startsWith('--threshold='));
    if (thresholdArg) threshold = parseInt(thresholdArg.split('=')[1], 10);

    const maxFilesArg = args.find((a) => a.startsWith('--max-files='));
    if (maxFilesArg) maxFiles = parseInt(maxFilesArg.split('=')[1], 10);

    const ignoreArg = args.find((a) => a.startsWith('--ignore='));
    if (ignoreArg) {
      ignore.push(...ignoreArg.slice('--ignore='.length).split(',').map((s) => s.trim()).filter(Boolean));
    }

    if (args.includes('--stdin')) {
      diffText = readFileSync(0, 'utf-8');
    } else if (args.includes('--staged')) {
      diffText = runGitDiff(['--cached']);
    } else if (args.includes('--working')) {
      diffText = runGitDiff(['HEAD']);
    } else {
      const diffTarget = args.find((a) => !a.startsWith('--')) || 'HEAD~1';
      diffText = runGitDiff([diffTarget]);
    }
    shouldComment = false;
  }

  if (!diffText.trim()) {
    if (jsonMode) {
      console.log(JSON.stringify({ totalScore: 0, grade: 'Perfect', results: [], filesAnalyzed: 0, filesIgnored: 0 }));
    } else {
      console.log('No diff found. Nothing to lint.');
    }
    return;
  }

  const analysis = analyzeDiff(diffText, {
    prTitle,
    prBody,
    maxFiles,
    ignore,
    disableSignals: config.disableSignals,
  });
  const report = generateReport(analysis);

  if (jsonMode) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(report);
  }

  if (isGitHubAction) {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      writeFileSync(outputFile, `score=${analysis.totalScore}\nreport<<EOF\n${report}\nEOF\n`, { flag: 'a' });
    }

    if (shouldComment && prNumber && token) {
      try {
        await postOrUpdateComment(repo, prNumber, report, token);
        console.log(`Comment posted on PR #${prNumber}`);
      } catch (e) {
        console.log(`Warning: could not post comment: ${e.message}`);
      }
    }
  }

  if (threshold > 0 && analysis.totalScore > threshold) {
    if (!jsonMode) {
      console.error(`Score ${analysis.totalScore} exceeds threshold ${threshold}`);
    }
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  });
}
