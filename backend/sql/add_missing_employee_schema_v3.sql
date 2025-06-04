-- Add missing columns and tables for employee workload and subjects

-- Add max_allowed_hours column to teacher_workload if it does not exist
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'teacher_workload' AND COLUMN_NAME = 'max_allowed_hours'
);
IF @col_exists = 0 THEN
    ALTER TABLE teacher_workload
    ADD COLUMN max_allowed_hours INT DEFAULT NULL;
END IF;

-- Add subject_name column to subject_areas if it does not exist
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'subject_areas' AND COLUMN_NAME = 'subject_name'
);
IF @col_exists = 0 THEN
    ALTER TABLE subject_areas
    ADD COLUMN subject_name VARCHAR(255) DEFAULT NULL;
END IF;

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

-- Add max_hours_per_week column to teachers if it does not exist
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'max_hours_per_week'
);
IF @col_exists = 0 THEN
    ALTER TABLE teachers
    ADD COLUMN max_hours_per_week INT DEFAULT NULL;
END IF;

-- Add description column to classes if it does not exist
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'classes' AND COLUMN_NAME = 'description'
);
IF @col_exists = 0 THEN
    ALTER TABLE classes
    ADD COLUMN description TEXT DEFAULT NULL;
END IF;
