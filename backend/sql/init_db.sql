-- SQL script to create the studentenrollmentprediction table
CREATE TABLE IF NOT EXISTS studentenrollmentprediction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year VARCHAR(4) NOT NULL,
    strand_id INT NOT NULL,
    enrollment_count INT NOT NULL,
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);
