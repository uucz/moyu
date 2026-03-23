from datetime import datetime
from utils import parse_priority, calculate_completion_rate


class TaskManager:
    def __init__(self):
        self.tasks = []
        self.next_id = 1

    def add_task(self, title, priority="medium"):
        task = {
            "id": self.next_id,
            "title": title,
            "priority": parse_priority(priority),
            "done": False,
        }
        self.next_id += 1
        self.tasks.append(task)
        return task

    def get_task(self, task_id):
        for task in self.tasks:
            if task["id"] == task_id:
                return task
        return None

    def complete_task(self, task_id):
        task = self.get_task(task_id)
        task["done"] = True
        return task

    def list_tasks(self, filter_done=None):
        if filter_done is not None:
            return [t for t in self.tasks if t["done"] == filter_done]
        return self.tasks

    def delete_task(self, task_id):
        self.tasks = [t for t in self.tasks if t["id"] != task_id]

    def get_stats(self):
        total = len(self.tasks)
        done = len([t for t in self.tasks if t["done"]])
        return {"total": total, "done": done, "pending": total - done}

    def search_tasks(self, keyword):
        results = []
        for task in self.tasks:
            if keyword.lower() in task["title"].lower():
                results.append(task)
        return results


if __name__ == "__main__":
    tm = TaskManager()
    tm.add_task("Write tests", "high")
    tm.add_task("Fix bug", "urgent")
    tm.add_task("Update docs", "low")
    print(tm.list_tasks())
    print(tm.get_stats())
