/**
 * Moyu Linter — diff parser, config loader, and over-engineering signal detectors.
 * Zero dependencies. Designed for low false positives across Python, JS/TS, Go, Rust, Java, etc.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// File classification & filtering
// ---------------------------------------------------------------------------

const CODE_EXTENSIONS = new Set([
  '.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.go', '.rs', '.java', '.kt', '.swift', '.rb', '.php',
  '.c', '.cc', '.cpp', '.h', '.hpp', '.cs', '.scala',
]);

const LOCKFILE_NAMES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb',
  'Cargo.lock', 'poetry.lock', 'Pipfile.lock', 'Gemfile.lock', 'composer.lock', 'go.sum',
]);

const DEFAULT_IGNORE = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  'vendor/**',
  '**/*.min.*',
  '**/*.map',
  '**/*.snap',
];

const TEST_PATH_RE = /(^|\/)(__tests__|tests?|spec|fixtures)\/|(\.|_)(test|spec)\.[^./]+$|\/test_[^/]+\.py$|^test_[^/]+\.py$/i;

export function getExtension(filePath) {
  const base = filePath.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot).toLowerCase() : '';
}

export function isLockfile(filePath) {
  const base = filePath.split('/').pop() || '';
  return LOCKFILE_NAMES.has(base);
}

export function isCodeFile(filePath) {
  return CODE_EXTENSIONS.has(getExtension(filePath));
}

export function isTestFile(filePath) {
  return TEST_PATH_RE.test(filePath);
}

function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.*/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

export function matchesAnyGlob(filePath, patterns) {
  const normalized = filePath.replace(/^\.\//, '');
  return patterns.some((p) => globToRegex(p).test(normalized));
}

export function loadConfig(cwd = process.cwd()) {
  const configPath = join(cwd, '.moyurc.json');
  const defaults = {
    threshold: 0,
    hookThreshold: 6,
    maxFiles: 8,
    ignore: [],
    disableSignals: [],
    enabled: true,
  };
  if (!existsSync(configPath)) return defaults;
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      ...defaults,
      ...raw,
      ignore: Array.isArray(raw.ignore) ? raw.ignore : [],
      disableSignals: Array.isArray(raw.disableSignals) ? raw.disableSignals : [],
    };
  } catch {
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Unified diff parser
// ---------------------------------------------------------------------------

export function parseDiff(diffText) {
  const files = [];
  let current = null;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git')) {
      if (current) files.push(current);
      const match = line.match(/ b\/(.+)$/);
      current = {
        path: match ? match[1] : '?',
        added: [],
        removed: [],
        hunks: 0,
        isNew: false,
        isDeleted: false,
      };
      continue;
    }
    if (!current) continue;

    if (line.startsWith('new file mode')) {
      current.isNew = true;
      continue;
    }
    if (line.startsWith('deleted file mode')) {
      current.isDeleted = true;
      continue;
    }
    if (line.startsWith('@@')) {
      current.hunks++;
      const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (m) current._lineNum = parseInt(m[1], 10);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      current.added.push({ num: current._lineNum || 0, content: line.slice(1) });
      if (current._lineNum) current._lineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      current.removed.push({ content: line.slice(1) });
    } else if (!line.startsWith('\\')) {
      if (current._lineNum) current._lineNum++;
    }
  }

  if (current) files.push(current);
  return files;
}

function stripInlineComment(line) {
  // Lightweight strip for single-line comments without breaking URLs
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return '';
  }
  return line;
}

// ---------------------------------------------------------------------------
// Signal detectors
// ---------------------------------------------------------------------------

const FUNC_DECL_RE = /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:def\s+\w+|function\s+\w+|class\s+\w+|fn\s+\w+|func\s+(?:\([^)]*\)\s*)?\w+|(?:public|private|protected|static|readonly|\s)*(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^={]+)?\{|(?:const|let)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|\w+)\s*=>)/;

/**
 * 1. Detect docstrings/JSDoc blocks added to existing functions (or bloated docstrings).
 */
export function detectUnnecessaryDocstrings(files) {
  const details = [];
  let score = 0;

  for (const file of files) {
    if (!isCodeFile(file.path) || isTestFile(file.path) || file.isDeleted) continue;
    const lines = file.added.map((l) => l.content);
    if (lines.length === 0) continue;

    let docBlocks = 0;
    let docLines = 0;
    let inBlock = false;
    let blockQuote = null;

    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!inBlock) {
        if (trimmed.startsWith('/**')) {
          docBlocks++;
          docLines++;
          if (!trimmed.includes('*/')) {
            inBlock = true;
            blockQuote = '*/';
          }
        } else if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
          const q = trimmed.slice(0, 3);
          docBlocks++;
          docLines++;
          // Multi-line triple-quoted string if closing quote is not on the same line
          if (trimmed.length === 3 || !trimmed.slice(3).includes(q)) {
            inBlock = true;
            blockQuote = q;
          }
        }
      } else {
        docLines++;
        if (trimmed.includes(blockQuote)) {
          inBlock = false;
          blockQuote = null;
        }
      }
    }

    if (docBlocks === 0) continue;

    const addedFuncs = lines.filter((l) => FUNC_DECL_RE.test(l)).length;
    const unrequestedBlocks = Math.max(0, docBlocks - addedFuncs);

    if (unrequestedBlocks > 0) {
      score += unrequestedBlocks;
      details.push(`${file.path}: ${unrequestedBlocks} docstring block(s) added to existing code`);
    } else if (addedFuncs > 0 && docLines > addedFuncs * 12) {
      const bloat = Math.ceil((docLines - addedFuncs * 12) / 10);
      score += bloat;
      details.push(`${file.path}: ${docLines} docstring lines for ${addedFuncs} new function(s)`);
    }
  }

  return { id: 'docstrings', signal: 'Unnecessary docstrings', score, details };
}

/**
 * 2. Detect excessive defensive error handling (try/catch/except/raise/throw).
 */
export function detectExcessiveErrorHandling(files) {
  const details = [];
  let score = 0;
  const errorRe = /\b(try\s*[:{]|catch\s*\(|except\b|raise\s|throw\s|\.catch\(|\.on\(['"]error)/;

  for (const file of files) {
    if (!isCodeFile(file.path) || isTestFile(file.path) || file.isDeleted) continue;
    const codeLines = file.added.map((l) => stripInlineComment(l.content)).filter((l) => l.trim().length > 0);
    if (codeLines.length < 8) continue;

    const errorLines = codeLines.filter((l) => errorRe.test(l)).length;
    const ratio = errorLines / codeLines.length;

    if (ratio > 0.25 && errorLines >= 3) {
      score += Math.ceil(errorLines / 3);
      details.push(`${file.path}: ${errorLines}/${codeLines.length} added code lines are error handling (${Math.round(ratio * 100)}%)`);
    }
  }

  return { id: 'error-handling', signal: 'Excessive error handling', score, details };
}

/**
 * 3. Detect unrequested new non-test code files (potential scope creep).
 */
export function detectNewFiles(files) {
  const details = [];
  let score = 0;

  for (const file of files) {
    if (!file.isNew || !isCodeFile(file.path) || isTestFile(file.path)) continue;
    if (file.added.length > 15) {
      score += 1;
      details.push(`${file.path}: new code file (+${file.added.length} lines)`);
    }
  }

  return { id: 'new-files', signal: 'New files created', score, details };
}

/**
 * 4. Detect runtime type-checking bloat (isinstance, typeof, type()).
 */
export function detectTypeCheckBloat(files) {
  const details = [];
  let score = 0;
  const typeRe = /\b(isinstance\(|typeof\s+\w|type\(\w+\)\s*(?:==|is|!=)|Array\.isArray\()/;

  for (const file of files) {
    if (!isCodeFile(file.path) || isTestFile(file.path) || file.isDeleted) continue;
    const typeChecks = file.added
      .map((l) => stripInlineComment(l.content))
      .filter((l) => typeRe.test(l)).length;

    if (typeChecks >= 3) {
      score += Math.ceil(typeChecks / 3);
      details.push(`${file.path}: ${typeChecks} runtime type checks added`);
    }
  }

  return { id: 'type-checks', signal: 'Type-check bloat', score, details };
}

/**
 * 5. Detect speculative abstractions (design pattern proliferation or multi-class explosion).
 * Intentionally ignores ordinary TypeScript `type X = ...` aliases and single data classes/interfaces.
 */
export function detectUnnecessaryAbstractions(files) {
  const details = [];
  let score = 0;

  const classOrInterfaceRe = /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+class|class|interface)\s+([A-Z]\w*)/;
  const patternNameRe = /(Factory|Strategy|Builder|Observer|Singleton|Adapter|Decorator|Proxy|Facade|Abstract[A-Z]\w*|Base[A-Z]\w*(?:Handler|Manager|Service|Processor))/;

  for (const file of files) {
    if (!isCodeFile(file.path) || isTestFile(file.path) || file.isDeleted) continue;

    const declaredTypes = [];
    const patternDecls = [];

    for (const { content } of file.added) {
      const clean = stripInlineComment(content);
      const m = clean.match(classOrInterfaceRe);
      if (m) {
        const name = m[1];
        declaredTypes.push(name);
        if (patternNameRe.test(name)) {
          patternDecls.push(name);
        }
      }
    }

    if (patternDecls.length > 0) {
      score += patternDecls.length * 2;
      details.push(`${file.path}: speculative pattern abstraction(s) (${patternDecls.slice(0, 4).join(', ')})`);
    }
    if (declaredTypes.length >= 3) {
      score += declaredTypes.length - 2;
      details.push(`${file.path}: ${declaredTypes.length} new class/interface declarations in one file`);
    }
  }

  return { id: 'abstractions', signal: 'Unnecessary abstractions', score, details };
}

/**
 * 6. Detect whole-file rewrites (high symmetric add/remove churn in a single hunk on an existing file).
 */
export function detectFileRewrite(files) {
  const details = [];
  let score = 0;

  for (const file of files) {
    if (file.isNew || file.isDeleted || !isCodeFile(file.path)) continue;
    const added = file.added.length;
    const removed = file.removed.length;
    if (removed < 35 || added < 35) continue;

    const symmetry = Math.min(added, removed) / Math.max(added, removed);
    if (file.hunks === 1 && symmetry >= 0.7) {
      score += 2;
      details.push(`${file.path}: possible whole-file rewrite (-${removed}/+${added} lines in 1 hunk)`);
    }
  }

  return { id: 'file-rewrite', signal: 'Whole-file rewrite', score, details };
}

/**
 * 7. Detect scope creep: many files modified relative to a focused change.
 */
export function detectScopeCreep(files, prTitle = '', _prBody = '', options = {}) {
  const details = [];
  let score = 0;
  const maxFiles = options.maxFiles || 8;

  const meaningfulFiles = files.filter((f) => !isLockfile(f.path));
  const changedFiles = meaningfulFiles.length;

  if (changedFiles > maxFiles) {
    score += Math.ceil((changedFiles - maxFiles) / 3);
    details.push(`${changedFiles} files changed (limit ${maxFiles}) — consider splitting this change`);
  }

  const trimmedTitle = prTitle.trim();
  if (trimmedTitle) {
    const titleWords = trimmedTitle.split(/\s+/).length;
    if (titleWords <= 3 && changedFiles > 5) {
      score += 1;
      details.push(`Short PR title ("${trimmedTitle}") but ${changedFiles} files changed`);
    }
  }

  return { id: 'scope-creep', signal: 'Scope creep', score, details };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function analyzeDiff(diffText, options = {}) {
  const ignorePatterns = [...DEFAULT_IGNORE, ...(options.ignore || [])];
  const disabled = new Set(options.disableSignals || []);
  const allFiles = parseDiff(diffText);
  const files = allFiles.filter((f) => !matchesAnyGlob(f.path, ignorePatterns));

  const detectors = [
    () => detectUnnecessaryDocstrings(files),
    () => detectExcessiveErrorHandling(files),
    () => detectNewFiles(files),
    () => detectTypeCheckBloat(files),
    () => detectUnnecessaryAbstractions(files),
    () => detectFileRewrite(files),
    () => detectScopeCreep(files, options.prTitle || '', options.prBody || '', { maxFiles: options.maxFiles }),
  ];

  const results = detectors
    .map((run) => run())
    .filter((r) => !disabled.has(r.id));

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const grade =
    totalScore === 0 ? 'Perfect'
    : totalScore <= 3 ? 'Minor'
    : totalScore <= 6 ? 'Moderate'
    : 'High';

  return {
    totalScore,
    grade,
    results,
    filesAnalyzed: files.length,
    filesIgnored: allFiles.length - files.length,
  };
}
