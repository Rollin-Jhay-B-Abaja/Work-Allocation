CREATE TABLE IF NOT EXISTS workload_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    strand_id INT NOT NULL,
    strand_name VARCHAR(255) NOT NULL,
    subjects JSON NOT NULL,
    total_hours_per_day FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
