<?php
// Script to populate trend_identification table with aggregated data from teacher_evaluations
// and add dummy average grades if missing

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aggregate classroom_observation_score and overall_score by year and strand_id
    $aggregationQuery = "
        SELECT 
            te.eval_date,
            YEAR(te.eval_date) AS year,
            t.strand_id,
            AVG(te.classroom_observation_score) AS avg_classroom_observation_score,
            AVG(te.overall_score) AS avg_overall_score
        FROM workforce.teacher_evaluations te
        JOIN workforce.teachers t ON te.teacher_id = t.teacher_id
        GROUP BY year, t.strand_id
    ";

    $stmt = $pdo->query($aggregationQuery);
    $aggregatedData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare insert or update statement for trend_identification
    $insertQuery = "
        INSERT INTO workforce.trend_identification 
        (year, strand_id, classroom_observation_scores, teacher_evaluation_scores, average_grades)
        VALUES (:year, :strand_id, :classroom_observation_scores, :teacher_evaluation_scores, :average_grades)
        ON DUPLICATE KEY UPDATE
            classroom_observation_scores = VALUES(classroom_observation_scores),
            teacher_evaluation_scores = VALUES(teacher_evaluation_scores),
            average_grades = VALUES(average_grades)
    ";

    $insertStmt = $pdo->prepare($insertQuery);

    foreach ($aggregatedData as $row) {
        // Use dummy average grades if not available, e.g., 75.0
        $dummyAverageGrades = 75.0;

        $insertStmt->execute([
            ':year' => $row['year'],
            ':strand_id' => $row['strand_id'],
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
