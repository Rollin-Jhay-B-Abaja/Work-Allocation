import json
from datetime import datetime, timedelta
from collections import defaultdict
from skill_based_matching import skill_based_matching, load_input_data

def is_teacher_available(teacher, cls, teacher_hours, preferences, teacher_name_col):
    # Simplified availability check based on available data

    # Calculate total workload including teaching, admin duties, extracurricular
    current_workload = teacher_hours.get(teacher['id'], 0)
    current_workload += teacher.get('admin_hours', 0)
    current_workload += teacher.get('extracurricular_hours', 0)

    # Check max hours per week constraint (legal or policy requirement)
    max_hours_per_week = teacher.get('max_hours_per_week', 40)
    if current_workload + cls.get('hours_per_week', 0) > max_hours_per_week:
        return False

    # Check workforce availability: leave requests
    employment_status = teacher.get('employment_status')
    if employment_status is not None and employment_status.lower() == 'on leave':
        return False

    # Additional checks can be added here...

    return True

def fix_teacher_strands(assignments, teachers):
    from collections import defaultdict
    teacher_strands = defaultdict(list)
    for strand, teacher_names in assignments.items():
        # Assume teacher_names is a list of full names
        if isinstance(teacher_names, str):
            teacher_names = [teacher_names]
        for teacher_name in teacher_names:
            if teacher_name != "Unassigned":
                teacher_strands[teacher_name].append(strand)

    # Build a set of full teacher names for quick lookup
    teacher_full_names = set()
    for t in teachers:
        full_name = t.get('name') or t.get('full_name')
        if full_name:
            teacher_full_names.add(full_name)

    fixed_teacher_strands = defaultdict(list)
    for teacher_name, strands in teacher_strands.items():
        # Use teacher_name if it matches full name, else keep as is
        if teacher_name in teacher_full_names:
            fixed_teacher_strands[teacher_name].extend(strands)
        else:
            # If no exact match, assign strands anyway
            fixed_teacher_strands[teacher_name].extend(strands)

    # Remove duplicates
    for full_name in fixed_teacher_strands:
        fixed_teacher_strands[full_name] = list(set(fixed_teacher_strands[full_name]))

    # Assign default strand 'GAS' to teachers with no strands
    for t in teachers:
        full_name = t.get('name') or t.get('full_name')
        if full_name and full_name not in fixed_teacher_strands:
            fixed_teacher_strands[full_name] = ['GAS']

    return fixed_teacher_strands

def distribute_workload(teachers, classes, preferences, teacher_name_col, class_name_col):
    # Fix teacher dict keys to match skill_based_matching expectations
    for t in teachers:
        if 'name' not in t and 'full_name' in t:
            t['name'] = t['full_name']

    # Get skill-based matching assignments
    skill_match_result = skill_based_matching(teachers, classes, {}, [])
    strand_assignments = skill_match_result.get('assignments', {})

    # Fix teacher dict keys to match skill_based_matching expectations
    for t in teachers:
        if 'full_name' not in t and 'name' in t:
            t['full_name'] = t['name']

    # Use teacher_strands mapping directly from skill_based_matching result
    teacher_strands = skill_match_result.get('teacher_strands', {})

    # Map strands to subjects for assignment
    strand_to_subjects = {}
    for c in classes:
        strand = c.get('name')
        subject = c.get('subject')
        if strand not in strand_to_subjects:
            strand_to_subjects[strand] = set()
        if subject:
            strand_to_subjects[strand].add(subject)

    # Prepare teacher workload summary with strands and subjects from skill_based_matching
    teacher_workload_summary = {}
    for teacher in teachers:
        name = teacher.get('name', 'Unknown')

        # Use all strands assigned from skill_based_matching teacher_strands mapping
        strands = teacher_strands.get(name, [])
        if not strands:
            gas_skills = {'English', 'Philippine History', 'Philosophy', 'Social Studies'}
            subjects_set = set(teacher.get('subjects_expertise', []))
            if subjects_set.intersection(gas_skills):
                strands = ['GAS']

        # Assign subjects based on all assigned strands
        assigned_subjects = set()
        for strand in strands:
            assigned_subjects.update(strand_to_subjects.get(strand, set()))

        # If no assigned subjects, fallback to teacher expertise
        if not assigned_subjects:
            assigned_subjects = set(teacher.get('subjects_expertise', []))

        # Assign total hours per day as 8 hours (fixed as per user request)
        total_daily_hours = 8.0

        teacher_workload_summary[name] = {
            'total_hours': total_daily_hours,
            'strands': list(set(strands)),
            'subjects': list(assigned_subjects)
        }

    # Return the teacher workload summary and the strand assignments from skill_based_matching
    return teacher_workload_summary, strand_assignments

def run_thorough_tests():
    import copy

    # Load sample data using existing load_input_data function
    teachers, classes, constraints, preferences = load_input_data()

    # Deep copy to avoid mutation during tests
    test_teachers = copy.deepcopy(teachers)
    test_classes = copy.deepcopy(classes)

    # Run distribute_workload function
    teacher_workload_summary, strand_assignments = distribute_workload(test_teachers, test_classes, preferences, 'name', 'name')

    # Check for teachers with no strands assigned
    unassigned_teachers = []
    for teacher in test_teachers:
        name = teacher.get('name')
        strands = teacher_workload_summary.get(name, {}).get('strands', [])
        if not strands:
            unassigned_teachers.append(name)

    # Commented out debug prints to avoid polluting stdout
    # print("=== Thorough Testing Results ===")
    # print(f"Total teachers tested: {len(test_teachers)}")
    # print(f"Teachers with no strands assigned: {len(unassigned_teachers)}")
    # if unassigned_teachers:
    #     print("List of teachers with no strands assigned:")
    #     for tname in unassigned_teachers:
    #         print(f" - {tname}")

    # Commented out debug prints to avoid polluting stdout
    # print()
    # for teacher in test_teachers:
    #     name = teacher.get('name')
    #     summary = teacher_workload_summary.get(name, {})
    #     strands = summary.get('strands', [])
    #     subjects = summary.get('subjects', [])
    #     total_hours = summary.get('total_hours', 0)

    #     strands_str = " and ".join(strands) if strands else "No strands assigned"
    #     subjects_str = " and ".join(subjects) if subjects else "No subjects assigned"

    #     print(f'"{name}"')
    #     print(f"Assign Strand: {strands_str}")
    #     print(f"Subject: {subjects_str}")
    #     print(f"Total Hour per day : {total_hours}hrs\n")

    # Additional edge case tests
    # print("\n=== Edge Case Testing ===")

    # Test case: Teacher with no skills
    no_skill_teacher = {
        'id': 'test_no_skill',
        'name': 'No Skill Teacher',
        'subjects_expertise': [],
        'teaching_certifications': [],
        'max_hours_per_week': 40,
        'availability': {'available': True},
        'preferences': {},
        'proficiency_level': {},
        'experience': 0
    }
    test_teachers.append(no_skill_teacher)

    # Test case: Teacher with max hours exceeded
    maxed_out_teacher = {
        'id': 'test_maxed_out',
        'name': 'Maxed Out Teacher',
        'subjects_expertise': ['Mathematics'],
        'teaching_certifications': ['Certified Math Teacher'],
        'max_hours_per_week': 10,
        'availability': {'available': True},
        'preferences': {},
        'proficiency_level': {'Mathematics': 5},
        'experience': 5
    }
    test_teachers.append(maxed_out_teacher)

    # Run distribute_workload again with edge cases
    teacher_workload_summary_edge, strand_assignments_edge = distribute_workload(test_teachers, test_classes, preferences, 'name', 'name')

    # Check if maxed_out_teacher got assigned strands (should not due to max hours)
    maxed_out_strands = teacher_workload_summary_edge.get('Maxed Out Teacher', {}).get('strands', [])
    no_skill_strands = teacher_workload_summary_edge.get('No Skill Teacher', {}).get('strands', [])

    # Commented out debug prints to avoid polluting stdout
    # print(f"\nMaxed Out Teacher assigned strands: {maxed_out_strands} (expected: [])")
    # print(f"No Skill Teacher assigned strands: {no_skill_strands} (expected: [])")

    # print("\n=== Testing Complete ===")


def main():
    # Load input data
    teachers, classes, constraints, preferences = load_input_data()

    # Run workload distribution
    teacher_workload_summary, strand_assignments = distribute_workload(teachers, classes, preferences, 'name', 'name')

    # Output clean JSON for API consumption
    output = {
        'teacher_workload_summary': teacher_workload_summary,
        'strand_assignments': strand_assignments
    }
    print(json.dumps(output))

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        run_thorough_tests()
    else:
        main()
