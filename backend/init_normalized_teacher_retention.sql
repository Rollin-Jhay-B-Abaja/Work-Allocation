CREATE TABLE IF NOT EXISTS teacher_retention (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    strand_id INT NOT NULL,
    teachers_count INT,
    students_count INT,
    target_ratio INT DEFAULT 25,
    max_class_size INT DEFAULT 40,
    salary_ratio DECIMAL(5,2),
    professional_dev_hours DECIMAL(5,2),
    historical_resignations INT,
    historical_retentions INT,
    workload_per_teacher DECIMAL(5,2),
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);
