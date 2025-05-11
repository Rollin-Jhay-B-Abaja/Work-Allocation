<?php
// workload_distribution.php
// API endpoint to perform workload distribution by calling the Python module

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

header('Content-Type: application/json');

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
            $stmt = $pdo->query("SELECT teacher_id AS id, name, max_allowed_hours AS max_hours_per_week FROM teachers");
            $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($teachers);
            exit;
        } elseif ($resource === 'classes') {
            $stmt = $pdo->query("SELECT subject_id AS id, subject_name AS name, description FROM subject_areas");
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($classes);
            exit;
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid resource']);
            exit;
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Fetch teachers data
        $stmt = $pdo->query("SELECT teacher_id AS id, name, max_allowed_hours AS max_hours_per_week FROM teachers");
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch teacher certifications
        $stmt = $pdo->query("SELECT teacher_id, certification FROM teacher_certifications tc JOIN certification_types ct ON tc.cert_id = ct.cert_id");
        $certifications = [];
        foreach ($stmt as $row) {
            $certifications[$row['teacher_id']][] = $row['certification'];
        }

        // Fetch teacher subject expertise
        $stmt = $pdo->query("SELECT teacher_id, subject, proficiency_level FROM teacher_subject_expertise tse JOIN subject_areas sa ON tse.subject_id = sa.subject_id");
        $expertise = [];
        foreach ($stmt as $row) {
            $expertise[$row['teacher_id']][] = $row['subject'];
        }

        // Build teachers array with skills and certifications
        foreach ($teachers as &$teacher) {
            $id = $teacher['id'];
            $teacher['teaching_certifications'] = $certifications[$id] ?? [];
            $teacher['subjects_expertise'] = $expertise[$id] ?? [];
            $teacher['additional_skills'] = [];
            $teacher['availability'] = ['available' => true];
            $teacher['preferences'] = [];
        }
        unset($teacher);

        // Fetch classes data from subject_areas
        $stmt = $pdo->query("SELECT subject_id AS id, subject_name AS name, description FROM subject_areas");
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Constraints and preferences - placeholders
        $constraints = [
            'max_hours_per_week' => 40,
            'min_rest_hours' => 8
        ];
        $preferences = [];

        // Save input data to temporary JSON files
        file_put_contents('/tmp/teachers_input.json', json_encode($teachers));
        file_put_contents('/tmp/classes_input.json', json_encode($classes));
        file_put_contents('/tmp/constraints_input.json', json_encode($constraints));
        file_put_contents('/tmp/preferences_input.json', json_encode($preferences));

        // Execute the Python workload_distribution module
        $command = 'python backend/ml_models/workload_distribution.py /tmp/teachers_input.json /tmp/classes_input.json /tmp/constraints_input.json /tmp/preferences_input.json';
        exec($command, $output, $return_var);

        if ($return_var !== 0) {
            error_log("Workload distribution script failed with return code $return_var");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute workload distribution']);
            exit;
        }

        echo implode("\n", $output);
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
