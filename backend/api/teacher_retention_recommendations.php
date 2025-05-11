<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_response(['error' => 'Only GET method is allowed'], 405);
}

$pdo = connect_db();

try {
    $stmt = $pdo->query("SELECT * FROM teacher_retention_data");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Transform database field names to match expected keys in Python script
    $transformedData = array_map(function($row) {
        return [
            'Teacher ID' => $row['id'],
            'Name' => '', // No name field in DB, set empty or fetch if available
            'Hours per week' => 0, // No hours field in DB, default 0
            'Salary Ratio' => isset($row['salary_ratio']) ? floatval($row['salary_ratio']) : null,
            'Historical Resignations' => isset($row['historical_resignations']) ? intval($row['historical_resignations']) : 0,
            'Historical Retentions' => isset($row['historical_retentions']) ? intval($row['historical_retentions']) : 0,
            'Professional Development Hours' => isset($row['professional_dev_hours']) ? floatval($row['professional_dev_hours']) : 0,
            'Max Class Size' => isset($row['max_class_size']) ? intval($row['max_class_size']) : 0,
            'Students Count' => (
                (isset($row['students_STEM']) ? intval($row['students_STEM']) : 0) +
                (isset($row['students_ABM']) ? intval($row['students_ABM']) : 0) +
                (isset($row['students_GAS']) ? intval($row['students_GAS']) : 0) +
                (isset($row['students_HUMSS']) ? intval($row['students_HUMSS']) : 0) +
                (isset($row['students_ICT']) ? intval($row['students_ICT']) : 0)
            ),
            'Workload Per Teacher' => isset($row['workload_per_teacher']) ? floatval($row['workload_per_teacher']) : 0,
            'Average Grades of Students' => 0, // No field in DB, default 0
            'Classroom Observation Scores' => 0, // No field in DB, default 0
            'Teacher Evaluation Scores' => 0, // No field in DB, default 0
        ];
    }, $data);

    // Debug log the transformed data
    error_log("DEBUG: Transformed data for Python script: " . json_encode($transformedData));

    // Prepare JSON input for Python script
    $inputJson = json_encode($transformedData);

    $cwd = getcwd();
    $pythonScriptPath = realpath($cwd . '/../ml_models/teacher_retention_recommendations_runner.py');
    if (!$pythonScriptPath) {
        send_response(['error' => 'Python script not found'], 500);
    }

    $escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

    // Use proc_open to send JSON input via stdin
    $descriptorspec = [
        0 => ["pipe", "r"],  // stdin
        1 => ["pipe", "w"],  // stdout
        2 => ["pipe", "w"]   // stderr
    ];

    $process = proc_open("python $escapedPythonScriptPath", $descriptorspec, $pipes);

    if (is_resource($process)) {
        fwrite($pipes[0], $inputJson);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $errorOutput = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        // Log output and error to file for debugging
        // file_put_contents(__DIR__ . '/debug_python_output.log', "Output:\n" . $output . "\nError:\n" . $errorOutput);

        $return_value = proc_close($process);

        if ($return_value !== 0) {
            send_response(['error' => 'Python script error', 'details' => $errorOutput], 500);
        }

        // Fix: The Python script outputs a JSON array, but the frontend expects an object with 'recommendations' key
        $recommendations = json_decode($output, true);
        if ($recommendations === null) {
            send_response(['error' => 'Invalid JSON output from Python script', 'raw_output' => $output, 'raw_error' => $errorOutput], 500);
        }

        // Wrap recommendations array in an object with key 'recommendations'
        send_response(['recommendations' => $recommendations]);
    } else {
        send_response(['error' => 'Failed to start Python process'], 500);
    }
} catch (Exception $e) {
    send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
}
?>
