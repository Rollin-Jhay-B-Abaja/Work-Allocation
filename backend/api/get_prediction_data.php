<?php
ob_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_once __DIR__ . '/../config.php';

    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=workforce;charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Set a timeout for the query execution
        $pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);

        $query = "SELECT tr.id, tr.year, s.strand_name, tr.teachers_count, tr.students_count, tr.target_ratio, tr.max_class_size, tr.salary_ratio, tr.professional_dev_hours, tr.historical_resignations, tr.historical_retentions, tr.workload_per_teacher
                  FROM teacher_retention_data tr
                  JOIN strands s ON tr.strand_id = s.strand_id
                  ORDER BY tr.year, s.strand_name";
        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$data) {
            // Return 200 with empty data array instead of 404
            http_response_code(200);
            echo json_encode(['data' => []]);
            exit();
        }

        echo json_encode(['data' => $data]);
    } catch (PDOException $e) {
        error_log('Database error in get_prediction_data.php: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
ob_end_flush();
?>
