def fix_teacher_strands(strand_assignments, teachers):
    """
    Given strand assignments (mapping strand -> list of teacher names) and list of teacher dicts,
    returns a mapping of teacher name -> list of strands assigned.
    """
    teacher_strands = {}
    # Initialize teacher_strands with empty lists
    for teacher in teachers:
        teacher_name = teacher.get('name') or teacher.get('full_name')
        teacher_strands[teacher_name] = []

    # Reverse mapping from strand_assignments
    for strand, assigned_teachers in strand_assignments.items():
        for teacher_name in assigned_teachers:
            if teacher_name in teacher_strands:
                teacher_strands[teacher_name].append(strand)
            else:
                # In case teacher_name not in teachers list, add it
                teacher_strands[teacher_name] = [strand]

    # Remove duplicate strands per teacher
    for teacher_name in teacher_strands:
        teacher_strands[teacher_name] = list(set(teacher_strands[teacher_name]))

    return teacher_strands

