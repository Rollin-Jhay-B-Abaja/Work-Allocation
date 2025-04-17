-- SQL script to create the risk_assessment table
CREATE TABLE IF NOT EXISTS risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    strand VARCHAR(100) NOT NULL,
    performance VARCHAR(50),
    hours_per_week INT,
    class_size INT,
    teacher_satisfaction DECIMAL(3,2),
    student_satisfaction DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
