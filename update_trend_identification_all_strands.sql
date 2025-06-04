-- SQL script to update workforce.trend_identification table with all strands data
-- Matching rows by year and strand_id

UPDATE workforce.trend_identification ti
JOIN (
    SELECT year, strand_id, teachers_count, students_count, max_class_size, salary_ratio,
           professional_dev_hours, historical_resignations, historical_retentions, workload_per_teacher
    FROM workforce.teacher_retention_data
) tr ON ti.year = tr.year AND ti.strand_id = tr.strand_id
SET
    ti.teachers_count = tr.teachers_count,
    ti.students_count = tr.students_count,
    ti.max_class_size = tr.max_class_size,
    ti.salary_ratio = tr.salary_ratio,
    ti.professional_dev_hours = tr.professional_dev_hours,
    ti.historical_resignations = tr.historical_resignations,
    ti.historical_retentions = tr.historical_retentions,
    ti.workload_per_teacher = tr.workload_per_teacher;
