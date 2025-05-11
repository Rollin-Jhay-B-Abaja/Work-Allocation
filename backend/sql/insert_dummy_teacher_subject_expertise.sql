-- Updated dummy data for teacher_subject_expertise with valid subject_id values
INSERT INTO teacher_subject_expertise (teacher_id, subject_id, proficiency_level, years_experience) VALUES
('0001', 4, 'Advanced', 5),  -- Math
('0001', 5, 'Intermediate', 3),  -- Science
('0002', 6, 'Expert', 7),  -- English
('0002', 7, 'Advanced', 4),  -- Literature
('0003', 8, 'Intermediate', 2),  -- Biology
('0003', 9, 'Beginner', 1),  -- Chemistry
('0004', 10, 'Advanced', 6),  -- History
('0004', 11, 'Intermediate', 3),  -- Social Studies
('0005', 12, 'Expert', 8),  -- Writing
('0005', 13, 'Advanced', 5);  -- Statistics
