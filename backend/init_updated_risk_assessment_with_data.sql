-- SQL script to create an updated risk_assessment table integrating teacher_retention_data and trend_identification data

CREATE TABLE IF NOT EXISTS risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_retention_id INT NOT NULL,
    year INT NOT NULL,
    strand VARCHAR(50) NOT NULL,
    performance VARCHAR(50),
    hours_per_week INT,
    class_size INT,
    teacher_satisfaction DECIMAL(5,2),
    student_satisfaction DECIMAL(5,2),
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

-- Sample data inserts matching existing teacher_retention_data and trend_identification

INSERT INTO risk_assessment (teacher_retention_id, year, strand, performance, hours_per_week, class_size, teacher_satisfaction, student_satisfaction, teachers_count, students_count, max_class_size, salary_ratio, professional_dev_hours, historical_resignations, historical_retentions, workload_per_teacher)
VALUES
(1, 2015, 'STEM', 'Good', 40, 30, 85.5, 90.0, 5, 180, 40, 0.95, 18, 6, 19, 70.0),
(2, 2016, 'STEM', 'Average', 38, 28, 80.0, 85.0, 4, 200, 40, 0.96, 20, 5, 19, 72.0),
(3, 2017, 'ABM', 'Excellent', 42, 32, 90.0, 92.0, 6, 220, 35, 0.97, 22, 5, 21, 74.0);
