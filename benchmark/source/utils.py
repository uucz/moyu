import json
from datetime import datetime


def format_date(dt):
    return dt.strftime("%Y-%m-%d %H:%M")


def parse_priority(value):
    valid = ["low", "medium", "high"]
    if value in valid:
        return value
    return "medium"


def export_tasks(tasks, filepath):
    with open(filepath, "w") as f:
        json.dump(tasks, f)


def calculate_completion_rate(tasks):
    if not tasks:
        return 0
    done = sum(1 for t in tasks if t["done"])
    return round(done / len(tasks) * 100, 1)


TIMEOUT = 30
MAX_TASKS = 1000
