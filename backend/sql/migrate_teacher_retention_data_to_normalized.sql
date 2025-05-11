-- Migration script to unpivot and migrate data from denormalized teacher_retention_data to normalized teacher_retention

INSERT INTO teacher_retention (year, strand_id, teachers_count, students_count, target_ratio, max_class_size, salary_ratio, professional_dev_hours, historical_resignations, historical_retentions, workload_per_teacher)
SELECT 
    year,
    s.strand_id,
    CASE s.strand_name
        WHEN 'STEM' THEN teachers_STEM
        WHEN 'ABM' THEN teachers_ABM
        WHEN 'GAS' THEN teachers_GAS
        WHEN 'HUMSS' THEN teachers_HUMSS
        WHEN 'ICT' THEN teachers_ICT
        ELSE NULL
    END AS teachers_count,
    CASE s.strand_name
        WHEN 'STEM' THEN students_STEM
        WHEN 'ABM' THEN students_ABM
        WHEN 'GAS' THEN students_GAS
        WHEN 'HUMSS' THEN students_HUMSS
        WHEN 'ICT' THEN students_ICT
        ELSE NULL
    END AS students_count,
    target_ratio,
    max_class_size,
    salary_ratio,
    professional_dev_hours,
    historical_resignations,
    historical_retentions,
    workload_per_teacher
FROM teacher_retention_data trd
JOIN strands s ON s.strand_name IN ('STEM', 'ABM', 'GAS', 'HUMSS', 'ICT');
