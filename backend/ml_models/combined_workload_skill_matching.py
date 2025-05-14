import json
from collections import defaultdict
from skill_based_matching import skill_based_matching
from workload_distribution import distribute_workload
from fix_teacher_strands import fix_teacher_strands

def combined_workload_skill_matching(teachers, classes, preferences, teacher_name_col, class_name_col):
    # Run skill_based_matching to get assignments, detailed_scores, and teacher_strands
    skill_match_result = skill_based_matching(teachers, classes, {}, [])
    strand_assignments = skill_match_result.get('assignments', {})
    detailed_scores = skill_match_result.get('detailed_scores', {})
    teacher_strands = skill_match_result.get('teacher_strands', {})

    # Fix teacher strands mapping
    fixed_teacher_strands = fix_teacher_strands(strand_assignments, teachers)

    # Prepare strand to subjects mapping with grade level and hours per subject
    strand_subjects = {
        'STEM': {
            'Grade 11': [
                'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
                'Earth and Life Science', 'PE and Health', 'Personal Development',
                'Understanding Culture, Society, and Politics',
                'Pre-Calculus', 'General Biology 1', 'General Chemistry 1',
                'General Physics 1', 'Research in Daily Life (Intro to Research)'
            ],
            'Grade 12': [
                'Contemporary Philippine Arts', 'Media and Information Literacy',
                'Entrepreneurship', 'PE and Health',
                'Basic Calculus', 'General Biology 2', 'General Chemistry 2',
                'General Physics 2', 'Research/Capstone Project (STEM-focused)'
            ]
        },
        'ABM': {
            'Grade 11': [
                'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
                'Earth and Life Science', 'PE and Health', 'Personal Development',
                'Understanding Culture, Society, and Politics',
                'Business Mathematics', 'Fundamentals of ABM 1',
                'Organization and Management', 'Principles of Marketing'
            ],
            'Grade 12': [
                'Contemporary Philippine Arts', 'Media and Information Literacy',
                'Entrepreneurship', 'PE and Health',
                'Fundamentals of ABM 2', 'Business Finance', 'Applied Economics',
                'Work Immersion/Research in Business'
            ]
        },
        'HUMMS': {
            'Grade 11': [
                'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
                'Earth and Life Science', 'PE and Health', 'Personal Development',
                'Understanding Culture, Society, and Politics',
                'Creative Writing', 'Disciplines in Social Sciences',
                'Philippine Politics and Governance', 'Community Engagement'
            ],
            'Grade 12': [
                'Contemporary Philippine Arts', 'Media and Information Literacy',
                'Entrepreneurship', 'PE and Health',
                'Trends in Social Sciences', 'Creative Nonfiction',
                'Culminating Activity (HUMSS Research)'
            ]
        },
        'GAS': {
            'Grade 11': [
                'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
                'Earth and Life Science', 'PE and Health', 'Personal Development',
                'Understanding Culture, Society, and Politics',
                'Humanities 1', 'Social Science 1', 'Applied Economics',
                'Research in Daily Life', 'Media and Information Literacy'
            ],
            'Grade 12': [
                'Contemporary Philippine Arts', 'Media and Information Literacy',
                'Entrepreneurship', 'PE and Health',
                'Humanities 2', 'Social Science 2', 'Research in Daily Life'
            ]
        },
        'ICT': {
            'Grade 11': [
                'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
                'Earth and Life Science', 'PE and Health', 'Personal Development',
                'Understanding Culture, Society, and Politics',
                'Computer Systems Servicing (NC II)', 'Programming (Java, Python)', 'Animation'
            ],
            'Grade 12': [
                'Contemporary Philippine Arts', 'Media and Information Literacy',
                'Entrepreneurship', 'PE and Health',
                'Web Development', 'Work Immersion (ICT Industry)'
            ]
        }
    }

    # Default hours per subject per week
    hours_per_subject = 4

    # Prepare output list for frontend table
    frontend_output = []
    # Prepare output list for all teachers with availability and load status
    all_teachers_output = []

    # For each teacher, prepare detailed info
    for teacher in teachers:
        teacher_name = teacher.get('name') or teacher.get('full_name')
        assigned_strands = fixed_teacher_strands.get(teacher_name, [])

        # Remove duplicates and nulls from assigned_strands
        assigned_strands = [strand for strand in assigned_strands if strand is not None]
        assigned_strands = list(set(assigned_strands))

        # Collect subjects and hours per subject
        subjects_hours = {}

        for strand in assigned_strands:
            subjects_by_grade = strand_subjects.get(strand, {})
            for grade, subjects in subjects_by_grade.items():
                for subject in subjects:
                    # Accumulate hours per subject
                    subjects_hours[subject] = subjects_hours.get(subject, 0) + hours_per_subject

        # Format subjects and hours as list of dicts
        subjects_list = [{'subject': sub, 'hours_per_week': hrs} for sub, hrs in subjects_hours.items()]

        # Determine if teacher is fully loaded (example threshold: total hours >= 40)
        total_hours = sum(subjects_hours.values())
        fully_loaded = total_hours >= 40

        frontend_output.append({
            'teacher': teacher_name,
            'assigned_strands': assigned_strands,
            'subjects': subjects_list
        })

        all_teachers_output.append({
            'teacher': teacher_name,
            'assigned_strands': assigned_strands,
            'subjects': subjects_list,
            'total_hours': total_hours,
            'fully_loaded': fully_loaded
        })

    # Filter fully loaded teachers
    fully_loaded_teachers = [t for t in all_teachers_output if t['fully_loaded']]

    # Calculate analysis report
    total_teachers = len(all_teachers_output)
    assigned_teachers = len([t for t in all_teachers_output if t['assigned_strands'] and "Unassigned" not in t['assigned_strands']])
    unassigned_teachers = total_teachers - assigned_teachers
    avg_workload_hours = sum(t['total_hours'] for t in all_teachers_output) / total_teachers if total_teachers > 0 else 0

    # Distribution of teachers per strand
    strand_distribution = {}
    for t in all_teachers_output:
        for strand in t['assigned_strands']:
            if strand not in strand_distribution:
                strand_distribution[strand] = 0
            strand_distribution[strand] += 1

    analysis_report = {
        'total_teachers': total_teachers,
        'assigned_teachers': assigned_teachers,
        'unassigned_teachers': unassigned_teachers,
        'fully_loaded_teachers': len(fully_loaded_teachers),
        'average_workload_hours': avg_workload_hours,
        'strand_distribution': strand_distribution
    }

    return {
        'teacher_workload_summary': frontend_output,
        'all_teachers_status': all_teachers_output,
        'fully_loaded_teachers': fully_loaded_teachers,
        'analysis_report': analysis_report
    }

if __name__ == "__main__":
    import json
    import mysql.connector
    import sys
    import logging
    import os
    import stat

    # Configure logging to stderr only
    logging.basicConfig(level=logging.INFO, stream=sys.stderr, format='%(message)s')

    try:
        # Database connection parameters
        db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'Omamam@010101',
            'database': 'workforce',
            'charset': 'utf8mb4'
        }

        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Fetch teachers joined with workload data and expertise and certifications using subqueries
        cursor.execute("""
            SELECT t.teacher_id AS id, t.name AS full_name, t.hire_date, t.employment_status, t.photo,
                   w.teaching_hours,
                   w.admin_hours,
                   w.extracurricular_hours,
                   w.max_allowed_hours AS max_hours_per_week,
                   (SELECT GROUP_CONCAT(DISTINCT sa.subject)
                    FROM teacher_subject_expertise tse
                    JOIN subject_areas sa ON tse.subject_id = sa.subject_id
                    WHERE tse.teacher_id = t.teacher_id) AS subjects_expertise,
                   (SELECT GROUP_CONCAT(DISTINCT ct.certification)
                    FROM teacher_certifications tc
                    JOIN certification_types ct ON tc.cert_id = ct.cert_id
                    WHERE tc.teacher_id = t.teacher_id) AS teaching_certifications
            FROM teachers t
            LEFT JOIN teacher_workload w ON t.teacher_id = w.teacher_id
        """)
        teachers_raw = cursor.fetchall()

        # Process teachers to convert comma-separated strings to lists
        teachers = []
        for t in teachers_raw:
            t['subjects_expertise'] = t['subjects_expertise'].split(',') if t['subjects_expertise'] else []
            t['teaching_certifications'] = t['teaching_certifications'].split(',') if t['teaching_certifications'] else []
            teachers.append(t)

        # Fix teacher dict keys to match skill_based_matching expectations
        for t in teachers:
            if 'name' not in t and 'full_name' in t:
                t['name'] = t['full_name']

        # Fetch classes data from subject_areas joined with strands
        cursor.execute("""
            SELECT sa.subject_id AS id, sa.subject, sa.strand_id, s.strand_name,
                   1 AS hours_per_week,
                   '' AS skill_certification_requirements,
                   '' AS class_time, '' AS class_day,
                   '' AS shift, '' AS class_end_time, 0 AS is_critical
            FROM subject_areas sa
            LEFT JOIN strands s ON sa.strand_id = s.strand_id
        """)
        classes_raw = cursor.fetchall()

        # Process classes to set skill_certification_requirements based on subject or strand
        classes = []
        for c in classes_raw:
            required_skills = []
            subject = c.get('subject', '').lower()
            strand_raw = c.get('strand_name', '')
            strand = strand_raw.strip().upper() if strand_raw else ''

            # Normalize strand and assign required skills
            if strand == 'STEM':
                required_skills = ['Mathematics', 'Science']
            elif strand == 'ABM':
                required_skills = ['Accounting', 'Business']
            elif strand == 'GAS':
                # More specific skills for GAS strand
                required_skills = ['General Studies', 'Social Science']
            elif strand == 'HUMMS':
                required_skills = ['Humanities', 'Social Studies']
            elif strand == 'ICT':
                required_skills = ['Information Technology', 'Computer Science']
            else:
                # Handle unknown strands gracefully
                required_skills = []
                # Assign empty string instead of 'UNKNOWN' for unknown strands
                strand = strand_raw.strip() if strand_raw else ''

            # Add additional skills based on subject keywords
            if 'math' in subject:
                required_skills.append('Mathematics')
            if 'science' in subject:
                required_skills.append('Science')
            if 'accounting' in subject:
                required_skills.append('Accounting')
            if 'business' in subject:
                required_skills.append('Business')
            if 'it' in subject or 'computer' in subject:
                required_skills.append('Information Technology')

            required_skills = list(set(required_skills))
            c['skill_certification_requirements'] = required_skills
            # Keep original subject name separate, assign strand to a new key
            c['strand'] = strand
            classes.append(c)

        preferences = []

        cursor.close()
        conn.close()

        teacher_name_col = 'name'
        class_name_col = 'subject'

        output = combined_workload_skill_matching(teachers, classes, preferences, teacher_name_col, class_name_col)

        temp_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'temp')
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir, exist_ok=True)
            # Set directory permissions to 0777
            os.chmod(temp_dir, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

        output_file = os.path.join(temp_dir, 'output.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)

    except Exception as e:
        logging.error(f"Error: {e}")
        error_output = {'error': str(e)}
        try:
            temp_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'temp')
            if not os.path.exists(temp_dir):
                os.makedirs(temp_dir, exist_ok=True)
                os.chmod(temp_dir, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
            output_file = os.path.join(temp_dir, 'output.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(error_output, f, indent=2)
        except Exception as write_err:
            logging.error(f"Failed to write error output: {write_err}")
        print(json.dumps(error_output))
        sys.exit(1)
