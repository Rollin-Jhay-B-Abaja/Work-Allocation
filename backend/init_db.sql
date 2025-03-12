-- SQL script to create the studentenrollmentprediction table
CREATE TABLE IF NOT EXISTS studentenrollmentprediction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year VARCHAR(4),
    STEM INT,
    ABM INT,
    GAS INT,
    HUMSS INT,
    ICT INT
);
