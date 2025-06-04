<?php
ob_start();
// flexible_scheduling.php
// API endpoint to perform flexible scheduling by calling the Python module

// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Log errors to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight CORS requests
    http_response_code(200);
    exit();
}

// Database connection parameters - updated with correct credentials
$host = 'localhost';
$dbname = 'workforce';
$user = 'root';
$pass = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $resource = $_GET['resource'] ?? '';

        if ($resource === 'teachers') {
            try {
                $stmt = $pdo->query("SELECT teacher_id AS id, name FROM teachers");
                $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($teachers);
                exit;
            } catch (PDOException $e) {
                error_log("Database query error in GET teachers: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database query error: ' . $e->getMessage()]);
                exit;
            }
        }
        if ($resource === 'classes') {
            try {
                // Test simpler query to verify data presence
                $stmt = $pdo->query("SELECT subject_id AS id, subject AS name FROM subject_areas");
                $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (empty($classes)) {
                    error_log("No classes found in subject_areas table");
                }
                echo json_encode($classes);
                exit;
            } catch (PDOException $e) {
                error_log("Database query error in GET classes: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database query error: ' . $e->getMessage()]);
                exit;
            }
        }
        http_response_code(400);
        echo json_encode(['error' => 'Invalid resource']);
        exit;
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Read JSON input from request body
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        if ($input === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        $teachers = $input['teachers'] ?? [];
        $classes = $input['classes'] ?? [];
        $constraints = $input['constraints'] ?? ['max_hours_per_week' => 40, 'min_rest_hours' => 8];
        $preferences = $input['preferences'] ?? [];

        // Save input data to temporary JSON files
        $tempDir = __DIR__ . '/temp';
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0777, true);
        }
        $teachersFile = $tempDir . DIRECTORY_SEPARATOR . 'teachers_input.json';
        $classesFile = $tempDir . DIRECTORY_SEPARATOR . 'classes_input.json';
        $constraintsFile = $tempDir . DIRECTORY_SEPARATOR . 'constraints_input.json';
        $preferencesFile = $tempDir . DIRECTORY_SEPARATOR . 'preferences_input.json';

        if (file_put_contents($teachersFile, json_encode($teachers)) === false ||
            file_put_contents($classesFile, json_encode($classes)) === false ||
            file_put_contents($constraintsFile, json_encode($constraints)) === false ||
            file_put_contents($preferencesFile, json_encode($preferences)) === false) {
            error_log("Failed to write input JSON files for flexible scheduling");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to write input files']);
            exit;
        }

        // Execute the Python flexible_scheduling module with timeout
        $pythonPath = 'C:\\Python312\\python.exe';
        $scriptPath = realpath(__DIR__ . '/../ml_models/flexible_scheduling.py');
        if ($scriptPath === false) {
            error_log("Python script flexible_scheduling.py not found");
            http_response_code(500);
            echo json_encode(['error' => 'Python script not found']);
            exit;
        }
        $command = "\"$pythonPath\" \"$scriptPath\" \"$teachersFile\" \"$classesFile\" \"$constraintsFile\" \"$preferencesFile\"";

        // Use proc_open to allow timeout
        $descriptorspec = [
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ];
        $process = proc_open($command, $descriptorspec, $pipes);

        if (!is_resource($process)) {
            error_log("Failed to start flexible scheduling script process");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to start scheduling process']);
            exit;
        }

        // Set timeout in seconds
        $timeout = 30;
        $start = time();

        $output = '';
        $errorOutput = '';

        // Non-blocking read with timeout
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        while (true) {
            $output .= stream_get_contents($pipes[1]);
            $errorOutput .= stream_get_contents($pipes[2]);

            $status = proc_get_status($process);
            if (!$status['running']) {
                break;
            }
            if ((time() - $start) > $timeout) {
                proc_terminate($process, 9); // SIGKILL
                error_log("Flexible scheduling script timed out");
                http_response_code(500);
                echo json_encode(['error' => 'Scheduling script timed out']);
                exit;
            }
            usleep(100000); // 0.1 sec
        }

        fclose($pipes[1]);
        fclose($pipes[2]);

        $return_var = proc_close($process);

        if ($return_var !== 0) {
            error_log("Flexible scheduling script failed with return code $return_var. Stderr: " . $errorOutput);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute flexible scheduling', 'details' => $errorOutput]);
            exit;
        }

        $decoded = json_decode($output, true);
        if ($decoded === null) {
            error_log("Flexible scheduling script returned invalid JSON: " . $output);
            http_response_code(500);
            echo json_encode(['error' => 'Flexible scheduling script returned invalid JSON']);
            exit;
        }

        echo $output;
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}   
?>
