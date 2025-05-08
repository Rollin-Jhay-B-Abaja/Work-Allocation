<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connection successful.\n";

    $stmt = $pdo->query("SELECT * FROM teacher_retention LIMIT 5");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Query executed successfully. Rows fetched:\n";
    print_r($rows);
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
}
?>
