<?php
// Script to populate dummy data for teacher_strand_assignments table
// It assigns all teacher_ids from teachers table to all strand_ids from strands table
// with random is_primary flag and dummy start_date and end_date

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch all teacher_ids
    $teachers = $pdo->query("SELECT teacher_id FROM teachers")->fetchAll(PDO::FETCH_COLUMN);

    // Fetch all strand_ids
    $strands = $pdo->query("SELECT strand_id FROM strands")->fetchAll(PDO::FETCH_COLUMN);

    // Prepare insert statement
    $insertStmt = $pdo->prepare("
        INSERT INTO teacher_strand_assignments (teacher_id, strand_id, is_primary, start_date, end_date)
        VALUES (:teacher_id, :strand_id, :is_primary, :start_date, :end_date)
    ");

    $insertCount = 0;
    foreach ($teachers as $teacher_id) {
        foreach ($strands as $strand_id) {
            // Randomly assign is_primary as 1 or 0, with higher chance for 0
            $is_primary = (rand(0, 9) < 2) ? 1 : 0;

            // Dummy start_date and end_date
            $start_date = '2020-01-01';
            $end_date = '2024-12-31';

            $insertStmt->execute([
                ':teacher_id' => $teacher_id,
                ':strand_id' => $strand_id,
                ':is_primary' => $is_primary,
                ':start_date' => $start_date,
                ':end_date' => $end_date
            ]);
            $insertCount++;
        }
    }

    echo "Inserted $insertCount dummy rows into teacher_strand_assignments.\n";

} catch (PDOException $e) {
    echo "Error populating dummy teacher_strand_assignments: " . $e->getMessage() . "\n";
    exit(1);
}
?>
