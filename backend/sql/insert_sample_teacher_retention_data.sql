-- Sample SQL script to insert non-zero data into workforce.teacher_retention_data
-- Adjust the table and column names as per your schema

INSERT INTO teacher_retention_data (year, strand_id, teachers_count, historical_resignations, historical_retentions, salary_ratio, professional_dev_hours, workload_per_teacher)
VALUES
  (2021, 1, 50, 3, 16, 1.2, 40, 20),
  (2021, 2, 40, 2, 14, 1.1, 35, 18),
  (2021, 3, 30, 3, 15, 1.0, 30, 22),
  (2021, 4, 25, 4, 17, 1.3, 45, 19),
  (2021, 5, 20, 3, 16, 1.2, 40, 20),
  (2022, 1, 52, 3, 17, 1.2, 42, 21),
  (2022, 2, 42, 3, 15, 1.1, 36, 19),
  (2022, 3, 32, 3, 16, 1.0, 31, 23),
  (2022, 4, 27, 4, 18, 1.3, 46, 20),
  (2022, 5, 22, 3, 17, 1.2, 41, 21);

-- Add more rows as needed for other years and strands
