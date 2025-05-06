-- Migration script to populate trend_identification from teacher_retention_data

-- Clear existing data
DELETE FROM trend_identification;

-- Insert normalized data for each strand and year
INSERT INTO trend_identification (
    year,
    strand,
    teachers_count,
    students_count,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
)
SELECT
    year,
    'STEM' AS strand,
    teachers_STEM AS teachers_count,
    students_STEM AS students_count,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data
UNION ALL
SELECT
    year,
    'ABM' AS strand,
    teachers_ABM,
    students_ABM,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data
UNION ALL
SELECT
    year,
    'GAS' AS strand,
    teachers_GAS,
    students_GAS,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data
UNION ALL
SELECT
    year,
    'HUMSS' AS strand,
    teachers_HUMSS,
    students_HUMSS,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data
UNION ALL
SELECT
    year,
    'ICT' AS strand,
    teachers_ICT,
    students_ICT,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data;
