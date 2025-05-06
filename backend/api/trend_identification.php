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

/*
POST method code for CSV upload and processing is commented out.
*/

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "
            SELECT 
                ti.trend_id AS TrendID,
                ti.year AS Year,
                ti.strand AS Strand,
                ti.teachers_count AS TeachersCount,
                ti.students_count AS StudentsCount,
                ti.max_class_size AS MaxClassSize,
                ti.salary_ratio AS SalaryRatio,
                ti.professional_dev_hours AS ProfessionalDevHours,
                ti.historical_resignations AS HistoricalResignations,
                ti.historical_retentions AS HistoricalRetentions,
                ti.workload_per_teacher AS WorkloadPerTeacher
            FROM trend_identification ti
            ORDER BY ti.year, ti.strand
        ";

        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Prepare temporary CSV file for Python script input
        $tempCsvPath = sys_get_temp_dir() . '/trend_identification_temp.csv';
        $fp = fopen($tempCsvPath, 'w');
        if ($fp === false) {
            send_response(['error' => 'Failed to create temporary CSV file'], 500);
        }

        // Write CSV headers
        $headers = ["Class Size", "Average Grades of Students", "Classroom Observation Scores", "Teacher Evaluation Scores"];
        fputcsv($fp, $headers, ',', '"', '\\');

        // Write data rows
        foreach ($data as $row) {
            fputcsv($fp, [
                $row['MaxClassSize'] ?? '',
                $row['AverageGrades'] ?? '',
                $row['ClassroomObservationScores'] ?? '',
                $row['TeacherEvaluationScores'] ?? ''
            ], ',', '"', '\\');
        }
        fclose($fp);

        // Call Python script with CSV file path as argument
        $escapedCsvPath = escapeshellarg($tempCsvPath);

        $cwd = getcwd();
        $pythonScriptPath = $cwd . '/../ml_models/trend_identification_runner.py';
        $escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

        $command = "python $escapedPythonScriptPath $escapedCsvPath";

        $output = shell_exec($command . ' 2>&1');

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

$command = "python $escapedPythonScriptPath $escapedCsvPath";

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
