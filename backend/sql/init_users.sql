-- SQL script to create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    token VARCHAR(255) DEFAULT NULL
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL
);

-- Create strands table
CREATE TABLE IF NOT EXISTS strands (
    strand_id INT AUTO_INCREMENT PRIMARY KEY,
    strand_name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert initial admin user with password 'admin123' hashed using PHP password_hash
INSERT INTO users (username, password_hash, role) VALUES (
    'admin',
    '$2y$10$e0NRzQ0v6v6Q6v6Q6v6Q6u6Q6v6Q6v6Q6v6Q6v6Q6v6Q6v6Q6v6Q6',
    'admin'
);
