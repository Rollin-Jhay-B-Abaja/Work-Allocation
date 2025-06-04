-- SQL query to find teachers without assigned strands
SELECT t.teacher_id, t.name
FROM teachers t
LEFT JOIN teacher_strand_assignments tsa ON t.teacher_id = tsa.teacher_id
WHERE tsa.teacher_id IS NULL;
