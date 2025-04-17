<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'workforce';
$username = 'root';
$password = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Handle GET request to fetch all risk assessment data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $selectQuery = "SELECT teacher_id AS 'Teacher ID', name AS 'Name', strand AS 'Strand', performance AS 'Performance', hours_per_week AS 'Hours per week', class_size AS 'Class size', teacher_satisfaction AS 'Teacher satisfaction', student_satisfaction AS 'Student satisfaction' FROM risk_assessment";
    $stmt = $pdo->prepare($selectQuery);
    try {
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch data: ' . $e->getMessage()]);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['teacher_id'])) {
        $teacher_id = $_GET['teacher_id'];

        $deleteQuery = "DELETE FROM risk_assessment WHERE teacher_id = ?";
        $stmt = $pdo->prepare($deleteQuery);

        try {
            if ($stmt->execute([$teacher_id])) {
                echo json_encode(['message' => 'Data deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete data']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete data: ' . $e->getMessage()]);
        }
        exit();
    } else {
        // Delete all records if no teacher_id provided
        $deleteAllQuery = "DELETE FROM risk_assessment";
        $stmt = $pdo->prepare($deleteAllQuery);

        try {
            if ($stmt->execute()) {
                echo json_encode(['message' => 'All data deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete all data']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete all data: ' . $e->getMessage()]);
        }
        exit();
    }
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit();
}

$file = $_FILES['file']['tmp_name'];

if (($handle = fopen($file, 'r')) === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to open uploaded file']);
    exit();
}

$header = fgetcsv($handle);
$expectedHeaders = ['Teacher ID', 'Name', 'Strand', 'Performance', 'Hours per week', 'Class size', 'Teacher satisfaction', 'Student satisfaction'];

if ($header !== $expectedHeaders) {
    http_response_code(400);
    echo json_encode(['error' => 'CSV headers do not match expected format']);
    fclose($handle);
    exit();
}

$insertQuery = "INSERT INTO risk_assessment (teacher_id, name, strand, performance, hours_per_week, class_size, teacher_satisfaction, student_satisfaction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($insertQuery);

$pdo->beginTransaction();

try {
    $rowCount = 0;
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) !== count($expectedHeaders)) {
            continue; // skip invalid rows
        }
        $teacherSatRaw = str_replace('%', '', trim($row[6]));
        $studentSatRaw = str_replace('%', '', trim($row[7]));

        $teacherSat = (strlen($teacherSatRaw) > 0 && is_numeric($teacherSatRaw)) ? (float)$teacherSatRaw : 0.0;
        $studentSat = (strlen($studentSatRaw) > 0 && is_numeric($studentSatRaw)) ? (float)$studentSatRaw : 0.0;

        $stmt->execute([
            $row[0],
            $row[1],
            $row[2],
            $row[3],
            is_numeric($row[4]) ? (int)$row[4] : null,
            is_numeric($row[5]) ? (int)$row[5] : null,
            $teacherSat,
            $studentSat,
        ]);
        $rowCount++;
    }
    $pdo->commit();
    echo json_encode(['message' => 'Risk assessment data saved successfully', 'rows_inserted' => $rowCount]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data: ' . $e->getMessage()]);
    fclose($handle);
    exit();
}

fclose($handle);
?>
