-- SQL script to create a normalized risk_assessment table referencing teacher_retention_data

CREATE TABLE IF NOT EXISTS risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_retention_id INT NOT NULL,
    performance VARCHAR(50),
    hours_per_week INT,
    class_size INT,
    teacher_satisfaction DECIMAL(3,2),
    student_satisfaction DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_retention_id) REFERENCES teacher_retention_data(id)
);
