-- Migration script to copy and transform data from trend_identification and teacher_retention_data tables into risk_assessment table

-- Clear existing data in risk_assessment
TRUNCATE TABLE workforce.risk_assessment;

-- Insert data by joining trend_identification and teacher_retention_data on year and strand_id, excluding NULL strand_id
INSERT INTO workforce.risk_assessment (
    teacher_retention_id,
    year,
    strand,
    performance,
    hours_per_week,
    teacher_satisfaction,
    student_satisfaction,
    teachers_count,
    students_count,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher,
    created_at
)
SELECT
    trd.id AS teacher_retention_id,
    trd.year,
    s.strand_name AS strand,
    NULL AS performance,
    NULL AS hours_per_week,
    NULL AS teacher_satisfaction,
    NULL AS student_satisfaction,
    trd.teachers_count,
    trd.students_count,
    trd.max_class_size,
    trd.salary_ratio,
    trd.professional_dev_hours,
    trd.historical_resignations,
    trd.historical_retentions,
    trd.workload_per_teacher,
    NOW()
FROM
    workforce.teacher_retention_data trd
JOIN
    workforce.trend_identification ti ON trd.year = ti.year AND trd.strand_id = ti.strand_id
JOIN
    workforce.strands s ON trd.strand_id = s.strand_id
WHERE
    trd.strand_id IS NOT NULL AND ti.strand_id IS NOT NULL;
