<?php
// Script to copy overall_score from teacher_evaluations to teacher_evaluation_scores in trend_identification
// Aggregated by year and strand_id

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aggregate overall_score by year and strand_id
    $aggregationQuery = "
        SELECT 
            YEAR(ep.start_date) AS year,
            tsa.strand_id,
            AVG(te.overall_score) AS avg_overall_score
        FROM teacher_evaluations te
        JOIN teacher_strand_assignments tsa ON te.teacher_id = tsa.teacher_id
        JOIN evaluation_periods ep ON te.eval_period_id = ep.eval_period_id
        GROUP BY year, tsa.strand_id
    ";

    $stmt = $pdo->query($aggregationQuery);
    $aggregatedData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare update statement for trend_identification
    $updateStmt = $pdo->prepare("
        UPDATE trend_identification ti
        SET ti.teacher_evaluation_scores = :avg_overall_score
        WHERE ti.year = :year AND ti.strand_id = :strand_id
    ");

    $updatedCount = 0;
    foreach ($aggregatedData as $row) {
        $updateStmt->execute([
            ':avg_overall_score' => $row['avg_overall_score'],
            ':year' => $row['year'],
            ':strand_id' => $row['strand_id']
        ]);
        $updatedCount += $updateStmt->rowCount();
    }

    echo "Updated teacher_evaluation_scores in trend_identification for $updatedCount rows.\n";

} catch (PDOException $e) {
    echo "Error updating teacher_evaluation_scores: " . $e->getMessage() . "\n";
    exit(1);
}
?>
