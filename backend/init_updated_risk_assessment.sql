-- SQL script to create an updated risk_assessment table integrating teacher_retention_data and trend_identification data

CREATE TABLE IF NOT EXISTS risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_retention_id INT NOT NULL,
    year INT NOT NULL,
    strand VARCHAR(50) NOT NULL,
    performance VARCHAR(50),
    hours_per_week INT,
    class_size INT,
    teacher_satisfaction DECIMAL(3,2),
    student_satisfaction DECIMAL(3,2),
    teachers_count INT,
    students_count INT,
    max_class_size INT,
    salary_ratio FLOAT,
    professional_dev_hours FLOAT,
    historical_resignations INT,
    historical_retentions INT,
    workload_per_teacher FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_retention_id) REFERENCES teacher_retention_data(id)
);
