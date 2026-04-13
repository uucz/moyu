/**
 * Over-engineering signal detectors.
 * Each function takes a parsed diff and returns { signal, score, details }.
 */

/**
 * Detect docstrings/JSDoc added to existing functions (not new ones).
 */
export function detectUnnecessaryDocstrings(files) {
  const details = [];
  let score = 0;

  for (const file of files) {
    const addedLines = file.added.map((l) => l.content);
    const addedSet = new Set(file.added.map((l) => l.num));

    // Find docstring blocks in added lines
    const docPatterns = ['"""', "'''", '/**', '* @', '/// '];
    let docLines = 0;

    for (const line of addedLines) {
      const trimmed = line.trim();
      if (docPatterns.some((p) => trimmed.startsWith(p) || trimmed.endsWith('"""') || trimmed.endsWith("'''"))) {
        docLines++;
      }
    }

    if (docLines === 0) continue;

    // Check if the surrounding function definition is also new
    const funcPatterns = /^\s*(def |function |async function |const \w+ = |class )/;
    const addedFuncs = addedLines.filter((l) => funcPatterns.test(l)).length;

    // If docstrings outnumber new functions, some are on existing code
    const excess = Math.max(0, docLines - addedFuncs * 3); // Allow ~3 doc lines per new function
    if (excess > 0) {
      score += Math.ceil(excess / 3);
      details.push(`${file.path}: ${excess} docstring lines added to existing code`);
    }
  }

  return { signal: 'Unnecessary docstrings', score, details };
}

/**
 * Detect excessive error handling (try/catch/except/raise/throw).
 */
export function detectExcessiveErrorHandling(files) {
  const details = [];
  let score = 0;

  const errorPatterns = /\b(try\s*[:{]|catch\s*\(|except\s|raise\s|throw\s|\.catch\(|\.on\(['"]error)/;

  for (const file of files) {
    const addedLines = file.added.map((l) => l.content);
    const totalAdded = addedLines.length;
    if (totalAdded < 5) continue;

    const errorLines = addedLines.filter((l) => errorPatterns.test(l)).length;
    const ratio = errorLines / totalAdded;

    // Flag if >20% of added lines are error handling
    if (ratio > 0.2 && errorLines >= 3) {
      score += Math.ceil(errorLines / 3);
      details.push(`${file.path}: ${errorLines}/${totalAdded} added lines are error handling (${Math.round(ratio * 100)}%)`);
    }
  }

  return { signal: 'Excessive error handling', score, details };
}

/**
 * Detect entirely new files (potential scope creep).
 */
export function detectNewFiles(files) {
  const details = [];
  let score = 0;

  for (const file of files) {
    if (file.isNew && file.added.length > 10) {
      score += 1;
      details.push(`${file.path}: new file (+${file.added.length} lines)`);
    }
  }

  return { signal: 'New files created', score, details };
}

/**
 * Detect type-checking bloat (isinstance, typeof, type()).
 */
export function detectTypeCheckBloat(files) {
  const details = [];
  let score = 0;

  const typePatterns = /\b(isinstance\(|typeof\s|type\(\w+\)\s*(==|is|!=)|\.isArray\(|\.isString\(|\.isNumber\()/;

  for (const file of files) {
    const addedLines = file.added.map((l) => l.content);
    const typeChecks = addedLines.filter((l) => typePatterns.test(l)).length;

    if (typeChecks >= 3) {
      score += Math.ceil(typeChecks / 3);
      details.push(`${file.path}: ${typeChecks} type-checking lines added`);
    }
  }

  return { signal: 'Type-check bloat', score, details };
}

/**
 * Detect unnecessary abstractions (new classes, interfaces, design patterns).
 */
export function detectUnnecessaryAbstractions(files) {
  const details = [];
  let score = 0;

  const abstractionPatterns = /^\s*(class\s+\w|interface\s+\w|abstract\s+class|type\s+\w+\s*=)/;
  const patternNames = /\b(Factory|Strategy|Builder|Observer|Singleton|Adapter|Decorator|Proxy|Facade)\b/;

  for (const file of files) {
    const addedLines = file.added.map((l) => l.content);

    const newAbstractions = addedLines.filter((l) => abstractionPatterns.test(l));
    const designPatterns = addedLines.filter((l) => patternNames.test(l));

    if (newAbstractions.length >= 1) {
      score += newAbstractions.length;
      details.push(`${file.path}: ${newAbstractions.length} new class/interface/type declarations`);
    }
    if (designPatterns.length >= 1) {
      score += designPatterns.length;
      details.push(`${file.path}: design pattern names detected (${designPatterns.map((l) => l.trim()).join(', ').slice(0, 80)})`);
    }
  }

  return { signal: 'Unnecessary abstractions', score, details };
}

/**
 * Detect scope creep: many files changed relative to a focused PR.
 */
export function detectScopeCreep(files, prTitle = '', prBody = '') {
  const details = [];
  let score = 0;

  const changedFiles = files.length;

  // Simple heuristic: more than 8 files in a single PR is suspicious
  if (changedFiles > 8) {
    score += Math.ceil((changedFiles - 8) / 3);
    details.push(`${changedFiles} files changed — consider splitting this PR`);
  }

  // Check if PR title/body mentions specific files or is very short
  const titleWords = prTitle.split(/\s+/).length;
  if (titleWords <= 3 && changedFiles > 5) {
    score += 1;
    details.push(`Short PR title ("${prTitle}") but ${changedFiles} files changed`);
  }

  return { signal: 'Scope creep', score, details };
}
