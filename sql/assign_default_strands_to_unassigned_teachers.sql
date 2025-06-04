-- Assign default strand 'GAS' to teachers without any assigned strand
INSERT INTO teacher_strand_assignments (teacher_id, strand_id)
SELECT t.teacher_id, s.strand_id
FROM teachers t
CROSS JOIN strands s
LEFT JOIN teacher_strand_assignments tsa ON t.teacher_id = tsa.teacher_id
WHERE tsa.teacher_id IS NULL
AND s.strand_name = 'GAS';
