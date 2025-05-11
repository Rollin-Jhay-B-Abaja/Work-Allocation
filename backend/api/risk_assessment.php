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
    $heatmapScriptPath = __DIR__ . '/../ml_models/risk_heatmap_aggregation.py';

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
        // Check if riskOutput contains error key and handle gracefully
        $riskScoresCheck = json_decode($riskOutput, true);
        if (isset($riskScoresCheck['error'])) {
            error_log("Risk assessment script returned error: " . $riskScoresCheck['error']);
            send_response(['error' => 'Risk assessment script error', 'details' => $riskScoresCheck['error']], 500);
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

    $selectQuery = "SELECT id AS risk_id, teacher_retention_id, year, strand, performance, hours_per_week, teacher_satisfaction, student_satisfaction, teachers_count, students_count, max_class_size, salary_ratio, professional_dev_hours, historical_resignations, historical_retentions, workload_per_teacher FROM risk_assessment";
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

        // Compute burnout analysis averages for high risk teachers
        $highRiskTeachers = array_filter($results, function ($t) {
            return isset($t['Risk Level']) && $t['Risk Level'] === 'High';
        });

        $burnoutAnalysis = [
            'average_hours_per_week' => 0,
            'average_performance' => 0,
            'average_teacher_satisfaction' => 0,
            'average_student_satisfaction' => 0,
            'count' => count($highRiskTeachers),
        ];

        if ($burnoutAnalysis['count'] > 0) {
            $sumHours = 0;
            $sumPerformance = 0;
            $sumTeacherSat = 0;
            $sumStudentSat = 0;

            foreach ($highRiskTeachers as $teacher) {
                $sumHours += isset($teacher['hours_per_week']) ? floatval($teacher['hours_per_week']) : 0;
                $sumPerformance += isset($teacher['performance']) ? floatval($teacher['performance']) : 0;
                $sumTeacherSat += isset($teacher['teacher_satisfaction']) ? floatval($teacher['teacher_satisfaction']) : 0;
                $sumStudentSat += isset($teacher['student_satisfaction']) ? floatval($teacher['student_satisfaction']) : 0;
            }

            $burnoutAnalysis['average_hours_per_week'] = $sumHours / $burnoutAnalysis['count'];
            $burnoutAnalysis['average_performance'] = $sumPerformance / $burnoutAnalysis['count'];
            $burnoutAnalysis['average_teacher_satisfaction'] = $sumTeacherSat / $burnoutAnalysis['count'];
            $burnoutAnalysis['average_student_satisfaction'] = $sumStudentSat / $burnoutAnalysis['count'];

            error_log("Burnout Analysis computed averages: Hours: " . $burnoutAnalysis['average_hours_per_week'] . ", Performance: " . $burnoutAnalysis['average_performance'] . ", Teacher Sat: " . $burnoutAnalysis['average_teacher_satisfaction'] . ", Student Sat: " . $burnoutAnalysis['average_student_satisfaction']);
        }

        // Run recommendations script with teacher data as input
        $inputJson = json_encode($results);

        // Write input JSON to a temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'rec_input_');
        file_put_contents($tempFile, $inputJson);

        $descriptorspec = [
            1 => ["pipe", "w"],  // stdout
            2 => ["pipe", "w"]   // stderr
        ];
        $command = escapeshellarg($pythonPath) . ' ' . escapeshellarg($recScriptPath) . ' ' . escapeshellarg($tempFile);
        $process = proc_open($command, $descriptorspec, $pipes);
        if (is_resource($process)) {
            $recOutput = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $recError = stream_get_contents($pipes[2]);
            fclose($pipes[2]);
            $return_value = proc_close($process);

            // Delete the temporary file
            unlink($tempFile);

            if ($return_value !== 0) {
                error_log("Recommendations script error: " . $recError);
                send_response(['error' => 'Failed to run recommendations script', 'details' => $recError], 500);
            }
            if (empty($recOutput)) {
                $errorMsg = "Recommendations script output is empty.";
                error_log($errorMsg);
                send_response(['error' => $errorMsg], 500);
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

        // Fetch individual teacher evaluations joined with teachers table for teacher-wise heatmap
        $evalQuery = "SELECT te.evaluation_id, te.teacher_id, t.name as teacher_name, te.eval_period_id, te.evaluator_id, te.overall_score, te.classroom_observation_score, te.student_feedback_score, te.peer_review_score FROM teacher_evaluations te LEFT JOIN teachers t ON te.teacher_id = t.teacher_id";
        $evalStmt = $pdo->prepare($evalQuery);
        $evalStmt->execute();
        $teacherEvaluations = $evalStmt->fetchAll(PDO::FETCH_ASSOC);

        // Run risk heatmap aggregation script with risk assessment data as input
        $heatmapInputJson = json_encode($results);

        $descriptorspecHeatmap = [
            0 => ["pipe", "r"],  // stdin
            1 => ["pipe", "w"],  // stdout
            2 => ["pipe", "w"]   // stderr
        ];
        $commandHeatmap = escapeshellarg($pythonPath) . ' ' . escapeshellarg($heatmapScriptPath);
        $processHeatmap = proc_open($commandHeatmap, $descriptorspecHeatmap, $pipesHeatmap);
        if (is_resource($processHeatmap)) {
            fwrite($pipesHeatmap[0], $heatmapInputJson);
            fclose($pipesHeatmap[0]);
            $heatmapOutput = stream_get_contents($pipesHeatmap[1]);
            fclose($pipesHeatmap[1]);
            $heatmapError = stream_get_contents($pipesHeatmap[2]);
            fclose($pipesHeatmap[2]);
            $return_value_heatmap = proc_close($processHeatmap);

            if ($return_value_heatmap !== 0) {
                error_log("Risk heatmap aggregation script error: " . $heatmapError);
                send_response(['error' => 'Failed to run risk heatmap aggregation script', 'details' => $heatmapError], 500);
            }

            $heatmapData = json_decode($heatmapOutput, true);
            if ($heatmapData === null) {
                $errorMsg = "Failed to decode heatmap JSON. Output: $heatmapOutput";
                error_log($errorMsg);
                send_response(['error' => $errorMsg], 500);
            }
        } else {
            send_response(['error' => 'Failed to start risk heatmap aggregation script'], 500);
        }

        $response = [
            'teachers' => $results,
            'recommendations' => $recommendations,
            'burnoutAnalysis' => $burnoutAnalysis,
            'teacherEvaluations' => $teacherEvaluations,
            'riskHeatmap' => $heatmapData,
            'riskHeatmapImageUrl' => isset($heatmapData['heatmap_image_url']) ? $heatmapData['heatmap_image_url'] : null
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
        $expectedHeaders = ['Teacher Retention ID', 'Year', 'Strand', 'Performance', 'Hours per week', 'Class size', 'Teacher satisfaction', 'Student satisfaction'];

        // Remove 'Class size' from expected headers and validation
        $expectedHeaders = ['Teacher Retention ID', 'Year', 'Strand', 'Performance', 'Hours per week', 'Teacher satisfaction', 'Student satisfaction'];

        if ($header !== $expectedHeaders) {
            fclose($handle);
            send_response(['error' => 'CSV headers do not match expected format'], 400);
        }

        $insertQuery = "INSERT INTO risk_assessment (teacher_retention_id, year, strand, performance, hours_per_week, teacher_satisfaction, student_satisfaction) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertQuery);

        $pdo->beginTransaction();

        try {
            $rowCount = 0;
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) !== count($expectedHeaders)) {
                    continue; // skip invalid rows
                }
                $teacherSatRaw = str_replace('%', '', trim($row[5]));
                $studentSatRaw = str_replace('%', '', trim($row[6]));

                $teacherSat = (strlen($teacherSatRaw) > 0 && is_numeric($teacherSatRaw)) ? (float)$teacherSatRaw : 0.0;
                $studentSat = (strlen($studentSatRaw) > 0 && is_numeric($studentSatRaw)) ? (float)$studentSatRaw : 0.0;

                $stmt->execute([
                    $row[0], // teacher_retention_id
                    $row[1], // year
                    $row[2], // strand
                    $row[3], // performance
                    is_numeric($row[4]) ? (int)$row[4] : null,
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
