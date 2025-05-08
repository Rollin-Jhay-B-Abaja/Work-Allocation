<?php
// Script to sync trend_identification table rows with year and strand_id from teacher_evaluations data
// so that scores can be updated properly

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get distinct year and strand_id from teacher_evaluations joined with teacher_strand_assignments and evaluation_periods
    $distinctQuery = "
        SELECT DISTINCT
            YEAR(ep.start_date) AS year,
            tsa.strand_id
        FROM teacher_evaluations te
        JOIN teacher_strand_assignments tsa ON te.teacher_id = tsa.teacher_id
        JOIN evaluation_periods ep ON te.eval_period_id = ep.eval_period_id
        WHERE tsa.is_primary = 1
    ";

    $stmt = $pdo->query($distinctQuery);
    $distinctRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Insert missing rows into trend_identification
    $insertStmt = $pdo->prepare("
        INSERT IGNORE INTO trend_identification (year, strand_id)
        VALUES (:year, :strand_id)
    ");

    $insertCount = 0;
    foreach ($distinctRows as $row) {
        $insertStmt->execute([
            ':year' => $row['year'],
            ':strand_id' => $row['strand_id']
        ]);
        $insertCount += $insertStmt->rowCount();
    }

    echo "Inserted $insertCount missing rows into trend_identification.\n";

} catch (PDOException $e) {
    echo "Error syncing trend_identification table: " . $e->getMessage() . "\n";
    exit(1);
}
?>
