<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
error_reporting(E_ALL); // Enable error reporting
ini_set('display_errors', 1); // Display errors on the screen

require_once __DIR__ . '/../config.php';

$conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// POST endpoint to add enrollment data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $date = $data['date'];
    $enrollees_per_strand = $data['enrollees_per_strand'];

    // Extract year from date
    $year = date('Y', strtotime($date));

    $stmt = $conn->prepare("INSERT INTO studentenrollmentprediction (year, STEM, ABM, GAS, HUMSS, ICT) VALUES (:year, :STEM, :ABM, :GAS, :HUMSS, :ICT)");
    
    //$stmt->bindParam(':date', $date); // Bind date
    $stmt->bindParam(':year', $year); // Bind extracted year
    $stmt->bindParam(':STEM', $enrollees_per_strand['STEM']); // Bind STEM
    $stmt->bindParam(':ABM', $enrollees_per_strand['ABM']); // Bind ABM
    $stmt->bindParam(':GAS', $enrollees_per_strand['GAS']); // Bind GAS
    $stmt->bindParam(':HUMSS', $enrollees_per_strand['HUMSS']); // Bind HUMSS
    $stmt->bindParam(':ICT', $enrollees_per_strand['ICT']); // Bind ICT

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Data inserted successfully', 'id' => $conn->lastInsertId()]); // Return the ID of the inserted record
    } else {
        echo json_encode(['message' => 'Failed to insert data']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    error_log("Incoming DELETE request data: " . file_get_contents("php://input")); // Log incoming request data for debugging
    $data = json_decode(file_get_contents("php://input"), true); // Decode the incoming JSON data


    $id = $data['id']; // Get the ID from the request

    $stmt = $conn->prepare("DELETE FROM studentenrollmentprediction WHERE id = :id");
    $stmt->bindParam(':id', $id); // Bind the ID

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Data deleted successfully']);
    } else {
        echo json_encode(['message' => 'Failed to delete data']);
    }
}

// GET endpoint to retrieve enrollment data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM studentenrollmentprediction"); // Corrected table name

    if ($stmt->execute()) {
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
    } else {
        echo json_encode(['message' => 'Failed to retrieve data']);
    }
}
?>
