<?php
// Script to insert missing year and strand_id combinations from teacher_evaluations into trend_identification

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
    ";

    $stmt = $pdo->query($distinctQuery);
    $distinctRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare insert statement with IGNORE to avoid duplicates
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
    echo "Error inserting missing rows: " . $e->getMessage() . "\n";
    exit(1);
}
?>
