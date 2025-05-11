<?php
// skill_based_matching.php
// API endpoint to perform skill-based matching by calling the Python module
// Ensure no whitespace or BOM before opening PHP tag

// Disable error display to avoid HTML error output breaking JSON response
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Log errors to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

header('Content-Type: application/json');

// Database connection parameters
$host = 'localhost';
$dbname = 'workforce';
$user = 'root';
$pass = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $resource = $_GET['resource'] ?? '';

        try {
            if ($resource === 'teachers') {
                $stmt = $pdo->query("SELECT teacher_id AS id, name FROM teachers");
                $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $stmt = $pdo->query("SELECT tc.teacher_id, ct.certification FROM teacher_certifications tc JOIN certification_types ct ON tc.cert_id = ct.cert_id");
                $certifications = [];
                foreach ($stmt as $row) {
                    $certifications[$row['teacher_id']][] = $row['certification'];
                }

                $stmt = $pdo->query("SELECT tse.teacher_id, sa.subject FROM teacher_subject_expertise tse JOIN subject_areas sa ON tse.subject_id = sa.subject_id");
                $expertise = [];
                foreach ($stmt as $row) {
                    $expertise[$row['teacher_id']][] = $row['subject'];
                }

                // Fetch max_allowed_hours from teacher_workload table
                $stmt = $pdo->query("SELECT teacher_id, max_allowed_hours FROM teacher_workload");
                $workload_hours = [];
                foreach ($stmt as $row) {
                    $workload_hours[$row['teacher_id']] = $row['max_allowed_hours'];
                }

                foreach ($teachers as &$teacher) {
                    $id = $teacher['id'];
                    $teacher['teaching_certifications'] = $certifications[$id] ?? [];
                    $teacher['subjects_expertise'] = $expertise[$id] ?? [];
                    $teacher['max_allowed_hours'] = $workload_hours[$id] ?? 40; // default to 40 if not found
                }
                unset($teacher);

                echo json_encode($teachers);
                exit;
            } elseif ($resource === 'classes') {
                $stmt = $pdo->query("SELECT subject_id AS id, subject AS name FROM subject_areas");
                $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                // Removed usage of subject_name and description columns
                echo json_encode($classes);
                exit;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid resource']);
                exit;
            }
        } catch (PDOException $e) {
            error_log("Database query error in GET $resource: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database query error: ' . $e->getMessage()]);
            exit;
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Parse JSON POST body
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        if ($input === null) {
            error_log("Invalid JSON input in POST request");
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        $teachers = $input['teachers'] ?? [];
        $classes = $input['classes'] ?? [];
        $constraints = $input['constraints'] ?? ['max_hours_per_week' => 40, 'min_rest_hours' => 8];
        $preferences = $input['preferences'] ?? [];

        $tempDir = __DIR__ . '/temp';
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $teachersFile = $tempDir . '/teachers_input.json';
        $classesFile = $tempDir . '/classes_input.json';
        $constraintsFile = $tempDir . '/constraints_input.json';
        $preferencesFile = $tempDir . '/preferences_input.json';

        if (file_put_contents($teachersFile, json_encode($teachers)) === false ||
            file_put_contents($classesFile, json_encode($classes)) === false ||
            file_put_contents($constraintsFile, json_encode($constraints)) === false ||
            file_put_contents($preferencesFile, json_encode($preferences)) === false) {
            error_log("Failed to write input JSON files for skill based matching");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to write input files']);
            exit;
        }

        // Correct path to python script
        $pythonScript = realpath(__DIR__ . '/../ml_models/skill_based_matching.py');
        if ($pythonScript === false) {
            error_log("Python script skill_based_matching.py not found");
            http_response_code(500);
            echo json_encode(['error' => 'Python script not found']);
            exit;
        }
        // Fix path for Windows backslashes
        $pythonScript = str_replace('\\', '/', $pythonScript);
        $command = escapeshellcmd("python \"$pythonScript\" 2>&1");
        exec($command, $output, $return_var);

        $fullOutput = implode("\n", $output);

        if ($return_var !== 0) {
            error_log("Skill based matching script failed with return code $return_var. Output: " . $fullOutput);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute skill based matching', 'details' => $output]);
            exit;
        }

        // Validate JSON
        $jsonData = json_decode($fullOutput, true);
        if ($jsonData === null) {
            error_log("Invalid JSON output from skill based matching script: " . $fullOutput);
            http_response_code(500);
            echo json_encode(['error' => 'Invalid JSON output from skill based matching script']);
            exit;
        }

        // Return JSON with 'result' field as string for frontend compatibility
        echo json_encode(['result' => $fullOutput]);
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
