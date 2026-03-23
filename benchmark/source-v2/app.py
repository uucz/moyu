import json
import os
from datetime import datetime

# Global database connection
db_path = "tasks.json"

def load_tasks():
    if os.path.exists(db_path):
        f = open(db_path, "r")
        data = json.load(f)
        f.close()
        return data
    return []

def save_tasks(tasks):
    f = open(db_path, "w")
    json.dump(tasks, f)
    f.close()

def add_task(title, priority, assignee):
    tasks = load_tasks()
    id = max([t["id"] for t in tasks], default=0) + 1
    task = {
        "id": id,
        "title": title,
        "priority": priority,
        "assignee": assignee,
        "status": "open",
        "created": str(datetime.now()),
    }
    tasks.append(task)
    save_tasks(tasks)
    return task

def get_task(id):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] == id:
            return t
    return None

def complete_task(id):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] == id:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)

def delete_task(id):
    tasks = load_tasks()
    new_tasks = []
    for t in tasks:
        if t["id"] != id:
            new_tasks.append(t)
    save_tasks(new_tasks)

def list_tasks(status=None):
    tasks = load_tasks()
    if status:
        result = []
        for t in tasks:
            if t["status"] == status:
                result.append(t)
        return result
    return tasks

def get_stats():
    tasks = load_tasks()
    total = len(tasks)
    open_count = 0
    done_count = 0
    for t in tasks:
        if t["status"] == "open":
            open_count = open_count + 1
        elif t["status"] == "done":
            done_count = done_count + 1
    return {"total": total, "open": open_count, "done": done_count}

def search(keyword):
    tasks = load_tasks()
    results = []
    for t in tasks:
        if keyword.lower() in t["title"].lower():
            results.append(t)
    return results

def assign_task(id, assignee):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] == id:
            t["assignee"] = assignee
    save_tasks(tasks)

def get_overdue_tasks(days):
    tasks = load_tasks()
    overdue = []
    for t in tasks:
        if t["status"] == "open":
            created = datetime.fromisoformat(t["created"])
            if (datetime.now() - created).days > days:
                overdue.append(t)
    return overdue


if __name__ == "__main__":
    add_task("Fix login bug", "high", "alice")
    add_task("Update README", "low", "bob")
    add_task("Add tests", "medium", "alice")
    print(list_tasks())
    print(get_stats())
