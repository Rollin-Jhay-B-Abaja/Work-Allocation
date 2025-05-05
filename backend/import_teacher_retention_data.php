<?php
$host = 'localhost';
$dbname = 'workforce';
$username = 'root';
$password = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Path to CSV file
    $csvFile = __DIR__ . '/../frontend/src/pages/TeachersRetentionPrediction/sample_teacher_retention_data.csv';

    if (!file_exists($csvFile)) {
        throw new Exception("CSV file not found at $csvFile");
    }

    if (($handle = fopen($csvFile, 'r')) === false) {
        throw new Exception("Failed to open CSV file.");
    }

    $header = fgetcsv($handle, 0, ",", '"', "\\");
    $expectedHeaders = [
        'year', 'teachers_STEM', 'teachers_ABM', 'teachers_GAS', 'teachers_HUMSS', 'teachers_ICT',
        'students_STEM', 'students_ABM', 'students_GAS', 'students_HUMSS', 'students_ICT',
        'historical_resignations', 'historical_retentions', 'workload_per_teacher',
        'salary_ratio', 'professional_dev_hours', 'target_ratio', 'max_class_size'
    ];

    if ($header !== $expectedHeaders) {
        throw new Exception("CSV headers do not match expected format.");
    }

    $insertQuery = "INSERT INTO teacher_retention_data (
        year, teachers_STEM, teachers_ABM, teachers_GAS, teachers_HUMSS, teachers_ICT,
        students_STEM, students_ABM, students_GAS, students_HUMSS, students_ICT,
        historical_resignations, historical_retentions, workload_per_teacher,
        salary_ratio, professional_dev_hours, target_ratio, max_class_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($insertQuery);

    $rowCount = 0;
    while (($row = fgetcsv($handle, 0, ",", '"', "\\")) !== false) {
        if (count($row) !== count($expectedHeaders)) {
            continue; // skip invalid rows
        }

        $stmt->execute([
            $row[0], // year
            $row[1], $row[2], $row[3], $row[4], $row[5], // teachers_*
            $row[6], $row[7], $row[8], $row[9], $row[10], // students_*
            $row[11], $row[12], $row[13], // historical resignations, retentions, workload
            $row[14], $row[15], $row[16], $row[17] // salary_ratio, professional_dev_hours, target_ratio, max_class_size
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
