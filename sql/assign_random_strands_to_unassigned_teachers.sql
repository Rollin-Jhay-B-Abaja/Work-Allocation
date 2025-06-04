-- Assign random strands to teachers without any assigned strand
INSERT INTO teacher_strand_assignments (teacher_id, strand_id, start_date)
SELECT t.teacher_id,
       (SELECT strand_id FROM strands ORDER BY RAND() LIMIT 1) AS strand_id,
       '2025-04-05' AS start_date
FROM teachers t
LEFT JOIN teacher_strand_assignments tsa ON t.teacher_id = tsa.teacher_id
WHERE tsa.teacher_id IS NULL;
