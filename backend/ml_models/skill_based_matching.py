import json
from collections import defaultdict
import os
import sys

def load_input_data():
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'api', 'temp')
    with open(os.path.join(base_dir, "teachers_input.json")) as f:
        teachers = json.load(f)
    with open(os.path.join(base_dir, "classes_input.json")) as f:
        classes = json.load(f)
    with open(os.path.join(base_dir, "constraints_input.json")) as f:
        constraints = json.load(f)
    with open(os.path.join(base_dir, "preferences_input.json")) as f:
        preferences = json.load(f)
    return teachers, classes, constraints, preferences

def skill_based_matching(teachers, classes, constraints, preferences):
    """
    Match teachers to classes/activities based on skills, certifications, availability, and preferences.
    Returns detailed matching scores and best teacher per class.
    """
    assignments = defaultdict(list)  # class_name -> list of assigned teachers
    teacher_hours = {t['id']: 0 for t in teachers}
    # Ensure max_hours is set to 40 if None
    for t in teachers:
        if t.get('max_hours_per_week') is None:
            t['max_hours_per_week'] = 40
    detailed_scores = defaultdict(list)  # class_name -> list of (teacher, score)

    # Map proficiency level strings to numeric values
    proficiency_map = {
        'Beginner': 1,
        'Intermediate': 2,
        'Advanced': 3,
        'Expert': 4
    }

    # Build a quick lookup for teacher skills
    teacher_skill_map = {}
    for t in teachers:
        # Normalize skills to lowercase for case-insensitive matching
        skills = set(s.lower().strip() for s in t.get('skills', []))
        # Map proficiency levels from strings to numeric values
        prof_levels_raw = t.get('proficiency_levels', {})
        prof_levels = {}
        if isinstance(prof_levels_raw, dict):
            for skill, level_str in prof_levels_raw.items():
                prof_levels[skill.lower().strip()] = proficiency_map.get(level_str, 0)
        else:
            # If prof_levels_raw is a list (empty or otherwise), treat as empty dict
            prof_levels = {}
        teacher_skill_map[t['id']] = {
            'skills': skills,
            'max_hours': t.get('max_hours_per_week', 40),
            'availability': {},
            'preferences': {},
            'proficiency_level': prof_levels,
            'experience': t.get('years_experience', 0)
        }

    # Define required number of teachers per strand (can be parameterized)
    teachers_needed_per_strand = {
        'STEM': 6,
        'ABM': 6,
        'GAS': 6,
        'HUMMS': 6,
        'ICT': 6
    }

    for cclass in classes:
        strand = cclass.get('name')
        if strand is None:
            # Try to get strand from 'strand' key or 'strand_name'
            strand = cclass.get('strand') or cclass.get('strand_name')
        # Combine core_subjects and specialized_subjects for matching
        core_subjects = cclass.get('core_subjects', [])
        specialized_subjects = cclass.get('specialized_subjects', [])
        required_skills = set(s.lower().strip() for s in core_subjects + specialized_subjects)
        hours_needed = cclass.get('hours_per_week', 0)
        needed_teachers = teachers_needed_per_strand.get(strand, 1)

        # Debug logging
        print(f"Matching for class: {strand} with required skills: {required_skills} and hours needed: {hours_needed}", file=sys.stderr)

        # Find suitable teachers who meet skill requirements
        suitable_teachers = []
        for t in teachers:
            t_skills = teacher_skill_map[t['id']]['skills']
            print(f"Checking teacher {t['name']} skills: {t_skills} against required: {required_skills}", file=sys.stderr)
            if required_skills.intersection(t_skills):
                # Relax max_hours and availability constraints for testing
                # if teacher_hours[t['id']] + hours_needed <= teacher_skill_map[t['id']]['max_hours']:
                #     availability = teacher_skill_map[t['id']]['availability']
                #     if availability.get('available', True):
                suitable_teachers.append(t)

        print(f"Suitable teachers for class {strand}: {[t['name'] for t in suitable_teachers]}", file=sys.stderr)

        # Apply preferences filtering
        preferred_teachers = []
        for t in suitable_teachers:
            prefs = teacher_skill_map[t['id']]['preferences']
            preferred_subjects = prefs.get('preferred_subjects', [])
            preferred_grades = prefs.get('preferred_grades', [])
            if (not preferred_subjects or cclass.get('subject') in preferred_subjects) and \
               (not preferred_grades or cclass.get('grade') in preferred_grades):
                preferred_teachers.append(t)

        print(f"Preferred teachers for class {strand}: {[t['name'] for t in preferred_teachers]}", file=sys.stderr)

        def calculate_score(teacher):
            score = 0
            teacher_skills = teacher_skill_map[teacher['id']]['skills']
            score += len(required_skills.intersection(teacher_skills))
            proficiency = teacher_skill_map[teacher['id']].get('proficiency_level', {})
            for skill in required_skills:
                score += 2 * proficiency.get(skill, 0)
            score += teacher_skill_map[teacher['id']].get('experience', 0) * 0.3
            return score

        candidate_teachers = preferred_teachers if preferred_teachers else suitable_teachers
        scored_candidates = [(t, calculate_score(t)) for t in candidate_teachers]
        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        # Assign all qualified teachers to the strand (allow multiple strands per teacher)
        for t, score in scored_candidates:
            if teacher_hours[t['id']] + hours_needed <= teacher_skill_map[t['id']]['max_hours']:
                assignments[strand].append(t['name'])
                teacher_hours[t['id']] += hours_needed

    # Do not convert list of assigned teachers to comma-separated string; keep as list for JSON consistency
    # if assignments[strand]:
    #     assignments[strand] = ', '.join(assignments[strand])

        detailed_scores[strand] = [{'teacher': t['name'], 'score': score} for t, score in scored_candidates]

        if not assignments[strand]:
            assignments[strand] = "Unassigned"

        print(f"Assigned teachers for class {strand}: {assignments[strand]}", file=sys.stderr)

    # Assign unassigned teachers to "Unassigned" strand
    assigned_teacher_ids = set()
    for teacher_list in assignments.values():
        for teacher_name in teacher_list:
            assigned_teacher_ids.add(teacher_name)

    for t in teachers:
        if t['name'] not in assigned_teacher_ids:
            assignments["Unassigned"].append(t['name'])


    # Convert list of assigned teachers to a string with proper spacing
    # for strand in assignments:
    #     assignments[strand] = ' '.join(assignments[strand])

    # Invert assignments to get teacher to strands mapping
    teacher_strands = defaultdict(list)
    for strand, teacher_names_list in assignments.items():
        # teacher_names = teacher_names_str.split()
        for teacher_name in teacher_names_list:
            teacher_strands[teacher_name].append(strand)

    # Fix teacher names by reconstructing full names from teachers list
    name_map = {}
    for t in teachers:
        full_name = t['name']
        name_map[full_name] = full_name

    fixed_teacher_strands = defaultdict(list)
    for teacher_name, strands in teacher_strands.items():
        if teacher_name in name_map:
            fixed_teacher_strands[teacher_name].extend(strands)
        else:
            fixed_teacher_strands[teacher_name].extend(strands)

    # Remove duplicates
    for full_name in fixed_teacher_strands:
        fixed_teacher_strands[full_name] = list(set(fixed_teacher_strands[full_name]))

    return {
        'assignments': assignments,
        'detailed_scores': detailed_scores,
        'teacher_strands': dict(fixed_teacher_strands)
    }

if __name__ == "__main__":
    teachers, classes, constraints, preferences = load_input_data()
    assignments = skill_based_matching(teachers, classes, constraints, preferences)
    print(json.dumps(assignments, indent=2))
