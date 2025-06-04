import json
import os
from collections import defaultdict

STRAND_PARAMETERS = {
    "STEM": {
        "core_subjects": [
            "Oral Communication",
            "Komunikasyon at Pananaliksap",
            "General Mathematics",
            "Earth and Life Science",
            "PE and Health",
            "Personal Development",
            "Understanding Culture, Society, and Politics"
        ],
        "specialized_subjects": [
            "Pre-Calculus",
            "Basic Calculus",
            "General Biology 1 & 2",
            "General Chemistry 1 & 2",
            "General Physics 1 & 2",
            "Research/Capstone Project"
        ]
    },
    "ABM": {
        "core_subjects": [
            "Oral Communication",
            "Komunikasyon at Pananaliksap",
            "General Mathematics",
            "Earth and Life Science",
            "PE and Health",
            "Personal Development",
            "Understanding Culture, Society, and Politics"
        ],
        "specialized_subjects": [
            "Business Mathematics",
            "Fundamentals of Accountancy, Business, and Management 1 & 2",
            "Business Finance",
            "Organization and Management",
            "Principles of Marketing",
            "Work Immersion/Research"
        ]
    },
    "GAS": {
        "core_subjects": [
            "Oral Communication",
            "Komunikasyon at Pananaliksap",
            "General Mathematics",
            "Earth and Life Science",
            "PE and Health",
            "Personal Development",
            "Understanding Culture, Society, and Politics"
        ],
        "specialized_subjects": [
            "Humanities 1 & 2",
            "Social Science 1 & 2",
            "Applied Economics",
            "Research in Daily Life",
            "Media and Information Literacy",
            "Work Immersion"
        ]
    },
    "HUMSS": {
        "core_subjects": [
            "Oral Communication",
            "Komunikasyon at Pananaliksap",
            "General Mathematics",
            "Earth and Life Science",
            "PE and Health",
            "Personal Development",
            "Understanding Culture, Society, and Politics"
        ],
        "specialized_subjects": [
            "Creative Writing",
            "Disciplines and Ideas in Social Sciences",
            "Philippine Politics and Governance",
            "Community Engagement",
            "Trends in Social Sciences",
            "Research in Social Sciences"
        ]
    },
    "ICT": {
        "core_subjects": [
            "Oral Communication",
            "Komunikasyon at Pananaliksap",
            "General Mathematics",
            "Earth and Life Science",
            "PE and Health",
            "Personal Development",
            "Understanding Culture, Society, and Politics"
        ],
        "specialized_subjects": [
            "Computer Systems Servicing (NC II)",
            "Programming (Java, Python, etc.)",
            "Web Development",
            "Animation",
            "Work Immersion (ICT Industry)"
        ]
    }
}

# Provided skill-based matching scores per strand
SKILL_BASED_MATCHING_SCORES = {
    "STEM": {
        "Alice Johnson": 3.00,
        "Kevin White": 3.00,
        "Michael Scott": 3.00,
        "Quincy Adams": 3.00,
        "Steve Rogers": 3.00,
        "David Lee": 3.00,
        "Frank Miller": 3.00,
        "Ian Clark": 3.00
    },
    "ABM": {
        "Alice Johnson": 2.00,
        "Bob Smith": 2.00
    },
    "GAS": {
        "Jane Doe": 2.00,
        "Laura Wilson": 2.00,
        "Nina Patel": 2.00,
        "Pam Beesly": 2.00,
        "Rachel Green": 2.00,
        "Bob Smith": 2.00,
        "Eva Green": 2.00,
        "Hannah Brown": 2.00,
        "John ReyDo": 1.00,
        "James Smith": 1.00,
        "Rollin": 1.00,
        "Alice Johnson": 1.00,
        "Grace Hopper": 1.00
    },
    "HUMSS": {
        "Carol Williams": 3.00,
        "Jane Doe": 2.00,
        "Nina Patel": 2.00,
        "Pam Beesly": 2.00,
        "Rachel Green": 2.00,
        "Bob Smith": 2.00,
        "Eva Green": 2.00,
        "Hannah Brown": 2.00,
        "Laura Wilson": 1.00,
        "Tina Turner": 1.00,
        "Grace Hopper": 1.00
    },
    "ICT": {
        "Oscar Martinez": 1.00,
        "Tina Turner": 1.00,
        "Carol Williams": 1.00,
        "Grace Hopper": 1.00
    }
}

def combined_workload_skill_matching(teachers, classes, preferences, teacher_name_col, class_name_col, prediction_data=None):
    """
    Assign teachers to strands based on provided skill-based matching scores,
    assign at least one specialized subject per teacher per strand,
    ensuring no subject is assigned to multiple teachers in the same strand.
    """
    hours_per_subject = 4

    frontend_output = []
    all_teachers_output = []

    teacher_assigned_hours = defaultdict(float)
    strand_assigned_subjects = defaultdict(set)

    # Build teacher to strands mapping from SKILL_BASED_MATCHING_SCORES
    teacher_to_strands = defaultdict(list)
    for strand, teacher_scores in SKILL_BASED_MATCHING_SCORES.items():
        for teacher_name in teacher_scores.keys():
            teacher_to_strands[teacher_name].append(strand)

    # Build strand to subjects mapping from STRAND_PARAMETERS
    strand_to_subjects = {}
    for strand, params in STRAND_PARAMETERS.items():
        subjects = set(params.get('core_subjects', []) + params.get('specialized_subjects', []))
        strand_to_subjects[strand] = subjects

    # Infer teacher skills from assigned strands
    teacher_skills_map = {}
    for teacher in teachers:
        teacher_name = teacher.get('name') or teacher.get('full_name')
        assigned_strands = teacher_to_strands.get(teacher_name, [])
        skills = set()
        for strand in assigned_strands:
            skills.update(sub.lower() for sub in strand_to_subjects.get(strand, []))
        teacher_skills_map[teacher_name] = skills

    # Assign specialized subjects uniquely per strand
    for strand, teacher_scores in SKILL_BASED_MATCHING_SCORES.items():
        strand_params = STRAND_PARAMETERS.get(strand, None)
        if strand_params is None:
            continue
        specialized_subjects = strand_params['specialized_subjects']
        assigned_subjects = set()
        # Sort teachers by score descending
        sorted_teachers = sorted(teacher_scores.items(), key=lambda x: x[1], reverse=True)
        for teacher_name, score in sorted_teachers:
            teacher = next((t for t in teachers if (t.get('name') or t.get('full_name')) == teacher_name), None)
            if not teacher:
                continue
            teacher_skills = teacher_skills_map.get(teacher_name, set())
            subjects_hours = {}
            # Assign one specialized subject not yet assigned
            for subject in specialized_subjects:
                if subject in assigned_subjects:
                    continue
                if subject.lower() in teacher_skills:
                    subjects_hours[subject] = hours_per_subject
                    assigned_subjects.add(subject)
                    break
            # If no specialized subject assigned, assign default
            if not subjects_hours:
                subjects_hours["No assigned specialized subject"] = hours_per_subject
            total_hours = sum(subjects_hours.values())
            # Add core subjects optionally
            core_subjects = strand_params['core_subjects']
            for core_subj in core_subjects:
                if core_subj.lower() in teacher_skills:
                    subjects_hours[core_subj] = hours_per_subject
            total_hours = sum(subjects_hours.values())
            # Enforce max hours per week cap
            max_hours_per_week = teacher.get('max_hours_per_week', 40)
            if teacher_assigned_hours[teacher_name] + total_hours > max_hours_per_week:
                total_hours = max_hours_per_week - teacher_assigned_hours[teacher_name]
                # Adjust subjects_hours proportionally or remove some subjects (simplified here by skipping assignment)
                # For simplicity, skip assignment if it exceeds max hours
                continue
            teacher_assigned_hours[teacher_name] += total_hours
            subjects_list = [{'subject': sub, 'hours_per_week': hrs} for sub, hrs in subjects_hours.items()]
            assigned_strands = teacher_to_strands.get(teacher_name, [])
            frontend_output.append({
                'teacher': teacher_name,
                'assigned_strands': assigned_strands,
                'subjects': subjects_list,
                'total_hours_per_day': round(teacher_assigned_hours[teacher_name] / 5, 2)
            })
            all_teachers_output.append({
                'teacher': teacher_name,
                'assigned_strands': assigned_strands,
                'subjects': subjects_list,
                'total_hours_per_week': teacher_assigned_hours[teacher_name],
                'fully_loaded': teacher_assigned_hours[teacher_name] >= max_hours_per_week
            })

    # Workload balancing: assign additional subjects to teachers with less than max hours
    max_hours_per_week = 40
    for teacher_name, assigned_hours in teacher_assigned_hours.items():
        if assigned_hours >= max_hours_per_week:
            continue
        teacher = next((t for t in teachers if (t.get('name') or t.get('full_name')) == teacher_name), None)
        if not teacher:
            continue
        teacher_skills = teacher_skills_map.get(teacher_name, set())
        # Find strands not yet assigned to this teacher
        assigned_strands = set(teacher_to_strands.get(teacher_name, []))
        unassigned_strands = set(STRAND_PARAMETERS.keys()) - assigned_strands
        # Track subjects already assigned to this teacher to avoid duplicates
        frontend_entry = next((e for e in frontend_output if e['teacher'] == teacher_name), None)
        assigned_subjects = set(sub['subject'] for sub in frontend_entry['subjects']) if frontend_entry else set()
        # Track subjects assigned in strands to avoid duplicates across teachers
        strand_assigned_subjects = defaultdict(set)
        for entry in frontend_output:
            for strand in entry['assigned_strands']:
                for subj in entry['subjects']:
                    strand_assigned_subjects[strand].add(subj['subject'])
        assigned_new_subject = True
        while assigned_new_subject and teacher_assigned_hours[teacher_name] < max_hours_per_week:
            assigned_new_subject = False
            assigned_strands = set(teacher_to_strands.get(teacher_name, []))
            unassigned_strands = set(STRAND_PARAMETERS.keys()) - assigned_strands
            for strand in list(unassigned_strands):
                strand_params = STRAND_PARAMETERS.get(strand)
                if not strand_params:
                    continue
                specialized_subjects = strand_params['specialized_subjects']
                core_subjects = strand_params['core_subjects']
                # Try to assign specialized subjects first
                for subject in specialized_subjects:
                    if subject.lower() in teacher_skills and subject not in assigned_subjects and subject not in strand_assigned_subjects[strand]:
                        hours_to_add = hours_per_subject
                        if teacher_assigned_hours[teacher_name] + hours_to_add > max_hours_per_week:
                            continue
                        # Assign subject
                        if not frontend_entry:
                            frontend_entry = {
                                'teacher': teacher_name,
                                'assigned_strands': [],
                                'subjects': [],
                                'total_hours_per_day': 0
                            }
                            frontend_output.append(frontend_entry)
                        if strand not in frontend_entry['assigned_strands']:
                            frontend_entry['assigned_strands'].append(strand)
                        frontend_entry['subjects'].append({'subject': subject, 'hours_per_week': hours_to_add})
                        frontend_entry['total_hours_per_day'] = round((teacher_assigned_hours[teacher_name] + hours_to_add) / 5, 2)
                        all_teachers_entry = next((e for e in all_teachers_output if e['teacher'] == teacher_name), None)
                        if not all_teachers_entry:
                            all_teachers_entry = {
                                'teacher': teacher_name,
                                'assigned_strands': [],
                                'subjects': [],
                                'total_hours_per_week': 0,
                                'fully_loaded': False
                            }
                            all_teachers_output.append(all_teachers_entry)
                        if strand not in all_teachers_entry['assigned_strands']:
                            all_teachers_entry['assigned_strands'].append(strand)
                        all_teachers_entry['subjects'].append({'subject': subject, 'hours_per_week': hours_to_add})
                        all_teachers_entry['total_hours_per_week'] = teacher_assigned_hours[teacher_name] + hours_to_add
                        all_teachers_entry['fully_loaded'] = all_teachers_entry['total_hours_per_week'] >= max_hours_per_week
                        teacher_assigned_hours[teacher_name] += hours_to_add
                        assigned_subjects.add(subject)
                        strand_assigned_subjects[strand].add(subject)
                        assigned_new_subject = True
                        teacher_to_strands[teacher_name] = list(assigned_strands.union({strand}))
                        break
                if assigned_new_subject:
                    continue
                # Try to assign core subjects if no specialized assigned
                for subject in core_subjects:
                    if subject.lower() in teacher_skills and subject not in assigned_subjects and subject not in strand_assigned_subjects[strand]:
                        hours_to_add = hours_per_subject
                        if teacher_assigned_hours[teacher_name] + hours_to_add > max_hours_per_week:
                            continue
                        if not frontend_entry:
                            frontend_entry = {
                                'teacher': teacher_name,
                                'assigned_strands': [],
                                'subjects': [],
                                'total_hours_per_day': 0
                            }
                            frontend_output.append(frontend_entry)
                        if strand not in frontend_entry['assigned_strands']:
                            frontend_entry['assigned_strands'].append(strand)
                        frontend_entry['subjects'].append({'subject': subject, 'hours_per_week': hours_to_add})
                        frontend_entry['total_hours_per_day'] = round((teacher_assigned_hours[teacher_name] + hours_to_add) / 5, 2)
                        all_teachers_entry = next((e for e in all_teachers_output if e['teacher'] == teacher_name), None)
                        if not all_teachers_entry:
                            all_teachers_entry = {
                                'teacher': teacher_name,
                                'assigned_strands': [],
                                'subjects': [],
                                'total_hours_per_week': 0,
                                'fully_loaded': False
                            }
                            all_teachers_output.append(all_teachers_entry)
                        if strand not in all_teachers_entry['assigned_strands']:
                            all_teachers_entry['assigned_strands'].append(strand)
                        all_teachers_entry['subjects'].append({'subject': subject, 'hours_per_week': hours_to_add})
                        all_teachers_entry['total_hours_per_week'] = teacher_assigned_hours[teacher_name] + hours_to_add
                        all_teachers_entry['fully_loaded'] = all_teachers_entry['total_hours_per_week'] >= max_hours_per_week
                        teacher_assigned_hours[teacher_name] += hours_to_add
                        assigned_subjects.add(subject)
                        strand_assigned_subjects[strand].add(subject)
                        assigned_new_subject = True
                        teacher_to_strands[teacher_name] = list(assigned_strands.union({strand}))
                        break
                if assigned_new_subject:
                    continue

    # Add teachers not assigned in the above loop
    assigned_teacher_names = set(t['teacher'] for t in frontend_output)
    for teacher in teachers:
        teacher_name = teacher.get('name') or teacher.get('full_name')
        if teacher_name not in assigned_teacher_names:
            frontend_output.append({
                'teacher': teacher_name,
                'assigned_strands': [],
                'subjects': [],
                'total_hours_per_day': 0
            })
            all_teachers_output.append({
                'teacher': teacher_name,
                'assigned_strands': [],
                'subjects': [],
                'total_hours_per_week': 0,
                'fully_loaded': False
            })

    fully_loaded_teachers = [t for t in all_teachers_output if t['fully_loaded']]
    total_teachers = len(all_teachers_output)
    assigned_teachers = len([t for t in all_teachers_output if t['assigned_strands']])
    unassigned_teachers = total_teachers - assigned_teachers
    avg_workload_hours = sum(t['total_hours_per_week'] for t in all_teachers_output) / total_teachers if total_teachers > 0 else 0

    strand_distribution = {}
    for t in all_teachers_output:
        for strand in t['assigned_strands']:
            if strand not in strand_distribution:
                strand_distribution[strand] = 0
            strand_distribution[strand] += 1

    strand_to_teachers_str = {strand: str(count) for strand, count in strand_distribution.items()}

    analysis_report = {
        'total_teachers': total_teachers,
        'assigned_teachers': assigned_teachers,
        'unassigned_teachers': unassigned_teachers,
        'fully_loaded_teachers': len(fully_loaded_teachers),
        'average_workload_hours_per_week': avg_workload_hours,
        'strand_distribution': strand_distribution,
        'strand_to_teachers': strand_to_teachers_str
    }

    temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    output_file = os.path.join(temp_dir, 'output.json')

    output_data = {
        'teacher_workload_summary': frontend_output,
        'all_teachers_status': all_teachers_output,
        'fully_loaded_teachers': fully_loaded_teachers,
        'analysis_report': analysis_report
    }

    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)

if __name__ == "__main__":
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
    teachers_file = os.path.join(temp_dir, 'teachers_input.json')
    classes_file = os.path.join(temp_dir, 'classes_input.json')
    constraints_file = os.path.join(temp_dir, 'constraints_input.json')
    preferences_file = os.path.join(temp_dir, 'preferences_input.json')

    with open(teachers_file, 'r') as f:
        teachers = json.load(f)
    with open(classes_file, 'r') as f:
        classes = json.load(f)
    with open(constraints_file, 'r') as f:
        constraints = json.load(f)
    with open(preferences_file, 'r') as f:
        preferences = json.load(f)

    combined_workload_skill_matching(teachers, classes, preferences, 'name', 'subject')
