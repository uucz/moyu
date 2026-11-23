import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  analyzeDiff,
  detectExcessiveErrorHandling,
  detectFileRewrite,
  detectNewFiles,
  detectScopeCreep,
  detectTypeCheckBloat,
  detectUnnecessaryAbstractions,
  detectUnnecessaryDocstrings,
  parseDiff,
} from '../signals.mjs';
import { generateReport } from '../index.mjs';
import { evaluateHookPayload } from '../hook.mjs';

const LINTER_CLI = resolve('linter/index.mjs');
const HOOK_CLI = resolve('linter/hook.mjs');

function makeDiff(path, addedLines, { removedLines = [], isNew = false, hunks = 1 } = {}) {
  const parts = [`diff --git a/${path} b/${path}`];
  if (isNew) parts.push('new file mode 100644');
  parts.push(`--- ${isNew ? '/dev/null' : `a/${path}`}`);
  parts.push(`+++ b/${path}`);
  for (let h = 0; h < hunks; h++) {
    parts.push(`@@ -1,${removedLines.length} +1,${addedLines.length} @@`);
    if (h === 0) {
      for (const r of removedLines) parts.push(`-${r}`);
      for (const a of addedLines) parts.push(`+${a}`);
    } else {
      parts.push('+const extra = 1;');
    }
  }
  return parts.join('\n') + '\n';
}

test('parseDiff extracts added/removed lines, hunks, and new-file flag', () => {
  const diff = makeDiff('src/app.py', ['return None', 'x = 1'], { removedLines: ['pass'], isNew: false });
  const files = parseDiff(diff);
  assert.equal(files.length, 1);
  assert.equal(files[0].path, 'src/app.py');
  assert.equal(files[0].added.length, 2);
  assert.equal(files[0].removed.length, 1);
  assert.equal(files[0].hunks, 1);
  assert.equal(files[0].isNew, false);
});

test('detectUnnecessaryDocstrings flags docstrings on existing functions but allows concise docstrings on new functions', () => {
  const existingDocDiff = makeDiff('src/app.py', [
    '    """Mark task done.',
    '    Args: task_id',
    '    """',
    '    return None',
  ]);
  const r1 = detectUnnecessaryDocstrings(parseDiff(existingDocDiff));
  assert.equal(r1.score, 1);

  const newFuncConciseDocDiff = makeDiff('src/app.ts', [
    '/**',
    ' * Compute priority score.',
    ' */',
    'export function calcScore(n: number) {',
    '  return n * 2;',
    '}',
  ]);
  const r2 = detectUnnecessaryDocstrings(parseDiff(newFuncConciseDocDiff));
  assert.equal(r2.score, 0);

  const markdownDiff = makeDiff('README.md', ['"""', 'example', '"""']);
  assert.equal(detectUnnecessaryDocstrings(parseDiff(markdownDiff)).score, 0);
});

test('detectExcessiveErrorHandling flags defensive bloat and ignores test files', () => {
  const bloatedDiff = makeDiff('src/service.py', [
    'def run(x):',
    '    try:',
    '        if not x:',
    '            raise ValueError("bad")',
    '        return work(x)',
    '    except KeyError:',
    '        raise RuntimeError("missing")',
    '    except Exception:',
    '        raise',
  ]);
  assert.ok(detectExcessiveErrorHandling(parseDiff(bloatedDiff)).score >= 1);

  const testDiff = makeDiff('tests/test_service.py', [
    'def test_raises():',
    '    try:',
    '        raise ValueError("a")',
    '    except ValueError:',
    '        pass',
    '    try:',
    '        raise KeyError("b")',
    '    except KeyError:',
    '        pass',
  ]);
  assert.equal(detectExcessiveErrorHandling(parseDiff(testDiff)).score, 0);
});

test('detectNewFiles flags new non-test code files >15 lines and skips tests/docs', () => {
  const lines = Array.from({ length: 20 }, (_, i) => `const v${i} = ${i};`);
  assert.equal(detectNewFiles(parseDiff(makeDiff('src/helper.js', lines, { isNew: true }))).score, 1);
  assert.equal(detectNewFiles(parseDiff(makeDiff('src/helper.test.js', lines, { isNew: true }))).score, 0);
  assert.equal(detectNewFiles(parseDiff(makeDiff('docs/notes.md', lines, { isNew: true }))).score, 0);
});

test('detectTypeCheckBloat triggers at >=3 runtime type checks and ignores comments', () => {
  const bloat = makeDiff('src/util.py', [
    'if isinstance(a, int): pass',
    'if isinstance(b, str): pass',
    'if isinstance(c, list): pass',
  ]);
  assert.equal(detectTypeCheckBloat(parseDiff(bloat)).score, 1);

  const commented = makeDiff('src/util.py', [
    '# isinstance(a, int)',
    '# isinstance(b, str)',
    '# isinstance(c, list)',
  ]);
  assert.equal(detectTypeCheckBloat(parseDiff(commented)).score, 0);
});

test('detectUnnecessaryAbstractions ignores ordinary TS type aliases and catches pattern proliferation', () => {
  const normalTs = makeDiff('src/types.ts', [
    'export type TaskId = string;',
    'export type Status = "open" | "done";',
    'export interface Task {',
    '  id: TaskId;',
    '  status: Status;',
    '}',
  ]);
  assert.equal(detectUnnecessaryAbstractions(parseDiff(normalTs)).score, 0);

  const overAbstracted = makeDiff('src/factory.ts', [
    'export class TaskFactory {}',
    'export class PriorityStrategy {}',
    'export class TaskBuilder {}',
  ]);
  assert.ok(detectUnnecessaryAbstractions(parseDiff(overAbstracted)).score >= 6);
});

test('detectFileRewrite catches whole-file rewrites in a single symmetric hunk', () => {
  const oldLines = Array.from({ length: 45 }, (_, i) => `line_${i} = ${i}`);
  const newLines = Array.from({ length: 46 }, (_, i) => `new_line_${i} = ${i}`);
  const rewrite = makeDiff('src/app.py', newLines, { removedLines: oldLines, hunks: 1 });
  assert.equal(detectFileRewrite(parseDiff(rewrite)).score, 2);

  const multiHunk = makeDiff('src/app.py', newLines, { removedLines: oldLines, hunks: 2 });
  assert.equal(detectFileRewrite(parseDiff(multiHunk)).score, 0);
});

test('detectScopeCreep excludes lockfiles and honors maxFiles', () => {
  const diffs = Array.from({ length: 8 }, (_, i) => makeDiff(`src/f${i}.js`, ['export const x = 1;']))
    .concat([makeDiff('package-lock.json', ['"version": "1.0.0"'])])
    .join('');
  assert.equal(detectScopeCreep(parseDiff(diffs), 'Add feature with detailed description').score, 0);

  const tooMany = diffs + makeDiff('src/f8.js', ['export const x = 1;']);
  assert.ok(detectScopeCreep(parseDiff(tooMany), 'Fix bug').score >= 2);
});

test('analyzeDiff respects ignore globs and disableSignals', () => {
  const diff = makeDiff('generated/factory.ts', [
    'export class TaskFactory {}',
  ]);
  const ignored = analyzeDiff(diff, { ignore: ['generated/**'] });
  assert.equal(ignored.totalScore, 0);
  assert.equal(ignored.filesIgnored, 1);

  const disabled = analyzeDiff(diff, { disableSignals: ['abstractions'] });
  assert.equal(disabled.totalScore, 0);
});

test('generateReport uses npx skills add CTA and never mentions npx moyu-dev', () => {
  const analysis = analyzeDiff(makeDiff('src/factory.ts', ['export class TaskFactory {}']));
  const report = generateReport(analysis);
  assert.match(report, /npx skills add uucz\/moyu/);
  assert.doesNotMatch(report, /npx moyu-dev/);
});

test('CLI --stdin supports --json and --threshold exit codes', () => {
  const bloatedDiff = makeDiff('src/factory.ts', ['export class TaskFactory {}']);

  const jsonRun = spawnSync(process.execPath, [LINTER_CLI, '--stdin', '--json'], {
    input: bloatedDiff,
    encoding: 'utf-8',
  });
  assert.equal(jsonRun.status, 0);
  const parsed = JSON.parse(jsonRun.stdout);
  assert.equal(parsed.totalScore, 2);

  const failRun = spawnSync(process.execPath, [LINTER_CLI, '--stdin', '--threshold=1'], {
    input: bloatedDiff,
    encoding: 'utf-8',
  });
  assert.equal(failRun.status, 1);
});

test('Hook evaluator handles Stop block, stop_hook_active loop guard, PostToolUse context, and .moyurc.json', () => {
  const badDiff = makeDiff('src/factory.ts', [
    'export class TaskFactory {}',
    'export class TaskStrategy {}',
    'export class TaskBuilder {}',
    'export class TaskFacade {}',
  ]);

  // Stop hook blocks when over threshold
  const stopRes = evaluateHookPayload({ cwd: process.cwd(), stop_hook_active: false }, { mode: 'stop', threshold: 4, diffText: badDiff });
  assert.equal(stopRes.decision, 'block');
  assert.match(stopRes.reason, /Unnecessary abstractions/);

  // Stop hook steps aside when stop_hook_active is true
  const loopGuard = evaluateHookPayload({ cwd: process.cwd(), stop_hook_active: true }, { mode: 'stop', threshold: 4, diffText: badDiff });
  assert.equal(loopGuard, null);

  // PostToolUse returns non-blocking additionalContext on Edit
  const postRes = evaluateHookPayload(
    { cwd: process.cwd(), tool_name: 'Edit', tool_input: { file_path: 'src/factory.ts' } },
    { mode: 'post-tool', threshold: 2, diffText: badDiff }
  );
  assert.equal(postRes.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(postRes.hookSpecificOutput.additionalContext, /Moyu guardrail warning/);

  // PostToolUse ignores non-edit tools
  const readRes = evaluateHookPayload(
    { cwd: process.cwd(), tool_name: 'Read', tool_input: { file_path: 'src/factory.ts' } },
    { mode: 'post-tool', threshold: 2, diffText: badDiff }
  );
  assert.equal(readRes, null);

  // Respects .moyurc.json enabled: false
  const tmpDir = mkdtempSync(join(tmpdir(), 'moyu-hook-test-'));
  try {
    writeFileSync(join(tmpDir, '.moyurc.json'), JSON.stringify({ enabled: false }));
    const disabledRes = evaluateHookPayload({ cwd: tmpDir }, { mode: 'stop', threshold: 1, diffText: badDiff });
    assert.equal(disabledRes, null);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Hook CLI runs cleanly against a real temp git repository', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'moyu-git-test-'));
  try {
    execFileSync('git', ['init'], { cwd: tmpDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, stdio: 'ignore' });
    writeFileSync(join(tmpDir, 'app.ts'), 'export const ok = true;\n');
    execFileSync('git', ['add', '.'], { cwd: tmpDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'init'], { cwd: tmpDir, stdio: 'ignore' });

    // Introduce speculative pattern bloat
    writeFileSync(
      join(tmpDir, 'app.ts'),
      'export const ok = true;\nexport class TaskFactory {}\nexport class TaskStrategy {}\nexport class TaskBuilder {}\n'
    );

    const run = spawnSync(process.execPath, [HOOK_CLI, '--mode=stop', '--threshold=4'], {
      input: JSON.stringify({ cwd: tmpDir, stop_hook_active: false }),
      encoding: 'utf-8',
    });
    assert.equal(run.status, 0);
    const out = JSON.parse(run.stdout);
    assert.equal(out.decision, 'block');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI --init scaffolds a valid .moyurc.json and does not overwrite existing config', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'moyu-init-test-'));
  try {
    const first = spawnSync(process.execPath, [LINTER_CLI, '--init'], { cwd: tmpDir, encoding: 'utf-8' });
    assert.equal(first.status, 0);
    assert.match(first.stdout, /Created \.moyurc\.json/);

    const second = spawnSync(process.execPath, [LINTER_CLI, '--init'], { cwd: tmpDir, encoding: 'utf-8' });
    assert.equal(second.status, 0);
    assert.match(second.stdout, /already exists/);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
