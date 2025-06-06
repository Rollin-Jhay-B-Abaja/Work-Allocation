CREATE TABLE IF NOT EXISTS trend_identification (
    trend_id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    strand_id INT NOT NULL,
    teachers_count INT,
    students_count INT,
    max_class_size INT,
    salary_ratio FLOAT,
    professional_dev_hours FLOAT,
    historical_resignations INT,
    historical_retentions INT,
    workload_per_teacher FLOAT,
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);
