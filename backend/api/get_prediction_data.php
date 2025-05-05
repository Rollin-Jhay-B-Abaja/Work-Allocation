<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(0);

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

        $stmt = $pdo->query("SELECT * FROM teacher_retention_data");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$data) {
            // Return 200 with empty data array instead of 404
            http_response_code(200);
            echo json_encode(['data' => []]);
            exit();
        }

        echo json_encode(['data' => $data]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
ob_end_flush();
?>
