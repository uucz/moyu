from datetime import datetime
import re


def validate_email(email):
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if re.match(pattern, email):
        return True
    return False


def format_task(task):
    s = "[" + task["status"].upper() + "] "
    s = s + task["title"]
    s = s + " (assigned to: " + task["assignee"] + ")"
    return s


def format_date(dt_string):
    dt = datetime.fromisoformat(dt_string)
    return dt.strftime("%Y-%m-%d")


def calculate_priority_score(priority):
    if priority == "high":
        return 3
    elif priority == "medium":
        return 2
    elif priority == "low":
        return 1
    else:
        return 0


PRIORITIES = ["low", "medium", "high"]
MAX_TITLE_LENGTH = 200
