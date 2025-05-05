<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    exit();
}

function send_response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Received input: " . print_r($input, true));
    if ($input === null || !is_array($input)) {
        send_response(['error' => 'Invalid JSON input'], 400);
    }

    // Validate required fields for each row
    $requiredFields = [
        'year', 'teachers_STEM', 'teachers_ABM', 'teachers_GAS', 'teachers_HUMSS', 'teachers_ICT',
        'students_STEM', 'students_ABM', 'students_GAS', 'students_HUMSS', 'students_ICT',
        'historical_resignations', 'historical_retentions', 'workload_per_teacher',
        'salary_ratio', 'professional_dev_hours'
    ];

    require_once __DIR__ . '/../config.php';

    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=workforce;charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO teacher_retention_data 
            (year, teachers_STEM, teachers_ABM, teachers_GAS, teachers_HUMSS, teachers_ICT,
             students_STEM, students_ABM, students_GAS, students_HUMSS, students_ICT,
             historical_resignations, historical_retentions, workload_per_teacher,
             salary_ratio, professional_dev_hours)
            VALUES (:year, :teachers_STEM, :teachers_ABM, :teachers_GAS, :teachers_HUMSS, :teachers_ICT,
                    :students_STEM, :students_ABM, :students_GAS, :students_HUMSS, :students_ICT,
                    :historical_resignations, :historical_retentions, :workload_per_teacher,
                    :salary_ratio, :professional_dev_hours)
            ON DUPLICATE KEY UPDATE
                teachers_STEM = VALUES(teachers_STEM),
                teachers_ABM = VALUES(teachers_ABM),
                teachers_GAS = VALUES(teachers_GAS),
                teachers_HUMSS = VALUES(teachers_HUMSS),
                teachers_ICT = VALUES(teachers_ICT),
                students_STEM = VALUES(students_STEM),
                students_ABM = VALUES(students_ABM),
                students_GAS = VALUES(students_GAS),
                students_HUMSS = VALUES(students_HUMSS),
                students_ICT = VALUES(students_ICT),
                historical_resignations = VALUES(historical_resignations),
                historical_retentions = VALUES(historical_retentions),
                workload_per_teacher = VALUES(workload_per_teacher),
                salary_ratio = VALUES(salary_ratio),
                professional_dev_hours = VALUES(professional_dev_hours)
        ");

        foreach ($input as $row) {
            foreach ($requiredFields as $field) {
                if (!isset($row[$field])) {
                    $pdo->rollBack();
                    send_response(['error' => "Missing field $field in one of the rows"], 400);
                }
            }
            try {
                $stmt->execute([
                    ':year' => $row['year'],
                    ':teachers_STEM' => $row['teachers_STEM'],
                    ':teachers_ABM' => $row['teachers_ABM'],
                    ':teachers_GAS' => $row['teachers_GAS'],
                    ':teachers_HUMSS' => $row['teachers_HUMSS'],
                    ':teachers_ICT' => $row['teachers_ICT'],
                    ':students_STEM' => $row['students_STEM'],
                    ':students_ABM' => $row['students_ABM'],
                    ':students_GAS' => $row['students_GAS'],
                    ':students_HUMSS' => $row['students_HUMSS'],
                    ':students_ICT' => $row['students_ICT'],
                    ':historical_resignations' => $row['historical_resignations'],
                    ':historical_retentions' => $row['historical_retentions'],
                    ':workload_per_teacher' => $row['workload_per_teacher'],
                    ':salary_ratio' => $row['salary_ratio'],
                    ':professional_dev_hours' => $row['professional_dev_hours'],
                ]);
            } catch (PDOException $e) {
                error_log("Database error on row insert: " . $e->getMessage());
                $pdo->rollBack();
                send_response(['error' => 'Database error on row insert: ' . $e->getMessage()], 500);
            }
        }

        $pdo->commit();

        send_response(['message' => 'Data saved successfully.']);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    send_response(['error' => 'Method not allowed'], 405);
}
?>
