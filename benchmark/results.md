# 摸鱼 Benchmark Results

## Experiment Design

**Codebase**: A deliberately messy Python task manager (`app.py` + `helpers.py`) with verbose loops, no context managers, inconsistent patterns — designed to tempt AI into "improving" surrounding code.

**Method**: 6 tasks × 2 conditions = 12 experiments. Each task run independently with identical codebase.

- **Control group**: Prompted with *"Do your best work. Make the code robust and professional."*
- **摸鱼 group**: Prompted with *"Make the minimum change needed. Do not refactor, do not add docstrings, do not add validation beyond what's asked."*

## Quantitative Results

| Scenario | Task | Control Lines | 摸鱼 Lines | Reduction |
|----------|------|:---:|:---:|:---:|
| S1 | Fix null crash in `complete_task` | 4 | 4 | 0% |
| S2 | Add `list_tasks_sorted` function | 15 | 5 | **67%** |
| S3 | Add status filter to `search` | 27 | 4 | **85%** |
| S4 | Add `export_csv` function | 35 | 10 | **71%** |
| S5 | Add assignee filter to `list_tasks` | 17 | 17 | 0% |
| S6 | Add `bulk_complete` function | 43 | 8 | **81%** |
| **Total** | | **141** | **48** | **66%** |

## Over-Engineering Signals

| Signal | Control | 摸鱼 |
|--------|:---:|:---:|
| Docstrings added | 4 | 0 |
| `raise` statements | 6 | 0 |
| `isinstance` checks | 2 | 0 |
| Input validation blocks | 4 | 0 |
| Cross-file imports added | 1 | 0 |

## Scenario Details

### S1: Fix null crash in `complete_task`
**Task**: `complete_task(999)` silently saves even if ID doesn't exist. Fix it.

**Control** (4 lines):
```python
# Raises ValueError — adds error handling not requested
if t["id"] == id:
    t["status"] = "done"
    t["completed"] = str(datetime.now())
    save_tasks(tasks)
    return t
raise ValueError(f"Task with id {id} not found")
```

**摸鱼** (4 lines):
```python
# Returns None — consistent with get_task pattern
if t["id"] == id:
    t["status"] = "done"
    t["completed"] = str(datetime.now())
    save_tasks(tasks)
    return t
return None
```

**Analysis**: Both fix the bug. Control introduces a new exception type that callers must now handle. 摸鱼 follows the existing `get_task()` convention of returning `None`.

---

### S2: Add `list_tasks_sorted` function
**Task**: Add a function that returns tasks sorted by priority.

**Control** (15 lines):
```python
from helpers import calculate_priority_score  # new import

def list_tasks_sorted(status=None):
    """Return tasks sorted by priority (high first, then medium, then low).

    Args:
        status: Optional filter for task status...

    Returns:
        A list of task dicts sorted by descending priority.
    """
    tasks = list_tasks(status=status)
    return sorted(tasks, key=lambda t: calculate_priority_score(t.get("priority", "")), reverse=True)
```

**摸鱼** (5 lines):
```python
def list_tasks_sorted():
    tasks = load_tasks()
    order = {"high": 0, "medium": 1, "low": 2}
    return sorted(tasks, key=lambda t: order.get(t["priority"], 3))
```

**Analysis**: Control adds a cross-file dependency, a `status` filter parameter nobody asked for, 7-line docstring, and `.get()` defensive access. 摸鱼 writes a self-contained 5-line function.

---

### S3: Add status filter to `search`
**Task**: Add a `status` parameter to the `search` function.

**Control** (27 lines):
```python
def search(keyword, status=None):
    """Search tasks by keyword in title, optionally filtering by status.

    Args:
        keyword: Search term to match against task titles (case-insensitive).
        status: Optional status filter ("open" or "done")...

    Returns:
        A list of tasks whose titles contain the keyword...

    Raises:
        ValueError: If status is provided but not a recognized value.
    """
    valid_statuses = {"open", "done"}
    if status is not None:
        status = status.strip().lower()
        if status not in valid_statuses:
            raise ValueError(...)
    # ... actual logic
```

**摸鱼** (4 lines):
```python
def search(keyword, status=None):
    # ... existing logic unchanged
        if keyword.lower() in t["title"].lower():
            if status and t["status"] != status:
                continue
            results.append(t)
```

**Analysis**: Control adds 14-line docstring, input validation with `.strip().lower()` normalization, a `ValueError` with formatted message, and a hardcoded set of valid statuses. 摸鱼 adds 2 lines of actual logic.

---

### S4: Add `export_csv` function
**Task**: Add a function that exports tasks to CSV.

**Control** (35 lines):
```python
def export_csv(filepath):
    """Export all tasks to a CSV file...

    Args:
        filepath: Destination path for the CSV file.

    Returns:
        The number of tasks written.

    Raises:
        ValueError: If filepath is empty or None.
        OSError: If the file cannot be written...
    """
    if not filepath:
        raise ValueError("filepath must be a non-empty string")
    # ... directory existence check ...
    if parent_dir and not os.path.isdir(parent_dir):
        raise OSError(f"Directory does not exist: {parent_dir}")
    # ... actual CSV writing with encoding param ...
    return len(tasks)
```

**摸鱼** (10 lines):
```python
def export_csv(filepath):
    tasks = load_tasks()
    if not tasks:
        return
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=tasks[0].keys())
        writer.writeheader()
        writer.writerows(tasks)
```

**Analysis**: Control adds 11-line docstring, filepath validation, directory existence check, explicit encoding param, return value, and 2 custom exceptions. 摸鱼 writes working CSV export in 7 lines of logic.

---

### S5: Add assignee filter to `list_tasks`
**Task**: Add an `assignee` parameter to `list_tasks`.

**Control** (17 lines): Rewrites with `is not None` checks, `.get("assignee")` defensive access, single-pass `continue` pattern.

**摸鱼** (17 lines): Same structural rewrite, simpler conditions without `.get()`.

**Analysis**: Both made equivalent changes. The task was specific enough that even the "robust" prompt couldn't over-engineer much.

---

### S6: Add `bulk_complete` function
**Task**: Add a function that marks multiple tasks as done.

**Control** (43 lines):
```python
def bulk_complete(task_ids):
    """Mark multiple tasks as done in a single operation.
    ... (14-line docstring with Args, Returns, Raises) ...
    """
    if not isinstance(task_ids, list):
        raise TypeError("task_ids must be a list")
    for tid in task_ids:
        if not isinstance(tid, int):
            raise ValueError(f"Each task ID must be an integer, got {type(tid).__name__}")
    tasks = load_tasks()
    lookup = {t["id"]: t for t in tasks}  # optimization
    # ... completed/not_found tracking ...
    if completed:
        save_tasks(tasks)
    return {"completed": completed, "not_found": not_found}
```

**摸鱼** (8 lines):
```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

**Analysis**: Control adds 14-line docstring, type checking with `isinstance`, a lookup dict optimization unnecessary for this scale, not_found tracking nobody asked for, conditional save, and structured return value. 摸鱼 reuses the exact pattern from `complete_task` — consistent and minimal.

---

## Summary

Across 6 scenarios, the control group produced **66% more code** than necessary. The over-engineering manifests as:

1. **Unsolicited documentation** — Docstrings for internal functions in a small module
2. **Defensive programming** — Input validation, type checking, and custom exceptions for trusted internal callers
3. **Scope creep** — Adding parameters, return values, and features not requested
4. **Premature optimization** — Lookup dicts, conditional saves for lists that are typically < 100 items
5. **Cross-module coupling** — Importing from other files when inline logic suffices

The 摸鱼 group consistently delivered **working code that follows existing patterns**, with zero scope violations across all 6 experiments.
