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
    Automatically assign class_time, class_end_time, class_day, and hours_per_week if missing,
    ensuring no conflicts with existing schedules.
    """
    schedules = {t['id']: [] for t in teachers}
    teacher_hours = {t['id']: 0 for t in teachers}

    # Define possible class days and time slots (example: 8am to 5pm, 1-hour slots)
    possible_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    possible_times = [f"{hour:02d}:00" for hour in range(8, 17)]  # 8:00 to 16:00 start times

    def time_add_hour(time_str):
        dt = datetime.strptime(time_str, "%H:%M")
        dt_end = dt + timedelta(hours=1)
        return dt_end.strftime("%H:%M")

    def is_conflict(schedule, start_time, end_time, day):
        for entry in schedule:
            if entry.get('class_day') != day:
                continue
            existing_start = datetime.strptime(entry['start_time'], "%H:%M")
            existing_end = datetime.strptime(entry['end_time'], "%H:%M")
            new_start = datetime.strptime(start_time, "%H:%M")
            new_end = datetime.strptime(end_time, "%H:%M")
            # Check for overlap
            if new_start < existing_end and new_end > existing_start:
                return True
        return False

    for cls in classes:
        assigned_teacher_id = None

        # If class schedule fields missing, assign automatically
        if not cls.get('class_time') or not cls.get('class_end_time') or not cls.get('class_day') or not cls.get('hours_per_week'):
            assigned = False
            for day in possible_days:
                for start_time in possible_times:
                    end_time = time_add_hour(start_time)
                    # Check if this slot is free for any teacher
                    for teacher in teachers:
                        teacher_schedule = schedules[teacher['id']]
                        if is_conflict(teacher_schedule, start_time, end_time, day):
                            continue
                        # Check if adding this class exceeds max hours or violates rest periods
                        proposed_schedule = teacher_schedule + [{
                            'start_time': start_time,
                            'end_time': end_time,
                            'class_name': cls.get('name'),
                            'class_day': day
                        }]
                        if not is_schedule_feasible(teacher, proposed_schedule, constraints):
                            continue
                        # Assign schedule fields to class
                        cls['class_time'] = start_time
                        cls['class_end_time'] = end_time
                        cls['class_day'] = day
                        cls['hours_per_week'] = 1  # default 1 hour
                        assigned = True
                        break
                    if assigned:
                        break
                if assigned:
                    break
            if not assigned:
                # Could not assign schedule automatically
                pass

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
                'class_name': cls.get('name'),
                'class_day': cls.get('class_day')
            }]

            if not is_schedule_feasible(teacher, proposed_schedule, constraints):
                continue

            # Assign class to teacher
            schedules[teacher['id']].append({
                'start_time': cls.get('class_time'),
                'end_time': cls.get('class_end_time'),
                'class_name': cls.get('name'),
                'class_day': cls.get('class_day')
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
    import traceback
    try:
        teachers_file = sys.argv[1]
        classes_file = sys.argv[2]
        constraints_file = sys.argv[3]
        preferences_file = sys.argv[4]

        import sys
        print(f"Loading input files: {teachers_file}, {classes_file}, {constraints_file}, {preferences_file}", file=sys.stderr, flush=True)

        with open(teachers_file) as f:
            teachers = json.load(f)
        with open(classes_file) as f:
            classes = json.load(f)
        with open(constraints_file) as f:
            constraints = json.load(f)
        with open(preferences_file) as f:
            preferences = json.load(f)

        print(f"Loaded {len(teachers)} teachers, {len(classes)} classes", file=sys.stderr, flush=True)

        schedules = generate_flexible_schedule(teachers, classes, constraints, preferences)
        print(json.dumps(schedules, indent=2))
    except Exception as e:
        print("Error in flexible_scheduling.py:", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
