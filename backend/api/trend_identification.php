<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// Add CORS headers to all responses
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

set_error_handler(function ($severity, $message, $file, $line) {
    $errorLogPath = __DIR__ . '/../error_trend_identification.log';
    $logMessage = "PHP Error: Severity $severity, Message: $message, File: $file, Line: $line\n";
    file_put_contents($errorLogPath, $logMessage, FILE_APPEND);
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Internal Server Error', 'message' => $message]);
    exit();
});

set_exception_handler(function ($exception) {
    $errorLogPath = __DIR__ . '/../error_trend_identification.log';
    $logMessage = "Uncaught Exception: " . $exception->getMessage() . "\n";
    file_put_contents($errorLogPath, $logMessage, FILE_APPEND);
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Internal Server Error', 'message' => $exception->getMessage()]);
    exit();
});

function send_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    send_response(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
    exit();
}

function is_shell_exec_enabled() {
    return is_callable('shell_exec') && stripos(ini_get('disable_functions'), 'shell_exec') === false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $debugLogPath = __DIR__ . '/../debug_trend_identification.log';
    file_put_contents($debugLogPath, "GET request received\n", FILE_APPEND);
    try {
        if (!is_shell_exec_enabled()) {
            send_response(['error' => 'shell_exec function is disabled in PHP configuration'], 500);
        }

        // Fetch raw data from database with join to teacher_evaluations for scores
        $query = "SELECT 
            ti.year AS Year,
            s.strand_name AS Strand,
            ti.teachers_count AS TeachersCount,
            ti.students_count AS StudentsCount,
            ti.max_class_size AS MaxClassSize,
            ti.salary_ratio AS SalaryRatio,
            ti.professional_dev_hours AS ProfessionalDevHours,
            ti.historical_resignations AS HistoricalResignations,
            ti.historical_retentions AS HistoricalRetentions,
            ti.workload_per_teacher AS WorkloadPerTeacher,
            ti.classroom_observation_scores AS ClassroomObservationScores,
            ti.teacher_evaluation_scores AS TeacherEvaluationScores
            FROM workforce.trend_identification ti
            JOIN workforce.strands s ON ti.strand_id = s.strand_id
            ORDER BY ti.year, s.strand_name";

        try {
            $stmt = $pdo->query($query);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            file_put_contents($debugLogPath, "Fetched rows count: " . count($data) . "\n", FILE_APPEND);
        } catch (PDOException $e) {
            file_put_contents($debugLogPath, "SQL query error: " . $e->getMessage() . "\n", FILE_APPEND);
            send_response(['error' => 'Database query failed', 'message' => $e->getMessage()], 500);
        }

        // Call Flask API to get trend analysis and recommendations
        $flaskApiUrl = 'http://localhost:5000/api/trend_identification';
        $options = [
            'http' => [
                'method'  => 'GET',
                'ignore_errors' => true
            ]
        ];
        $context  = stream_context_create($options);
        try {
            $response = file_get_contents($flaskApiUrl, false, $context);

            if ($response === false) {
                $error = error_get_last();
                file_put_contents($debugLogPath, "Error fetching Flask API: " . print_r($error, true) . "\n", FILE_APPEND);
                send_response(['error' => 'Failed to fetch Flask API', 'details' => $error], 500);
            }

            $httpCode = null;
            if (isset($http_response_header) && is_array($http_response_header)) {
                foreach ($http_response_header as $header) {
                    if (preg_match('#^HTTP/\d+\.\d+\s+(\d+)#', $header, $matches)) {
                        $httpCode = intval($matches[1]);
                        break;
                    }
                }
            }

            file_put_contents($debugLogPath, "Flask API HTTP code: $httpCode\n", FILE_APPEND);
            file_put_contents($debugLogPath, "Flask API response: $response\n", FILE_APPEND);

            if ($httpCode !== 200) {
                send_response(['error' => 'Flask API call failed', 'http_code' => $httpCode, 'response' => $response], 500);
            }

            // Sanitize JSON response to replace NaN with null before decoding
            $sanitizedResponse = preg_replace('/:\s*NaN/', ': null', $response);

            $decodedOutput = json_decode($sanitizedResponse, true);
            if ($decodedOutput === null) {
                send_response(['error' => 'Flask API response is not valid JSON', 'raw_response' => $sanitizedResponse], 500);
            }
        } catch (Exception $ex) {
            file_put_contents($debugLogPath, "Exception during Flask API call: " . $ex->getMessage() . "\n", FILE_APPEND);
            send_response(['error' => 'Exception during Flask API call', 'message' => $ex->getMessage()], 500);
        }

        // Merge database data and trend analysis results including recommendations
        $result = [
            'data' => $data,
            'correlation_matrix' => $decodedOutput['correlation_matrix'] ?? null,
            'recommendations' => $decodedOutput['recommendations'] ?? [],
            'correlation_coefficient' => $decodedOutput['correlation_coefficient'] ?? null,
            'p_value' => $decodedOutput['p_value'] ?? null,
            'regression_slope' => $decodedOutput['regression_slope'] ?? null,
            'regression_intercept' => $decodedOutput['regression_intercept'] ?? null
        ];

        send_response($result);
    } catch (Exception $e) {
        $errorLogPath = __DIR__ . '/../error_trend_identification.log';
        file_put_contents($errorLogPath, $e->getMessage() . "\n", FILE_APPEND);
        send_response(['error' => 'Failed to fetch data: ' . $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['delete_all']) && $input['delete_all'] === true) {
        try {
            $stmt = $pdo->prepare("DELETE FROM trend_identification");
            $stmt->execute();
            send_response(['message' => 'All records deleted successfully']);
        } catch (Exception $e) {
            send_response(['error' => 'Failed to delete all records: ' . $e->getMessage()], 500);
        }
        exit();
    }

    $teacherId = $input['teacherId'] ?? '';
    $year = $input['year'] ?? '';
    $strand_id = $input['strand_id'] ?? '';

    if (empty($year) || empty($strand_id)) {
        send_response(['error' => 'Missing required parameters for deletion'], 400);
    }

    try {
        // Prefix strand_id with table name to avoid ambiguity
        $stmt = $pdo->prepare("DELETE FROM trend_identification WHERE year = ? AND trend_identification.strand_id = ?");
        $stmt->execute([$year, $strand_id]);
        if ($stmt->rowCount() > 0) {
            send_response(['message' => 'Record deleted successfully']);
        } else {
            send_response(['error' => 'Record not found'], 404);
        }
    } catch (Exception $e) {
        send_response(['error' => 'Failed to delete record: ' . $e->getMessage()], 500);
    }
    exit();
}
