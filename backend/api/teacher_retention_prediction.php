<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../php_error.log');

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
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
    $stmt = $pdo->query("SELECT tr.*, s.strand_name FROM teacher_retention_data tr JOIN strands s ON tr.strand_id = s.strand_id ORDER BY tr.year, s.strand_name");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$data) {
        send_response(['error' => 'No data found'], 404);
    }

    // Prepare JSON input for Python script
    $inputJson = json_encode($data);

    $pythonScriptPath = realpath(__DIR__ . '/../prediction/teacher_retention.py');
    file_put_contents(__DIR__ . '/python_script_error.log', "Resolved python script path: $pythonScriptPath\n", FILE_APPEND);
    if (!$pythonScriptPath) {
        send_response(['error' => 'Prediction script not found'], 500);
    }

    $escapedPythonScriptPath = escapeshellarg($pythonScriptPath);

    // Use proc_open to send JSON input via stdin and get output
    $descriptorspec = [
        0 => ["pipe", "r"],  // stdin
        1 => ["pipe", "w"],  // stdout
        2 => ["pipe", "w"]   // stderr
    ];

    // Use full path to python executable
    $pythonExecutable = 'C:\\\\Python312\\\\python.exe';
    // Run script with working directory set to prediction folder to support relative imports
    $cwd = realpath(__DIR__ . '/../prediction');
    $process = proc_open("$pythonExecutable teacher_retention.py", $descriptorspec, $pipes, $cwd);

    if (is_resource($process)) {
        fwrite($pipes[0], $inputJson);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $errorOutput = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $return_value = proc_close($process);

        // Log error output to a file for debugging
        file_put_contents(__DIR__ . '/python_script_error.log', "Return code: $return_value\nError output:\n$errorOutput\nOutput:\n$output\n", FILE_APPEND);

        if ($return_value !== 0) {
            send_response(['error' => 'Prediction script error', 'details' => $errorOutput], 500);
        }

        $lines = array_filter(array_map('trim', explode("\n", $output)));
        $lastLine = end($lines);
        $predictionResults = json_decode($lastLine, true);
        if ($predictionResults === null) {
            send_response(['error' => 'Invalid JSON output from prediction script'], 500);
        }

        send_response($predictionResults);
    } else {
        send_response(['error' => 'Failed to start prediction process'], 500);
    }
} catch (Exception $e) {
    send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
}
?>
