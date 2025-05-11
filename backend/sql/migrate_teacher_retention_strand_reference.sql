-- Migration script to normalize strand reference in teacher_retention_data table

-- Add strand_id column
ALTER TABLE workforce.teacher_retention_data
ADD COLUMN strand_id INT;

-- Update strand_id based on matching strand name in strands table
UPDATE workforce.teacher_retention_data trd
JOIN workforce.strands s ON trd.strand = s.strand_name
SET trd.strand_id = s.strand_id;

-- Drop old strand column
ALTER TABLE workforce.teacher_retention_data
DROP COLUMN strand;

-- Add foreign key constraint on strand_id
ALTER TABLE workforce.teacher_retention_data
ADD CONSTRAINT fk_teacher_retention_strand
FOREIGN KEY (strand_id) REFERENCES workforce.strands(strand_id);
