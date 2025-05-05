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

function send_response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function connect_db() {
    $host = 'localhost';
    $dbname = 'workforce';
    $username = 'root';
    $password = 'Omamam@010101';

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        send_response(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
    }
}

$pdo = connect_db();

function mapRiskDistributionToLevel($distribution) {
    // Map risk distribution to risk level with highest probability
    $maxProb = 0;
    $riskLevel = "Low";
    foreach ($distribution as $level => $prob) {
        if ($prob > $maxProb) {
            $maxProb = $prob;
            $riskLevel = $level;
        }
    }
    return $riskLevel;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Include Python Bayesian Network model
    // Use full path to python executable and script
    $pythonPath = 'python'; // Adjust this path to your python executable on Windows
    $riskScriptPath = __DIR__ . '/../ml_models/risk_assessment_inference.py';
    $recScriptPath = __DIR__ . '/../ml_models/recommendations.py';

    // Run risk assessment script using proc_open for better control
    $descriptorspec = [
        0 => ["pipe", "r"],  // stdin
        1 => ["pipe", "w"],  // stdout
        2 => ["pipe", "w"]   // stderr
    ];
    $command = "$pythonPath \"$riskScriptPath\"";
    error_log("Executing risk assessment script command: " . $command);
    $process = proc_open($command, $descriptorspec, $pipes);
    if (is_resource($process)) {
        fclose($pipes[0]); // No input to python script
        $riskOutput = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $riskError = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $return_value = proc_close($process);
        error_log("Risk assessment script return code: " . $return_value);
        error_log("Risk assessment script stderr: " . $riskError);
        if ($return_value !== 0) {
            send_response(['error' => 'Failed to run risk assessment script', 'details' => $riskError], 500);
        }
    } else {
        $errorMsg = "Failed to start risk assessment script process.";
        error_log($errorMsg);
        send_response(['error' => $errorMsg], 500);
    }

    error_log("Risk Python script output: " . $riskOutput);
    $riskScores = json_decode($riskOutput, true);
    if ($riskScores === null) {
        $errorMsg = "Failed to decode risk scores JSON from Python script. Output: $riskOutput";
        error_log($errorMsg);
        send_response(['error' => $errorMsg], 500);
    }

    $selectQuery = "SELECT ra.id AS risk_id, trd.id AS teacher_retention_id, trd.year, ra.performance, ra.hours_per_week, ra.class_size, ra.teacher_satisfaction, ra.student_satisfaction FROM risk_assessment ra JOIN teacher_retention_data trd ON ra.teacher_retention_id = trd.id";
    $stmt = $pdo->prepare($selectQuery);
    try {
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add Bayesian Network risk scores to results
        error_log("Risk Scores keys: " . implode(", ", array_keys($riskScores)));
        foreach ($results as &$teacher) {
            $teacherId = $teacher['teacher_retention_id'];
            error_log("Matching teacher retention ID: " . $teacherId);
            $normalizedTeacherId = strtolower(trim($teacherId));
            $normalizedRiskScores = array_change_key_case($riskScores, CASE_LOWER);
            if (isset($normalizedRiskScores[$normalizedTeacherId])) {
                $teacher['Risk Distribution'] = $normalizedRiskScores[$normalizedTeacherId];
                $teacher['Risk Level'] = mapRiskDistributionToLevel($normalizedRiskScores[$normalizedTeacherId]);
            } else {
                $teacher['Risk Distribution'] = null;
                $teacher['Risk Level'] = "Unknown";
            }
        }

        // Run recommendations script with teacher data as input
        $inputJson = json_encode($results);
        $descriptorspec = [
            0 => ["pipe", "r"],  // stdin
            1 => ["pipe", "w"],  // stdout
            2 => ["pipe", "w"]   // stderr
        ];
        $process = proc_open("$pythonPath $recScriptPath", $descriptorspec, $pipes);
        if (is_resource($process)) {
            fwrite($pipes[0], $inputJson);
            fclose($pipes[0]);
            $recOutput = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $recError = stream_get_contents($pipes[2]);
            fclose($pipes[2]);
            $return_value = proc_close($process);
            if ($return_value !== 0) {
                error_log("Recommendations script error: " . $recError);
                send_response(['error' => 'Failed to run recommendations script', 'details' => $recError], 500);
            }
            $recommendations = json_decode($recOutput, true);
            if ($recommendations === null) {
                $errorMsg = "Failed to decode recommendations JSON. Output: $recOutput";
                error_log($errorMsg);
                send_response(['error' => $errorMsg], 500);
            }
        } else {
            send_response(['error' => 'Failed to start recommendations script'], 500);
        }

        $response = [
            'teachers' => $results,
            'recommendations' => $recommendations
        ];

        send_response($response);
    } catch (Exception $e) {
        send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $teacher_id = $_GET['teacher_id'] ?? null;

    if ($teacher_id) {
        $deleteQuery = "DELETE FROM risk_assessment WHERE teacher_id = ?";
        $stmt = $pdo->prepare($deleteQuery);
        try {
            if ($stmt->execute([$teacher_id])) {
                send_response(['message' => 'Data deleted successfully']);
            } else {
                send_response(['error' => 'Failed to delete data'], 500);
            }
        } catch (Exception $e) {
            send_response(['error' => 'Failed to delete data: ' . $e->getMessage()], 500);
        }
    } else {
        $deleteAllQuery = "DELETE FROM risk_assessment";
        $stmt = $pdo->prepare($deleteAllQuery);
        try {
            if ($stmt->execute()) {
                send_response(['message' => 'All data deleted successfully']);
            } else {
                send_response(['error' => 'Failed to delete all data'], 500);
            }
        } catch (Exception $e) {
            send_response(['error' => 'Failed to delete all data: ' . $e->getMessage()], 500);
        }
    }
}

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_FILES['file'])) {
            send_response(['error' => 'No file uploaded'], 400);
        }

        $file = $_FILES['file']['tmp_name'];

        if (($handle = fopen($file, 'r')) === false) {
            send_response(['error' => 'Failed to open uploaded file'], 400);
        }

        $header = fgetcsv($handle);
        $expectedHeaders = ['Teacher ID', 'Name', 'Strand', 'Performance', 'Hours per week', 'Class size', 'Teacher satisfaction', 'Student satisfaction'];

        if ($header !== $expectedHeaders) {
            fclose($handle);
            send_response(['error' => 'CSV headers do not match expected format'], 400);
        }

        $insertQuery = "INSERT INTO risk_assessment (teacher_id, strand_id, performance, hours_per_week, class_size, teacher_satisfaction, student_satisfaction) VALUES (?, ?, ?, ?, ?, ?, ?)";
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

                // Get strand_id from strands table
                $strandName = $row[2];
                $strandStmt = $pdo->prepare("SELECT id FROM strands WHERE name = ?");
                $strandStmt->execute([$strandName]);
                $strandId = $strandStmt->fetchColumn();
                if (!$strandId) {
                    fclose($handle);
                    send_response(['error' => "Strand '$strandName' not found in strands table."], 400);
                }

                $stmt->execute([
                    $row[0],
                    $strandId,
                    $row[3],
                    is_numeric($row[4]) ? (int)$row[4] : null,
                    is_numeric($row[5]) ? (int)$row[5] : null,
                    $teacherSat,
                    $studentSat,
                ]);
                $rowCount++;
            }
            $pdo->commit();
            fclose($handle);
            send_response(['message' => 'Risk assessment data saved successfully', 'rows_inserted' => $rowCount]);
        } catch (Exception $e) {
            $pdo->rollBack();
            fclose($handle);
            send_response(['error' => 'Failed to save data: ' . $e->getMessage()], 500);
        }
    }
?>
