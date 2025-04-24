<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function send_response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function connect_db() {
    $host = 'localhost';
    $dbname = 'workforce';
    $username = 'root';
    $password = 'Omamam@010101';

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        send_response(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
    }
}

$pdo = connect_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['csvFile']) || $_FILES['csvFile']['error'] !== UPLOAD_ERR_OK) {
        send_response(['error' => 'CSV file is required and must be uploaded without errors.'], 400);
    }

    $fileTmpPath = $_FILES['csvFile']['tmp_name'];
    $fileContent = file_get_contents($fileTmpPath);
    // Normalize line endings to \n
    $fileContent = str_replace("\r\n", "\n", $fileContent);
    $lines = explode("\n", trim($fileContent));
    if (count($lines) < 2) {
        send_response(['error' => 'CSV file is empty or missing data rows.'], 400);
    }

    $requiredColumns = [
        "Teacher ID",
        "Teacher Name",
        "Year",
        "Strand",
        "Class Size",
        "Average Grades of Students",
        "Classroom Observation Scores",
        "Teacher Evaluation Scores"
    ];

    $headers = str_getcsv(array_shift($lines), ",", "\"", "\\");
    // Normalize headers: trim and lowercase
    $normalizedHeaders = array_map(function($h) { return strtolower(trim($h)); }, $headers);
    $normalizedRequired = array_map('strtolower', $requiredColumns);
    $missingColumns = array_diff($normalizedRequired, $normalizedHeaders);
    if (count($missingColumns) > 0) {
        // Map normalized missing columns back to original required columns for error message
        $missingOriginal = array_filter($requiredColumns, function($col) use ($missingColumns) {
            return in_array(strtolower($col), $missingColumns);
        });
        send_response(['error' => "Missing required columns: " . implode(", ", $missingOriginal)], 400);
    }

    $errors = [];
    $headerMap = array_flip($headers);
    $rowNumber = 1;
    $insertQuery = "INSERT INTO trend_identification (teacher_id, teacher_name, year, strand, class_size, average_grades, classroom_observation_scores, teacher_evaluation_scores) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($insertQuery);

    $pdo->beginTransaction();

    foreach ($lines as $line) {
        $rowNumber++;
        if (trim($line) === '') continue;
        $row = str_getcsv($line, ",", "\"", "\\");
        if (count($row) !== count($headers)) {
            $errors[] = "Row $rowNumber has incorrect number of columns.";
            continue;
        }

        // Check mandatory fields
        foreach (["Teacher ID", "Teacher Name", "Year", "Strand", "Class Size"] as $col) {
            $value = $row[$headerMap[$col]];
            if (empty($value)) {
                $errors[] = "Row $rowNumber: Missing value for $col.";
            }
        }

        // Range check for Class Size
        $classSize = intval($row[$headerMap["Class Size"]]);
        if ($classSize < 1 || $classSize > 50) {
            $errors[] = "Row $rowNumber: Class Size must be between 1 and 50.";
        }

        // Numeric checks for performance metrics
        $avgGrades = $row[$headerMap["Average Grades of Students"]];
        if (!is_numeric($avgGrades)) {
            $errors[] = "Row $rowNumber: Average Grades of Students must be numeric.";
        }
        $obsScores = $row[$headerMap["Classroom Observation Scores"]];
        if (!is_numeric($obsScores)) {
            $errors[] = "Row $rowNumber: Classroom Observation Scores must be numeric.";
        }
        $evalScores = $row[$headerMap["Teacher Evaluation Scores"]];
        if (!is_numeric($evalScores)) {
            $errors[] = "Row $rowNumber: Teacher Evaluation Scores must be numeric.";
        }

        if (count($errors) === 0) {
            try {
                $stmt->execute([
                    $row[$headerMap["Teacher ID"]],
                    $row[$headerMap["Teacher Name"]],
                    intval($row[$headerMap["Year"]]),
                    $row[$headerMap["Strand"]],
                    $classSize,
                    floatval($avgGrades),
                    floatval($obsScores),
                    floatval($evalScores)
                ]);
            } catch (Exception $e) {
                $errors[] = "Row $rowNumber: Failed to insert data - " . $e->getMessage();
            }
        }
    }

    if (count($errors) > 0) {
        $pdo->rollBack();
        send_response(['error' => implode(" ", $errors)], 400);
    } else {
        $pdo->commit();
    }

    // Call Python script with CSV file path as argument
    $escapedCsvPath = escapeshellarg($fileTmpPath);
    $command = "python backend/ml_models/trend_identification_runner.py $escapedCsvPath";

    $output = shell_exec($command);

    if ($output === null) {
        send_response(['error' => 'Failed to execute Python script'], 500);
    }

    send_response(json_decode($output, true));
}

$teacherId = $_GET['teacherId'] ?? '';
$year = $_GET['year'] ?? '';
$strand = $_GET['strand'] ?? '';

if (empty($teacherId) || empty($year) || empty($strand)) {
    send_response(['error' => 'Missing required parameters'], 400);
}

$inputData = json_encode([
    "teacherId" => $teacherId,
    "year" => $year,
    "strand" => $strand
]);

$escapedInput = escapeshellarg($inputData);

$command = "python backend/ml_models/trend_identification_runner.py $escapedInput";

$output = shell_exec($command);

if ($output === null) {
    send_response(['error' => 'Failed to execute Python script'], 500);
}

send_response(json_decode($output, true));
?>
