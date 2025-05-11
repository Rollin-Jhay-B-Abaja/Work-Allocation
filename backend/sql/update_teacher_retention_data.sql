LOAD DATA INFILE 'frontend/src/pages/TeachersRetentionPrediction/sample_teacher_retention_data.csv'
INTO TABLE workforce.teacher_retention_data
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(year, teachers_STEM, teachers_ABM, teachers_GAS, teachers_HUMSS, teachers_ICT,
 students_STEM, students_ABM, students_GAS, students_HUMSS, students_ICT,
 historical_resignations, historical_retentions, workload_per_teacher, salary_ratio, professional_dev_hours,
 target_ratio, max_class_size);
