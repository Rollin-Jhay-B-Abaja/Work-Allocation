-- Adjusted to exclude tables related to TeacherRetentionPredictionPage dataset to avoid involvement
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    token VARCHAR(255) DEFAULT NULL
);

INSERT INTO users (username, password_hash, role) VALUES (
    'admin',
    '$2y$10$e0NRzQ0v6v6Q6v6Q6v6Q6u6Q6v6Q6v6Q6v6Q6v6Q6v6Q6v6Q6v6Q6',
    'admin'
);


-- 1. Teacher Master Data
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hire_date DATE,
    employment_status ENUM('Active', 'On Leave', 'Terminated')
);

-- 2. Contact Information
CREATE TABLE IF NOT EXISTS contact_types (
    contact_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL -- Email, Phone, Emergency Contact
);

CREATE TABLE IF NOT EXISTS teacher_contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    contact_type_id INT NOT NULL,
    contact_value VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (contact_type_id) REFERENCES contact_types(contact_type_id),
    UNIQUE KEY (teacher_id, contact_type_id, contact_value)
);

-- 3. Position and Department
CREATE TABLE IF NOT EXISTS departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
    position_id INT PRIMARY KEY AUTO_INCREMENT,
    position VARCHAR(100) NOT NULL,
    pay_grade VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS teacher_positions (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    position_id INT NOT NULL,
    department_id INT NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (position_id) REFERENCES positions(position_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    UNIQUE KEY (teacher_id, position_id, department_id, effective_date)
);

-- 4. Strands/Programs
CREATE TABLE IF NOT EXISTS strands (
    strand_id INT PRIMARY KEY AUTO_INCREMENT,
    strand_code VARCHAR(10) NOT NULL, -- STEM, ABM, etc.
    strand_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_strand_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    strand_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);

-- 5. Skills and Certifications
CREATE TABLE IF NOT EXISTS certification_types (
    cert_id INT PRIMARY KEY AUTO_INCREMENT,
    certification VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS teacher_certifications (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    cert_id INT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (cert_id) REFERENCES certification_types(cert_id)
);

CREATE TABLE IF NOT EXISTS subject_areas (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(100) NOT NULL,
    strand_id INT,
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);

CREATE TABLE IF NOT EXISTS teacher_subject_expertise (
    expertise_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    subject_id INT NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    years_experience INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (subject_id) REFERENCES subject_areas(subject_id)
);

-- 6. Workload Management
CREATE TABLE IF NOT EXISTS workload_periods (
    period_id INT PRIMARY KEY AUTO_INCREMENT,
    period_name VARCHAR(50),
    start_date DATE,
    end_date DATE
);

CREATE TABLE IF NOT EXISTS teacher_workload (
    workload_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    period_id INT NOT NULL,
    teaching_hours INT NOT NULL,
    admin_hours INT DEFAULT 0,
    extracurricular_hours INT DEFAULT 0,
    max_allowed_hours INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (period_id) REFERENCES workload_periods(period_id)
);

-- 7. Performance and Risk
CREATE TABLE IF NOT EXISTS evaluation_periods (
    eval_period_id INT PRIMARY KEY AUTO_INCREMENT,
    period_name VARCHAR(50),
    start_date DATE,
    end_date DATE
);

CREATE TABLE IF NOT EXISTS teacher_evaluations (
    evaluation_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    eval_period_id INT NOT NULL,
    evaluator_id VARCHAR(50) DEFAULT NULL,
    overall_score DECIMAL(5,2) DEFAULT NULL,
    classroom_observation_score DECIMAL(5,2) DEFAULT NULL,
    student_feedback_score DECIMAL(5,2) DEFAULT NULL,
    peer_review_score DECIMAL(5,2) DEFAULT NULL,
    KEY teacher_id (teacher_id),
    KEY idx_evaluation_scores (eval_period_id, overall_score),
    CONSTRAINT teacher_evaluations_ibfk_1 FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id),
    CONSTRAINT teacher_evaluations_ibfk_2 FOREIGN KEY (eval_period_id) REFERENCES evaluation_periods (eval_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS risk_assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    assessment_date DATE NOT NULL,
    risk_score DECIMAL(5,2),
    risk_factors JSON, -- Stores multiple risk factors
    mitigation_plan TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- 8. Trend Identification (excluding retention_data to avoid involvement)
CREATE TABLE IF NOT EXISTS trend_metrics (
    trend_id INT PRIMARY KEY AUTO_INCREMENT,
    strand_id INT NOT NULL,
    metric_date DATE NOT NULL,
    metric_type ENUM('grades', 'enrollment', 'satisfaction', 'attendance'),
    metric_value DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (strand_id) REFERENCES strands(strand_id)
);

-- Bridge Tables for Many-to-Many Relationships
CREATE TABLE IF NOT EXISTS teacher_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
    time_slot ENUM('Morning','Afternoon','Evening'),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

CREATE TABLE IF NOT EXISTS teacher_preferred_time_off (
    time_off_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Indexes for Performance
CREATE INDEX idx_teacher_strand ON teacher_strand_assignments(teacher_id, strand_id);
CREATE INDEX idx_workload_period ON teacher_workload(period_id, teaching_hours);
CREATE INDEX idx_risk_assessment ON risk_assessments(teacher_id, assessment_date);
