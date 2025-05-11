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
    detailed_scores = defaultdict(list)  # class_name -> list of (teacher, score)

    # Build a quick lookup for teacher skills and certifications
    teacher_skill_map = {}
    for t in teachers:
        skills = set(t.get('subjects_expertise', [])) | set(t.get('additional_skills', []))
        certs = set(t.get('teaching_certifications', []))
        teacher_skill_map[t['id']] = {
            'skills': skills,
            'certifications': certs,
            'max_hours': t.get('max_hours_per_week', 40),
            'availability': t.get('availability', {}),
            'preferences': t.get('preferences', {}),
            'proficiency_level': t.get('proficiency_level', {}),
            'experience': t.get('experience', 0)
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
        required_skills = set(cclass.get('skill_certification_requirements', []))
        hours_needed = cclass.get('hours_per_week', 0)
        needed_teachers = teachers_needed_per_strand.get(strand, 1)

        # Debug logging
        print(f"Matching for class: {strand} with required skills: {required_skills} and hours needed: {hours_needed}", file=sys.stderr)

        # Find suitable teachers who meet skill and certification requirements
        suitable_teachers = []
        for t in teachers:
            t_skills = teacher_skill_map[t['id']]['skills']
            t_certs = teacher_skill_map[t['id']]['certifications']
            print(f"Checking teacher {t['name']} skills: {t_skills}, certs: {t_certs} against required: {required_skills}", file=sys.stderr)
            if required_skills.intersection(t_skills | t_certs):
                if teacher_hours[t['id']] + hours_needed <= teacher_skill_map[t['id']]['max_hours']:
                    availability = teacher_skill_map[t['id']]['availability']
                    if availability.get('available', True):
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
            teacher_skills_certs = teacher_skill_map[teacher['id']]['skills'] | teacher_skill_map[teacher['id']]['certifications']
            score += len(required_skills.intersection(teacher_skills_certs))
            proficiency = teacher_skill_map[teacher['id']].get('proficiency_level', {})
            for skill in required_skills:
                score += 2 * proficiency.get(skill, 0)
            score += teacher_skill_map[teacher['id']].get('experience', 0) * 0.3
            return score

        candidate_teachers = preferred_teachers if preferred_teachers else suitable_teachers
        scored_candidates = [(t, calculate_score(t)) for t in candidate_teachers]
        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        assigned_count = 0
        for t, score in scored_candidates:
            if assigned_count >= needed_teachers:
                break
            if teacher_hours[t['id']] + hours_needed <= teacher_skill_map[t['id']]['max_hours']:
                assignments[strand].append(t['name'])
                teacher_hours[t['id']] += hours_needed
                assigned_count += 1

        detailed_scores[strand] = [{'teacher': t['name'], 'score': score} for t, score in scored_candidates]

        if not assignments[strand]:
            assignments[strand] = ["Unassigned"]

        print(f"Assigned teachers for class {strand}: {assignments[strand]}", file=sys.stderr)

    # Convert list of assigned teachers to a string with proper spacing
    for strand in assignments:
        assignments[strand] = ' '.join(assignments[strand])

    return {
        'assignments': assignments,
        'detailed_scores': detailed_scores
    }

if __name__ == "__main__":
    teachers, classes, constraints, preferences = load_input_data()
    assignments = skill_based_matching(teachers, classes, constraints, preferences)
    print(json.dumps(assignments, indent=2))
