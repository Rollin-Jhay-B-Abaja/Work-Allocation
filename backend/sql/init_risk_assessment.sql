-- SQL script to create the risk_assessment table
CREATE TABLE IF NOT EXISTS risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    performance VARCHAR(50),
    hours_per_week INT,
    class_size INT,
    teacher_satisfaction DECIMAL(3,2),
    student_satisfaction DECIMAL(3,2),
    strand_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);
