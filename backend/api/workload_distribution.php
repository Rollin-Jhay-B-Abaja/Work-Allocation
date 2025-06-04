<?php
// workload_distribution.php
// This script fetches teacher, class, constraints, preferences, and availability data from the database,
// writes them to temporary JSON files, and calls the Python workload distribution script.
// It returns the workload assignments as JSON response.

header('Content-Type: application/json');

if (php_sapi_name() !== 'cli' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check resource query parameter
$resource = $_GET['resource'] ?? null;
if ($resource !== 'teacher_workload') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing resource parameter']);
    exit;
}

function fetchData($pdo, $query) {
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

try {
    // Database connection (update credentials as needed)
    $dsn = "mysql:host=localhost;dbname=workforce;charset=utf8mb4";
    $username = "root";
    $password = "Omamam@010101";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);

    // Fetch teachers joined with workload data - adjusted to existing columns
    $teachersQuery = "
        SELECT t.teacher_id AS id, t.name AS full_name, t.hire_date, t.employment_status, t.photo,
               COALESCE(w.teaching_hours, 0) AS teaching_hours,
               COALESCE(w.admin_hours, 0) AS admin_hours,
               COALESCE(w.extracurricular_hours, 0) AS extracurricular_hours,
               COALESCE(w.max_allowed_hours, 40) AS max_hours_per_week
        FROM teachers t
        LEFT JOIN teacher_workload w ON t.teacher_id = w.teacher_id
    ";
    $teachers = fetchData($pdo, $teachersQuery);

    // Hardcoded mapping of subject to required skills/certifications
    $subjectSkillRequirements = [
        'General Mathematics' => ['Mathematics'],
        'Calculus' => ['Mathematics'],
        'Statistics' => ['Mathematics'],
        'Biology' => ['Biology'],
        'Chemistry' => ['Chemistry'],
        'Physics' => ['Physics'],
        'English' => ['English'],
        'Filipino' => ['Filipino'],
        'Economics' => ['Economics'],
        'Philippine History' => ['History'],
        'Geography' => ['Geography'],
        'Information and Communications Technology' => ['ICT'],
        'Accounting' => ['Accounting'],
        'Business Management' => ['Business'],
        'Marketing' => ['Marketing'],
        'Psychology' => ['Psychology'],
        'Sociology' => ['Sociology'],
        'Communication Arts' => ['Communication'],
        'Technical Drafting' => ['Technical Drafting'],
        'Electrical Installation and Maintenance' => ['Electrical'],
        'Automotive Servicing' => ['Automotive'],
        'Food and Beverage Services' => ['Food Service'],
        'Housekeeping' => ['Housekeeping'],
    ];

    // Fetch classes data from subject_areas joined with strands - adjusted to existing columns
    $classesQuery = "
        SELECT sa.subject_id AS id, sa.subject, sa.strand_id, s.strand_name,
               10 AS hours_per_week,
               '' AS class_time, '' AS class_day,
               '' AS shift, '' AS class_end_time, 0 AS is_critical
        FROM subject_areas sa
        LEFT JOIN strands s ON sa.strand_id = s.strand_id
    ";
    $classesRaw = fetchData($pdo, $classesQuery);

    // Transform classes data to match expected keys for Python script
    $classes = [];
    foreach ($classesRaw as $class) {
        $className = $class['strand_name'] ?? $class['subject'];
        $subject = $class['subject'];
        $skillReqs = $subjectSkillRequirements[$subject] ?? [];
        $classes[] = [
            'id' => $class['id'],
            'subject' => $subject,
            'strand_id' => $class['strand_id'],
            'name' => $className, // Use strand name if available, else subject name
            'hours_per_week' => (int)$class['hours_per_week'],
            'skill_certification_requirements' => $skillReqs,
            'class_time' => $class['class_time'],
            'class_day' => $class['class_day'],
            'shift' => $class['shift'],
            'class_end_time' => $class['class_end_time'],
            'is_critical' => (int)$class['is_critical'],
        ];
    }

    // Prepare empty constraints and preferences arrays (no tables)
    $constraints = [];
    $preferences = [];

    // Prepare temp directory for input JSON files
    $tempDir = __DIR__ . '/temp';
    if (!is_dir($tempDir)) {
        mkdir($tempDir, 0777, true);
    }

    // Write input JSON files for Python script
    file_put_contents($tempDir . '/teachers_input.json', json_encode($teachers));
    file_put_contents($tempDir . '/classes_input.json', json_encode($classes));
    file_put_contents($tempDir . '/constraints_input.json', json_encode($constraints));
    file_put_contents($tempDir . '/preferences_input.json', json_encode($preferences));

    // Call the Python script and capture only stdout, redirect stderr to a log file for debugging
    $tempOutputFile = $tempDir . '/output.json';
    $errorLogFile = $tempDir . '/python_error.log';
    $command = "python ../ml_models/combined_workload_skill_matching.py > " . escapeshellarg($tempOutputFile) . " 2> " . escapeshellarg($errorLogFile);
    $return_var = null;
    $output_shell = [];
    exec($command, $output_shell, $return_var);

    error_log("Python script exec return code: " . $return_var);
    error_log("Python script exec output: " . implode("\n", $output_shell));

    if ($return_var !== 0) {
        error_log("Workload distribution script failed to execute. See python_error.log for details.");
        http_response_code(500);
        echo json_encode(['error' => 'Failed to execute workload distribution']);
        exit;
    }

    if (!file_exists($tempOutputFile)) {
        error_log("Output file not found after Python script execution.");
        http_response_code(500);
        echo json_encode(['error' => 'Output file missing']);
        exit;
    }

    $output = file_get_contents($tempOutputFile);
    if ($output === false) {
        error_log("Failed to read output file from workload distribution script.");
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read output file']);
        exit;
    }

    error_log("Output file content: " . $output);

    // Try to decode output to check if valid JSON
    $json = json_decode($output, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Invalid JSON output from workload distribution script: " . $output);
        http_response_code(500);
        echo json_encode(['error' => 'Invalid JSON output from Python script', 'output' => $output]);
        exit;
    }

    // Transform output JSON to match frontend expected format with total_hours_per_day
    $data = $json;
    if (isset($data['teacher_workload_summary'])) {
        $transformed = [];
        foreach ($data['teacher_workload_summary'] as $info) {
            $transformed[] = [
                'name' => $info['teacher'] ?? '',
                'strands' => $info['assigned_strands'] ?? [],
                'subjects' => $info['subjects'] ?? [],
                'total_hours' => $info['total_hours_per_day'] ?? 0,
            ];
        }
        echo json_encode($transformed);
    } else {
        // fallback to original output
        echo $output;
    }

} catch (Exception $e) {
    error_log("Exception in workload_distribution.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
