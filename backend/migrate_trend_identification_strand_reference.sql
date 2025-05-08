-- Migration script to add strand_id column to trend_identification table and normalize strand references

-- Add strand_id column
ALTER TABLE workforce.trend_identification
ADD COLUMN strand_id INT;

-- Update strand_id based on matching strand name in strands table
UPDATE workforce.trend_identification ti
JOIN workforce.strands s ON ti.strand = s.strand_name
SET ti.strand_id = s.strand_id;

-- Drop old strand column
ALTER TABLE workforce.trend_identification
DROP COLUMN strand;

-- Add foreign key constraint on strand_id
ALTER TABLE workforce.trend_identification
ADD CONSTRAINT fk_trend_identification_strand
FOREIGN KEY (strand_id) REFERENCES workforce.strands(strand_id);
