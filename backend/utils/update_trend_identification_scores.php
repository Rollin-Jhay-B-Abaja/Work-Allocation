<?php
// Script to update classroom_observation_scores and teacher_evaluation_scores in trend_identification
// with aggregated values from teacher_evaluations grouped by year and strand
// For rows with no aggregated data, set default dummy values

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Update with aggregated values
    $updateQuery = "
        UPDATE trend_identification ti
        JOIN (
            SELECT 
                YEAR(ep.start_date) AS year,
                tsa.strand_id,
                AVG(te.classroom_observation_score) AS classroom_observation_scores,
                AVG(te.overall_score) AS teacher_evaluation_scores
            FROM teacher_evaluations te
            JOIN teacher_strand_assignments tsa ON te.teacher_id = tsa.teacher_id
            JOIN evaluation_periods ep ON te.eval_period_id = ep.eval_period_id
            GROUP BY year, tsa.strand_id
        ) agg ON ti.year = agg.year AND ti.strand_id = agg.strand_id
        SET 
            ti.classroom_observation_scores = agg.classroom_observation_scores,
            ti.teacher_evaluation_scores = agg.teacher_evaluation_scores
    ";

    $updatedRows = $pdo->exec($updateQuery);

    // Set default values for rows where scores are still NULL
    $defaultValue = 75.0;
    $setDefaultQuery = "
        UPDATE trend_identification
        SET classroom_observation_scores = COALESCE(classroom_observation_scores, $defaultValue),
            teacher_evaluation_scores = COALESCE(teacher_evaluation_scores, $defaultValue)
    ";

    $defaultUpdatedRows = $pdo->exec($setDefaultQuery);

    echo "Updated classroom_observation_scores and teacher_evaluation_scores with aggregated values for $updatedRows rows.\n";
    echo "Set default values for $defaultUpdatedRows rows where scores were NULL.\n";

} catch (PDOException $e) {
    echo "Error updating trend_identification scores: " . $e->getMessage() . "\n";
    exit(1);
}
?>
