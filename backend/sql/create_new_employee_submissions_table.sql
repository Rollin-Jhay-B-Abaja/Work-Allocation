CREATE TABLE IF NOT EXISTS new_employee_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(255) DEFAULT NULL,
    hire_date DATE DEFAULT NULL,
    employment_status VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    position VARCHAR(100) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    teaching_certifications TEXT DEFAULT NULL,
    subjects_expertise TEXT DEFAULT NULL,
    teaching_hours_per_week INT DEFAULT NULL,
    administrative_duties INT DEFAULT NULL,
    extracurricular_duties INT DEFAULT NULL,
    max_teaching_hours INT DEFAULT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
