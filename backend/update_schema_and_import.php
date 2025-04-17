<?php
$host = 'localhost';
$dbname = 'workforce';
$username = 'root';
$password = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Alter table columns to DECIMAL(5,2)
    $alterQuery = "ALTER TABLE risk_assessment 
        MODIFY COLUMN teacher_satisfaction DECIMAL(5,2),
        MODIFY COLUMN student_satisfaction DECIMAL(5,2)";
    $pdo->exec($alterQuery);
    echo "Table columns altered successfully.\n";

    // Clear existing data
    $pdo->exec("DELETE FROM risk_assessment");
    echo "Existing data cleared.\n";

    // Path to CSV file
    $csvFile = __DIR__ . '/../frontend/src/pages/RiskAssessment/sample_data.csv';

    if (!file_exists($csvFile)) {
        throw new Exception("CSV file not found at $csvFile");
    }

    if (($handle = fopen($csvFile, 'r')) === false) {
        throw new Exception("Failed to open CSV file.");
    }

    $header = fgetcsv($handle);
    $expectedHeaders = ['Teacher ID', 'Name', 'Strand', 'Performance', 'Hours per week', 'Class size', 'Teacher satisfaction', 'Student satisfaction'];

    if ($header !== $expectedHeaders) {
        throw new Exception("CSV headers do not match expected format.");
    }

    $insertQuery = "INSERT INTO risk_assessment (teacher_id, name, strand, performance, hours_per_week, class_size, teacher_satisfaction, student_satisfaction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($insertQuery);

    $rowCount = 0;
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) !== count($expectedHeaders)) {
            continue; // skip invalid rows
        }
        $teacherSatRaw = str_replace('%', '', trim($row[6]));
        $studentSatRaw = str_replace('%', '', trim($row[7]));

        $teacherSat = (strlen($teacherSatRaw) > 0 && is_numeric($teacherSatRaw)) ? (float)$teacherSatRaw : 0.0;
        $studentSat = (strlen($studentSatRaw) > 0 && is_numeric($studentSatRaw)) ? (float)$studentSatRaw : 0.0;

        $stmt->execute([
            $row[0],
            $row[1],
            $row[2],
            $row[3],
            is_numeric($row[4]) ? (int)$row[4] : null,
            is_numeric($row[5]) ? (int)$row[5] : null,
            $teacherSat,
            $studentSat,
        ]);
        $rowCount++;
    }
    fclose($handle);

    echo "Imported $rowCount rows successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
