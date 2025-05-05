<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
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
    try {
        if (!isset($_FILES['csvFile']) || $_FILES['csvFile']['error'] !== UPLOAD_ERR_OK) {
            send_response(['error' => 'CSV file is required and must be uploaded without errors.'], 400);
        }

        $fileTmpPath = $_FILES['csvFile']['tmp_name'];

        // Create uploads directory if not exists
        $uploadsDir = __DIR__ . '/uploads';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Copy uploaded file to uploads directory with unique name
        $uniqueFileName = uniqid('upload_', true) . '.csv';
        $destinationPath = $uploadsDir . '/' . $uniqueFileName;
        if (!move_uploaded_file($fileTmpPath, $destinationPath)) {
            send_response(['error' => 'Failed to move uploaded file.'], 500);
        }

        // Normalize Windows backslashes to forward slashes for Python compatibility
        $destinationPath = str_replace('\\', '/', $destinationPath);

        $fileContent = file_get_contents($destinationPath);
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
        $insertQuery = "INSERT INTO trend_identification (teacher_id, year, strand_id, class_size, average_grades, classroom_observation_scores, teacher_evaluation_scores) VALUES (?, ?, ?, ?, ?, ?, ?)";
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
            foreach (["Teacher ID", "Year", "Strand", "Class Size"] as $col) {
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
                    // Get strand_id from strands table
                    $strandName = $row[$headerMap["Strand"]];
                    $strandStmt = $pdo->prepare("SELECT id FROM strands WHERE name = ?");
                    $strandStmt->execute([$strandName]);
                    $strandId = $strandStmt->fetchColumn();
                    if (!$strandId) {
                        $errors[] = "Row $rowNumber: Strand '$strandName' not found in strands table.";
                        continue;
                    }

                    $stmt->execute([
                        $row[$headerMap["Teacher ID"]],
                        intval($row[$headerMap["Year"]]),
                        $strandId,
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
        $escapedCsvPath = escapeshellarg($destinationPath);

        // Log CSV file path and current working directory for debugging
        $cwd = getcwd();
        file_put_contents('python_script_error.log', "CSV Path: $destinationPath\nCWD: $cwd\n", FILE_APPEND);

        $cwd = getcwd();
        $pythonScriptPath = realpath($cwd . '/../ml_models/trend_identification_runner.py');
        $escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

        $command = "python $escapedPythonScriptPath $escapedCsvPath";

        $output = shell_exec($command . ' 2>&1');

        // Enhanced logging for Python script execution
        if ($output === null) {
            $errorMsg = "Failed to execute Python script. Command: $command";
            file_put_contents('python_script_error.log', $errorMsg . "\n", FILE_APPEND);
            send_response(['error' => $errorMsg], 500);
        }

        // Log Python script output for debugging
        file_put_contents('python_script_error.log', "Python script output:\n" . $output . "\n", FILE_APPEND);

        $decodedOutput = json_decode($output, true);
        if ($decodedOutput === null) {
            send_response(['error' => 'Python script output is not valid JSON', 'raw_output' => $output], 500);
        }

        send_response($decodedOutput);
    } catch (Exception $e) {
        send_response(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
    $stmt = $pdo->query("SELECT ti.teacher_id AS 'Teacher ID', t.name AS 'Teacher Name', ti.year AS 'Year', s.name AS 'Strand', ti.class_size AS 'Class Size', ti.average_grades AS 'Average Grades of Students', ti.classroom_observation_scores AS 'Classroom Observation Scores', ti.teacher_evaluation_scores AS 'Teacher Evaluation Scores' FROM trend_identification ti JOIN teachers t ON ti.teacher_id = t.id JOIN strands s ON ti.strand_id = s.id");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Prepare temporary CSV file for Python script input
        $tempCsvPath = sys_get_temp_dir() . '/trend_identification_temp.csv';
        $fp = fopen($tempCsvPath, 'w');
        if ($fp === false) {
            send_response(['error' => 'Failed to create temporary CSV file'], 500);
        }

        // Write CSV headers
        $headers = ["Class Size", "Average Grades of Students", "Classroom Observation Scores", "Teacher Evaluation Scores"];
        fputcsv($fp, $headers);

        // Write data rows
        foreach ($data as $row) {
            fputcsv($fp, [
                $row['Class Size'],
                $row['Average Grades of Students'],
                $row['Classroom Observation Scores'],
                $row['Teacher Evaluation Scores']
            ]);
        }
        fclose($fp);

        // Call Python script with CSV file path as argument
        $escapedCsvPath = escapeshellarg($tempCsvPath);

        $cwd = getcwd();
        $pythonScriptPath = $cwd . '/../ml_models/trend_identification_runner.py';
        $escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

        $command = "python $escapedPythonScriptPath $escapedCsvPath";

        $output = shell_exec($command . ' 2>&1');

        // Enhanced logging for Python script execution
        if ($output === null) {
            $errorMsg = "Failed to execute Python script. Command: $command";
            file_put_contents('python_script_error.log', $errorMsg . "\n", FILE_APPEND);
            send_response(['error' => $errorMsg], 500);
        }

        $decodedOutput = json_decode($output, true);
        if ($decodedOutput === null) {
            $errorMsg = "Python script output is not valid JSON. Output: $output";
            file_put_contents('python_script_error.log', $errorMsg . "\n", FILE_APPEND);
            send_response(['error' => $errorMsg, 'raw_output' => $output], 500);
        }

        // Merge correlation_matrix and recommendations into data response
        $response = [
            'data' => $data,
            'correlation_matrix' => $decodedOutput['correlation_matrix'] ?? null,
            'recommendations' => $decodedOutput['recommendations'] ?? []
        ];

        send_response($response);
    } catch (Exception $e) {
        send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['delete_all']) && $input['delete_all'] === true) {
        try {
            $stmt = $pdo->prepare("DELETE FROM trend_identification");
            $stmt->execute();
            send_response(['message' => 'All records deleted successfully']);
        } catch (Exception $e) {
            send_response(['error' => 'Failed to delete all records: ' . $e->getMessage()], 500);
        }
        exit();
    }

    $teacherId = $input['teacherId'] ?? '';
    $year = $input['year'] ?? '';
    $strand = $input['strand'] ?? '';

    if (empty($teacherId) || empty($year) || empty($strand)) {
        send_response(['error' => 'Missing required parameters for deletion'], 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM trend_identification WHERE teacher_id = ? AND year = ? AND strand = ?");
        $stmt->execute([$teacherId, $year, $strand]);
        if ($stmt->rowCount() > 0) {
            send_response(['message' => 'Record deleted successfully']);
        } else {
            send_response(['error' => 'Record not found'], 404);
        }
    } catch (Exception $e) {
        send_response(['error' => 'Failed to delete record: ' . $e->getMessage()], 500);
    }
    exit();
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

$cwd = getcwd();
$pythonScriptPath = realpath($cwd . '/../ml_models/trend_identification_runner.py');
$escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

$command = "python $escapedPythonScriptPath $escapedInput";

// Log command and input data for debugging
file_put_contents('python_script_error.log', "Command: $command\nInputData: $inputData\n", FILE_APPEND);

$output = shell_exec($command . ' 2>&1');

// Log raw output for debugging
file_put_contents('python_script_error.log', "Output: $output\n", FILE_APPEND);

if ($output === null) {
    send_response(['error' => 'Failed to execute Python script'], 500);
}

send_response(json_decode($output, true));
?>
