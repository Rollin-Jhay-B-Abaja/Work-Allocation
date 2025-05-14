-- Update subject_areas.strand_id by joining with strands table on strand_name matching subject_areas.subject
UPDATE subject_areas sa
JOIN strands s ON UPPER(TRIM(s.strand_name)) = UPPER(TRIM(sa.subject))
SET sa.strand_id = s.strand_id
WHERE sa.strand_id IS NULL OR sa.strand_id = 0;
