import json
from datetime import datetime, timedelta

def is_teacher_available(teacher, cls, teacher_hours, constraints, preferences):
    # Check if teacher has required skills
    if not set(cls.get('required_skills', [])).issubset(set(teacher.get('subjects_expertise', []) + teacher.get('additional_skills', []))):
        return False

    # Check max hours per week constraint
    if teacher_hours[teacher['id']] + cls.get('hours_per_week', 0) > teacher.get('max_hours_per_week', 30):
        return False

    # Check teacher preferred teaching hours (morning, afternoon)
    preferred_hours = teacher.get('preferences', {}).get('preferred_hours', None)
    class_time = cls.get('class_time', None)  # Expected format: "HH:MM"
    if preferred_hours and class_time:
        hour = int(class_time.split(':')[0])
        if preferred_hours == 'morning' and hour >= 12:
            return False
        if preferred_hours == 'afternoon' and hour < 12:
            return False

    # Check preferred days off
    preferred_days_off = teacher.get('preferences', {}).get('preferred_days_off', [])
    class_day = cls.get('class_day', None)  # Expected format: "Monday", "Tuesday", etc.
    if class_day and class_day in preferred_days_off:
        return False

    # Check shift preferences if applicable
    shift_preference = teacher.get('preferences', {}).get('shift_preference', None)
    class_shift = cls.get('shift', None)  # e.g., "early", "late"
    if shift_preference and class_shift and shift_preference != class_shift:
        return False

    # Check compliance requirements: max teaching hours per week
    max_hours = constraints.get('max_hours_per_week', 40)
    if teacher_hours[teacher['id']] + cls.get('hours_per_week', 0) > max_hours:
        return False

    # Check minimum rest periods between shifts (simplified)
    # Assuming teacher has a schedule dict with last class end time
    last_class_end = teacher.get('last_class_end', None)
    if last_class_end and class_time:
        class_start = datetime.strptime(class_time, "%H:%M")
        last_end = datetime.strptime(last_class_end, "%H:%M")
        rest_period = constraints.get('min_rest_hours', 8)
        if (class_start - last_end).total_seconds() < rest_period * 3600:
            return False

    # Check workforce availability: leave requests, substitute availability, overtime willingness
    if teacher.get('on_leave', False):
        return False

    # Additional checks can be added here...

    return True

def distribute_workload(teachers, classes, constraints, preferences):
    assignments = {}
    teacher_hours = {t['id']: 0 for t in teachers}

    for cls in classes:
        assigned_teacher = None
        for teacher in teachers:
            if is_teacher_available(teacher, cls, teacher_hours, constraints, preferences):
                assigned_teacher = teacher['name']
                teacher_hours[teacher['id']] += cls.get('hours_per_week', 0)
                # Update last_class_end for rest period checks
                cls_end_time = cls.get('class_end_time', None)
                if cls_end_time:
                    teacher['last_class_end'] = cls_end_time
                break
        if assigned_teacher is None:
            assigned_teacher = "Unassigned"
        assignments[cls['name']] = assigned_teacher

    return assignments

if __name__ == "__main__":
    import sys
    teachers_file = sys.argv[1]
    classes_file = sys.argv[2]
    constraints_file = sys.argv[3]
    preferences_file = sys.argv[4]

    with open(teachers_file) as f:
        teachers = json.load(f)
    with open(classes_file) as f:
        classes = json.load(f)
    with open(constraints_file) as f:
        constraints = json.load(f)
    with open(preferences_file) as f:
        preferences = json.load(f)

    assignments = distribute_workload(teachers, classes, constraints, preferences)
    print(json.dumps(assignments))
