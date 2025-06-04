-- Add missing columns and tables for employee workload and subjects

-- Add max_allowed_hours column to teacher_workload if not exists
ALTER TABLE teacher_workload
ADD COLUMN IF NOT EXISTS max_allowed_hours INT DEFAULT NULL;

-- Add subject_name column to subject_areas if not exists
ALTER TABLE subject_areas
ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) DEFAULT NULL;

-- Create teacher_workload_availability table if not exists
CREATE TABLE IF NOT EXISTS teacher_workload_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(10) NOT NULL,
    period_id INT NOT NULL,
    available_hours INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (period_id) REFERENCES workload_periods(period_id)
);

-- Create teacher_compliance_feedback table if not exists
CREATE TABLE IF NOT EXISTS teacher_compliance_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(10) NOT NULL,
    feedback_text TEXT,
    feedback_date DATE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Add max_hours_per_week column to teachers if not exists
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS max_hours_per_week INT DEFAULT NULL;

-- Add description column to classes if not exists
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
