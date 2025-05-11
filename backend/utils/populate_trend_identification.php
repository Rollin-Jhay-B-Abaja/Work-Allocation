<?php
// Script to populate trend_identification table with aggregated data from teacher evaluations and related tables

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aggregate evaluation scores by year and strand, joining necessary tables
    $aggregationQuery = "
        SELECT 
            YEAR(ep.start_date) AS year,
            s.strand_id,
            s.strand_name AS strand,
            AVG(te.classroom_observation_score) AS avg_classroom_observation_score,
            AVG(te.overall_score) AS avg_overall_score
        FROM workforce.teacher_evaluations te
        JOIN workforce.teachers t ON te.teacher_id = t.teacher_id
        JOIN workforce.evaluation_periods ep ON te.eval_period_id = ep.eval_period_id
        JOIN workforce.teacher_retention_data tr ON tr.year = YEAR(ep.start_date) AND tr.strand_id = s.strand_id
        JOIN workforce.strands s ON tr.strand_id = s.strand_id
        GROUP BY year, s.strand_id, s.strand_name
    ";

    $stmt = $pdo->query($aggregationQuery);
    $aggregatedData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare insert or update statement for trend_identification
    $insertQuery = "
        INSERT INTO workforce.trend_identification 
        (year, strand_id, strand, classroom_observation_scores, teacher_evaluation_scores, average_grades)
        VALUES (:year, :strand_id, :strand, :classroom_observation_scores, :teacher_evaluation_scores, :average_grades)
        ON DUPLICATE KEY UPDATE
            classroom_observation_scores = VALUES(classroom_observation_scores),
            teacher_evaluation_scores = VALUES(teacher_evaluation_scores),
            average_grades = VALUES(average_grades)
    ";

    $insertStmt = $pdo->prepare($insertQuery);

    foreach ($aggregatedData as $row) {
        $dummyAverageGrades = 75.0;

        $insertStmt->execute([
            ':year' => $row['year'],
            ':strand_id' => $row['strand_id'],
            ':strand' => $row['strand'],
            ':classroom_observation_scores' => $row['avg_classroom_observation_score'],
            ':teacher_evaluation_scores' => $row['avg_overall_score'],
            ':average_grades' => $dummyAverageGrades
        ]);
    }

    echo "Trend identification table populated successfully.\n";

} catch (PDOException $e) {
    echo "Error populating trend_identification table: " . $e->getMessage() . "\n";
    exit(1);
}
?>
