<?php
header('Content-Type: application/json');
include_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

switch ($method) {
    case 'GET':
        // Get teacher data by teacher_id or all teachers
        if (isset($_GET['teacher_id'])) {
            $teacher_id = $conn->real_escape_string($_GET['teacher_id']);
            $sql = "SELECT * FROM teachers WHERE teacher_id = '$teacher_id'";
            $result = $conn->query($sql);
            if ($result->num_rows > 0) {
                $teacher = $result->fetch_assoc();
                echo json_encode($teacher);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Teacher not found']);
            }
        } else {
            $sql = "SELECT * FROM teachers";
            $result = $conn->query($sql);
            $teachers = [];
            while ($row = $result->fetch_assoc()) {
                $teachers[] = $row;
            }
            echo json_encode($teachers);
        }
        break;

    case 'POST':
        // Create or update teacher basic info
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['teacher_id']) || !isset($data['teacher_name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }
        $teacher_id = $conn->real_escape_string($data['teacher_id']);
        $teacher_name = $conn->real_escape_string($data['teacher_name']);

        // Check if teacher exists
        $checkSql = "SELECT * FROM teachers WHERE teacher_id = '$teacher_id'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            // Update
            $updateSql = "UPDATE teachers SET teacher_name = '$teacher_name' WHERE teacher_id = '$teacher_id'";
            if ($conn->query($updateSql) === TRUE) {
                echo json_encode(['message' => 'Teacher updated']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Update failed']);
            }
        } else {
            // Insert
            $insertSql = "INSERT INTO teachers (teacher_id, teacher_name) VALUES ('$teacher_id', '$teacher_name')";
            if ($conn->query($insertSql) === TRUE) {
                echo json_encode(['message' => 'Teacher created']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Insert failed']);
            }
        }
        break;

    case 'DELETE':
        // Delete teacher by teacher_id
        if (!isset($_GET['teacher_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing teacher_id']);
            exit();
        }
        $teacher_id = $conn->real_escape_string($_GET['teacher_id']);
        $deleteSql = "DELETE FROM teachers WHERE teacher_id = '$teacher_id'";
        if ($conn->query($deleteSql) === TRUE) {
            echo json_encode(['message' => 'Teacher deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Delete failed']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();
?>
