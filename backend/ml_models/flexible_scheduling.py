import json
from datetime import datetime, timedelta

def is_schedule_feasible(teacher, schedule, constraints):
    """
    Check if the proposed schedule for a teacher meets constraints such as max hours,
    minimum rest periods, and compliance requirements.
    """
    max_hours = constraints.get('max_hours_per_week', 40)
    min_rest_hours = constraints.get('min_rest_hours', 8)

    total_hours = 0
    last_end_time = None

    for entry in schedule:
        start_time = datetime.strptime(entry['start_time'], "%H:%M")
        end_time = datetime.strptime(entry['end_time'], "%H:%M")
        duration = (end_time - start_time).seconds / 3600
        total_hours += duration

        if last_end_time:
            rest_period = (start_time - last_end_time).seconds / 3600
            if rest_period < min_rest_hours:
                return False
        last_end_time = end_time

    if total_hours > max_hours:
        return False

    return True

def generate_flexible_schedule(teachers, classes, constraints, preferences):
    """
    Generate customizable schedules for teachers based on their preferences and school requirements.
    """
    schedules = {t['id']: [] for t in teachers}
    teacher_hours = {t['id']: 0 for t in teachers}

    for cls in classes:
        assigned_teacher_id = None
        for teacher in teachers:
            # Check if teacher prefers the class time and day
            prefs = teacher.get('preferences', {})
            preferred_hours = prefs.get('preferred_hours', None)
            preferred_days_off = prefs.get('preferred_days_off', [])
            class_time = cls.get('class_time', None)
            class_day = cls.get('class_day', None)

            if preferred_hours and class_time:
                hour = int(class_time.split(':')[0])
                if preferred_hours == 'morning' and hour >= 12:
                    continue
                if preferred_hours == 'afternoon' and hour < 12:
                    continue

            if class_day and class_day in preferred_days_off:
                continue

            # Check if adding this class exceeds max hours or violates rest periods
            proposed_schedule = schedules[teacher['id']] + [{
                'start_time': cls.get('class_time'),
                'end_time': cls.get('class_end_time'),
                'class_name': cls.get('name')
            }]

            if not is_schedule_feasible(teacher, proposed_schedule, constraints):
                continue

            # Assign class to teacher
            schedules[teacher['id']].append({
                'start_time': cls.get('class_time'),
                'end_time': cls.get('class_end_time'),
                'class_name': cls.get('name')
            })
            teacher_hours[teacher['id']] += cls.get('hours_per_week', 0)
            assigned_teacher_id = teacher['id']
            break

        if assigned_teacher_id is None:
            # Class remains unassigned
            pass

    return schedules

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

    schedules = generate_flexible_schedule(teachers, classes, constraints, preferences)
    print(json.dumps(schedules, indent=2))
