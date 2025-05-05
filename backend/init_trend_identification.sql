CREATE TABLE IF NOT EXISTS trend_identification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    strand_id INT NOT NULL,
    class_size INT NOT NULL,
    average_grades FLOAT NOT NULL,
    classroom_observation_scores FLOAT NOT NULL,
    teacher_evaluation_scores FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);
