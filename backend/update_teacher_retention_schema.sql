-- Add new columns for policy constraints if they do not exist
ALTER TABLE workforce.teacher_retention_data
ADD COLUMN IF NOT EXISTS target_ratio INT DEFAULT 25,
ADD COLUMN IF NOT EXISTS max_class_size INT DEFAULT 40;

-- Update existing rows with default values for new columns if NULL
UPDATE workforce.teacher_retention_data
SET target_ratio = 25
WHERE target_ratio IS NULL;

UPDATE workforce.teacher_retention_data
SET max_class_size = 40
WHERE max_class_size IS NULL;
