-- Normalized schema for workforce.teachers and related detailed tables

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_contact_details (
    teacher_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100),
    contact_number VARCHAR(20),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_position_department (
    teacher_id VARCHAR(50) PRIMARY KEY,
    position VARCHAR(100),
    department VARCHAR(100),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_skills_certifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50),
    subject_expertise VARCHAR(100),
    teaching_certification VARCHAR(100),
    proficiency_level VARCHAR(50),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_workload_availability (
    teacher_id VARCHAR(50) PRIMARY KEY,
    teaching_experience_years INT,
    availability_schedule TEXT,
    preferred_time_slots TEXT,
    preferred_days_off TEXT,
    shift_preferences TEXT,
    overtime_willingness BOOLEAN,
    assigned_classes TEXT,
    teaching_hours_per_week INT,
    administrative_duties TEXT,
    extracurricular_duties TEXT,
    max_teaching_hours INT,
    min_rest_period INT,
    contractual_constraints TEXT,
    substitute_eligible_subjects TEXT,
    substitute_availability TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_compliance_feedback (
    teacher_id VARCHAR(50) PRIMARY KEY,
    leave_requests TEXT,
    feedback_scores TEXT,
    absences INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);
