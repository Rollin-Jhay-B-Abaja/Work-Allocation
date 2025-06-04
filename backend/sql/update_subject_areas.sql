SET FOREIGN_KEY_CHECKS=0;

DELETE FROM subject_areas WHERE strand_id IN (
  SELECT strand_id FROM strands WHERE strand_name IN ('STEM', 'ABM', 'GAS', 'HUMSS', 'ICT')
);

SET FOREIGN_KEY_CHECKS=1;

INSERT INTO subject_areas (subject, strand_id, hours_per_week) VALUES
('Oral Communication', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Komunikasyon at Pananaliksap', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Mathematics', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Earth and Life Science', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('PE and Health', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Personal Development', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Understanding Culture, Society, and Politics', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Pre-Calculus', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Basic Calculus', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Biology 1', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Biology 2', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Chemistry 1', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Chemistry 2', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Physics 1', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('General Physics 2', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Research/Capstone Project', (SELECT strand_id FROM strands WHERE strand_name = 'STEM'), 1),
('Business Mathematics', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Fundamentals of ABM 1', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Fundamentals of ABM 2', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Business Finance', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Organization and Management', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Principles of Marketing', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Work Immersion/Research', (SELECT strand_id FROM strands WHERE strand_name = 'ABM'), 1),
('Humanities 1', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Humanities 2', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Social Science 1', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Social Science 2', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Applied Economics', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Research in Daily Life', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Media and Information Literacy', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Work Immersion', (SELECT strand_id FROM strands WHERE strand_name = 'GAS'), 1),
('Creative Writing', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Disciplines and Ideas in Social Sciences', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Philippine Politics and Governance', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Community Engagement', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Trends in Social Sciences', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Research in Social Sciences', (SELECT strand_id FROM strands WHERE strand_name = 'HUMSS'), 1),
('Computer Systems Servicing (NC II)', (SELECT strand_id FROM strands WHERE strand_name = 'ICT'), 1),
('Programming (Java, Python, etc.)', (SELECT strand_id FROM strands WHERE strand_name = 'ICT'), 1),
('Web Development', (SELECT strand_id FROM strands WHERE strand_name = 'ICT'), 1),
('Animation', (SELECT strand_id FROM strands WHERE strand_name = 'ICT'), 1),
('Work Immersion (ICT Industry)', (SELECT strand_id FROM strands WHERE strand_name = 'ICT'), 1);
