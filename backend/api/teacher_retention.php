<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';

function send_response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT tr.id, tr.year, s.strand_name, tr.teachers_count, tr.students_count, tr.target_ratio, tr.max_class_size, tr.salary_ratio, tr.professional_dev_hours, tr.historical_resignations, tr.historical_retentions, tr.workload_per_teacher
                  FROM teacher_retention_data tr
                  JOIN strands s ON tr.strand_id = s.strand_id
                  ORDER BY tr.year, s.strand_name";
        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response($data);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        send_response(['error' => 'Invalid JSON input'], 400);
    }

    $requiredFields = ['year', 'strand_id', 'teachers_count', 'students_count', 'target_ratio', 'max_class_size', 'salary_ratio', 'professional_dev_hours', 'historical_resignations', 'historical_retentions', 'workload_per_teacher'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            send_response(['error' => "Missing field: $field"], 400);
        }
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO teacher_retention_data (year, strand_id, teachers_count, students_count, target_ratio, max_class_size, salary_ratio, professional_dev_hours, historical_resignations, historical_retentions, workload_per_teacher)
                               VALUES (:year, :strand_id, :teachers_count, :students_count, :target_ratio, :max_class_size, :salary_ratio, :professional_dev_hours, :historical_resignations, :historical_retentions, :workload_per_teacher)
                               ON DUPLICATE KEY UPDATE
                               teachers_count = VALUES(teachers_count),
                               students_count = VALUES(students_count),
                               target_ratio = VALUES(target_ratio),
                               max_class_size = VALUES(max_class_size),
                               salary_ratio = VALUES(salary_ratio),
                               professional_dev_hours = VALUES(professional_dev_hours),
                               historical_resignations = VALUES(historical_resignations),
                               historical_retentions = VALUES(historical_retentions),
                               workload_per_teacher = VALUES(workload_per_teacher)");
        $stmt->execute([
            ':year' => $input['year'],
            ':strand_id' => $input['strand_id'],
            ':teachers_count' => $input['teachers_count'],
            ':students_count' => $input['students_count'],
            ':target_ratio' => $input['target_ratio'],
            ':max_class_size' => $input['max_class_size'],
            ':salary_ratio' => $input['salary_ratio'],
            ':professional_dev_hours' => $input['professional_dev_hours'],
            ':historical_resignations' => $input['historical_resignations'],
            ':historical_retentions' => $input['historical_retentions'],
            ':workload_per_teacher' => $input['workload_per_teacher']
        ]);
        send_response(['message' => 'Data saved successfully.']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    send_response(['error' => 'Method not allowed'], 405);
}
?>
