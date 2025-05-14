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

require_once __DIR__ . '/../vendor/autoload.php'; // Adjust if using Composer or autoload

// Import the predict_teacher_retention function using PHP-Python bridge or other method
// Since direct PHP-Python bridge may not be available, this is a placeholder for calling Python script directly

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

    $pythonExecutable = 'C:\\\\Python312\\\\python.exe';
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

        if ($return_value !== 0) {
            send_response(['error' => 'Prediction script error', 'details' => $errorOutput], 500);
        }

        $lines = array_filter(array_map('trim', explode("\n", $output)));
        $lastLine = end($lines);
        $predictionResults = json_decode($lastLine, true);
        if ($predictionResults === null) {
            send_response(['error' => 'Invalid JSON output from prediction script'], 500);
        }

        // Return only the recommendations part
        $recommendations = isset($predictionResults['recommendations']) ? $predictionResults['recommendations'] : [];

        send_response(['recommendations' => $recommendations]);
    } else {
        send_response(['error' => 'Failed to start prediction process'], 500);
    }
} catch (Exception $e) {
    send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
}
?>
