-- Update teacher_retention_data schema to align with teacher_retention

-- Add missing columns
ALTER TABLE workforce.teacher_retention_data
ADD COLUMN teachers_count INT,
ADD COLUMN students_count INT;

-- Drop denormalized columns
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

-- Add foreign key constraint on strand_id
ALTER TABLE workforce.teacher_retention_data
ADD CONSTRAINT fk_teacher_retention_strand
FOREIGN KEY (strand_id) REFERENCES workforce.strands(strand_id);
