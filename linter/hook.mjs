#!/usr/bin/env node

/**
 * Moyu Agent Hook — deterministic over-engineering guardrail for Claude Code hooks.
 *
 * Protocols supported:
 *   --mode=stop       (default) Inspects uncommitted git diff when Claude finishes a turn.
 *                     Blocks stop (with actionable trim instructions) if score > threshold.
 *   --mode=post-tool  Inspects the single edited file after Edit/Write/MultiEdit.
 *                     Non-blocking: injects concise additionalContext if signals appear.
 *
 * Fails open (exits 0 silently) on non-git folders, disabled config, or stop_hook_active=true.
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { relative, resolve } from 'path';
import { pathToFileURL } from 'url';
import { analyzeDiff, loadConfig } from './signals.mjs';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'edit_file', 'write_file']);

function getGitDiff(cwd, filePath = null) {
  const execOpts = { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 };
  const targetArgs = filePath ? ['--', filePath] : [];

  try {
    return execFileSync('git', ['diff', 'HEAD', ...targetArgs], execOpts);
  } catch {
    // Repo may have no commits yet — fall back to staged diff
    try {
      return execFileSync('git', ['diff', '--cached', ...targetArgs], execOpts);
    } catch {
      return '';
    }
  }
}

function synthesizeNewFileDiff(cwd, filePath) {
  try {
    const absPath = resolve(cwd, filePath);
    if (!existsSync(absPath)) return '';
    const rel = relative(cwd, absPath).replace(/\\/g, '/');
    const content = readFileSync(absPath, 'utf-8');
    const lines = content.split('\n');
    const body = lines.map((l) => `+${l}`).join('\n');
    return [
      `diff --git a/${rel} b/${rel}`,
      'new file mode 100644',
      `--- /dev/null`,
      `+++ b/${rel}`,
      `@@ -0,0 +1,${lines.length} @@`,
      body,
    ].join('\n');
  } catch {
    return '';
  }
}

function summarizeSignals(analysis) {
  return analysis.results
    .filter((r) => r.score > 0)
    .map((r) => `${r.signal} (+${r.score}): ${r.details.join('; ')}`)
    .join(' | ');
}

export function evaluateHookPayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object') return null;
  if (process.env.MOYU_HOOK_DISABLED === '1') return null;

  const cwd = payload.cwd || process.cwd();
  const config = loadConfig(cwd);
  if (config.enabled === false) return null;

  const mode = options.mode || (payload.hook_event_name === 'PostToolUse' || payload.event === 'PostToolUse' ? 'post-tool' : 'stop');

  // Guard against infinite Stop-hook recursion
  if (mode === 'stop' && payload.stop_hook_active === true) {
    return null;
  }

  const envThreshold = process.env.MOYU_HOOK_THRESHOLD ? parseInt(process.env.MOYU_HOOK_THRESHOLD, 10) : null;
  const defaultThreshold = mode === 'post-tool' ? 2 : (config.hookThreshold ?? 6);
  const threshold = Number.isFinite(options.threshold)
    ? options.threshold
    : (Number.isFinite(envThreshold) ? envThreshold : defaultThreshold);

  let diffText = '';

  if (mode === 'post-tool') {
    const toolName = payload.tool_name || '';
    const filePath = payload.tool_input?.file_path || payload.tool_input?.path || '';
    if (!filePath || (toolName && !EDIT_TOOLS.has(toolName))) {
      return null;
    }
    diffText = options.diffText ?? getGitDiff(cwd, filePath);
    if (!diffText.trim()) {
      diffText = synthesizeNewFileDiff(cwd, filePath);
    }
  } else {
    diffText = options.diffText ?? getGitDiff(cwd);
  }

  if (!diffText.trim()) return null;

  const analysis = analyzeDiff(diffText, {
    maxFiles: config.maxFiles,
    ignore: config.ignore,
    disableSignals: config.disableSignals,
  });

  if (analysis.totalScore <= threshold) return null;

  const summary = summarizeSignals(analysis);

  if (mode === 'post-tool') {
    return {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Moyu guardrail warning (score ${analysis.totalScore} > ${threshold}): ${summary}. Keep only the minimal changes requested by the user.`,
      },
    };
  }

  return {
    decision: 'block',
    reason: `Moyu over-engineering guard triggered (score ${analysis.totalScore} > threshold ${threshold}). Detected: ${summary}. Before finishing, review your git diff and remove any unrequested docstrings, defensive checks, speculative abstractions, or out-of-scope edits unless explicitly requested by the user.`,
    systemMessage: `🐡 Moyu guard caught over-engineering signals (score ${analysis.totalScore}/${threshold}) — asking agent to trim diff.`,
  };
}

function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith('--mode='));
  const thresholdArg = args.find((a) => a.startsWith('--threshold='));

  const mode = modeArg ? modeArg.split('=')[1] : undefined;
  const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : undefined;

  let raw = '';
  try {
    raw = readFileSync(0, 'utf-8');
  } catch {
    return;
  }
  if (!raw.trim()) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const output = evaluateHookPayload(payload, { mode, threshold });
  if (output) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
