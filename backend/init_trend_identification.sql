CREATE TABLE IF NOT EXISTS trend_identification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    teacher_name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    strand VARCHAR(50) NOT NULL,
    class_size INT NOT NULL,
    average_grades FLOAT NOT NULL,
    classroom_observation_scores FLOAT NOT NULL,
    teacher_evaluation_scores FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
