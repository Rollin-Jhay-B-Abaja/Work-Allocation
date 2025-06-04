-- SQL script to update workforce.teacher_subject_expertise with dummy proficiency_level and years_experience

UPDATE workforce.teacher_subject_expertise
SET proficiency_level = ELT(FLOOR(1 + RAND() * 4), 'Beginner', 'Intermediate', 'Advanced', 'Expert'),
    years_experience = FLOOR(RAND() * 10) + 1
WHERE proficiency_level IS NULL OR years_experience IS NULL;
