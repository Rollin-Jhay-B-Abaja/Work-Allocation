-- Update proficiency_level and years_experience in teacher_subject_expertise with random years_experience between 2 and 20
-- Example updates (replace with actual data or generate dynamically as needed)

UPDATE teacher_subject_expertise
SET proficiency_level = CASE
    WHEN proficiency_level IS NULL THEN 'Intermediate'
    ELSE proficiency_level
END,
years_experience = CASE
    WHEN years_experience IS NULL THEN FLOOR(2 + RAND() * 19)
    ELSE years_experience
END;
