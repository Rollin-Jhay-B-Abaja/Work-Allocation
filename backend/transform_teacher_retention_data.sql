-- Transform teacher_retention_data to use aggregated teachers_count and students_count

-- Step 1: Update teachers_count and students_count by aggregating denormalized columns
UPDATE workforce.teacher_retention_data
SET 
  teachers_count = COALESCE(teachers_STEM, 0) + COALESCE(teachers_ABM, 0) + COALESCE(teachers_GAS, 0) + COALESCE(teachers_HUMSS, 0) + COALESCE(teachers_ICT, 0),
  students_count = COALESCE(students_STEM, 0) + COALESCE(students_ABM, 0) + COALESCE(students_GAS, 0) + COALESCE(students_HUMSS, 0) + COALESCE(students_ICT, 0);

-- Step 2: Drop denormalized columns
ALTER TABLE workforce.teacher_retention_data
DROP COLUMN teachers_STEM,
DROP COLUMN teachers_ABM,
DROP COLUMN teachers_GAS,
DROP COLUMN teachers_HUMSS,
DROP COLUMN teachers_ICT,
DROP COLUMN students_STEM,
DROP COLUMN students_ABM,
DROP COLUMN students_GAS,
DROP COLUMN students_HUMSS,
DROP COLUMN students_ICT;
