<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pythonPath = 'python'; // Adjust if needed
    $scriptPath = __DIR__ . '/../ml_models/teacher_retention.py';
    $command = escapeshellcmd("$pythonPath $scriptPath");
    $output = shell_exec($command . ' 2>&1');

    if ($output === null) {
        send_response(['error' => 'Failed to execute prediction script'], 500);
    }

    $decoded = json_decode($output, true);
    if ($decoded === null) {
        send_response(['error' => 'Invalid JSON output from prediction script', 'raw_output' => $output], 500);
    }

    send_response($decoded);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle saving uploaded CSV data to database
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        send_response(['error' => 'Invalid JSON input'], 400);
    }

    // Validate required fields
    $requiredFields = [
        'year', 'grade', 'students_STEM', 'students_ICT', 'students_GAS', 'students_ABM', 'students_HUMSS',
        'student_teacher_ratio_STEM', 'student_teacher_ratio_ICT', 'student_teacher_ratio_GAS', 'student_teacher_ratio_ABM', 'student_teacher_ratio_HUMSS',
        'teachers_STEM', 'teachers_ICT', 'teachers_GAS', 'teachers_ABM', 'teachers_HUMSS',
        'subject_handled', 'grade_level', 'employment_status', 'workload_hours', 'years_in_service', 'age', 'performance_rating',
        'historical_resignations', 'historical_retentions'
    ];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            send_response(['error' => "Missing field: $field"], 400);
        }
    }

    // Connect to database
    require_once __DIR__ . '/../config.php';
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Insert data into PredictionTable
        $stmt = $pdo->prepare("INSERT INTO PredictionTable 
            (year, grade, students_STEM, students_ICT, students_GAS, students_ABM, students_HUMSS,
             student_teacher_ratio_STEM, student_teacher_ratio_ICT, student_teacher_ratio_GAS, student_teacher_ratio_ABM, student_teacher_ratio_HUMSS,
             teachers_STEM, teachers_ICT, teachers_GAS, teachers_ABM, teachers_HUMSS,
             subject_handled, grade_level, employment_status, workload_hours, years_in_service, age, performance_rating,
             historical_resignations, historical_retentions)
            VALUES (:year, :grade, :students_STEM, :students_ICT, :students_GAS, :students_ABM, :students_HUMSS,
                    :student_teacher_ratio_STEM, :student_teacher_ratio_ICT, :student_teacher_ratio_GAS, :student_teacher_ratio_ABM, :student_teacher_ratio_HUMSS,
                    :teachers_STEM, :teachers_ICT, :teachers_GAS, :teachers_ABM, :teachers_HUMSS,
                    :subject_handled, :grade_level, :employment_status, :workload_hours, :years_in_service, :age, :performance_rating,
                    :historical_resignations, :historical_retentions)
            ON DUPLICATE KEY UPDATE
                grade = VALUES(grade),
                students_STEM = VALUES(students_STEM),
                students_ICT = VALUES(students_ICT),
                students_GAS = VALUES(students_GAS),
                students_ABM = VALUES(students_ABM),
                students_HUMSS = VALUES(students_HUMSS),
                student_teacher_ratio_STEM = VALUES(student_teacher_ratio_STEM),
                student_teacher_ratio_ICT = VALUES(student_teacher_ratio_ICT),
                student_teacher_ratio_GAS = VALUES(student_teacher_ratio_GAS),
                student_teacher_ratio_ABM = VALUES(student_teacher_ratio_ABM),
                student_teacher_ratio_HUMSS = VALUES(student_teacher_ratio_HUMSS),
                teachers_STEM = VALUES(teachers_STEM),
                teachers_ICT = VALUES(teachers_ICT),
                teachers_GAS = VALUES(teachers_GAS),
                teachers_ABM = VALUES(teachers_ABM),
                teachers_HUMSS = VALUES(teachers_HUMSS),
                subject_handled = VALUES(subject_handled),
                grade_level = VALUES(grade_level),
                employment_status = VALUES(employment_status),
                workload_hours = VALUES(workload_hours),
                years_in_service = VALUES(years_in_service),
                age = VALUES(age),
                performance_rating = VALUES(performance_rating),
                historical_resignations = VALUES(historical_resignations),
                historical_retentions = VALUES(historical_retentions)
        ");

        $stmt->execute([
            ':year' => $input['year'],
            ':grade' => $input['grade'],
            ':students_STEM' => $input['students_STEM'],
            ':students_ICT' => $input['students_ICT'],
            ':students_GAS' => $input['students_GAS'],
            ':students_ABM' => $input['students_ABM'],
            ':students_HUMSS' => $input['students_HUMSS'],
            ':student_teacher_ratio_STEM' => $input['student_teacher_ratio_STEM'],
            ':student_teacher_ratio_ICT' => $input['student_teacher_ratio_ICT'],
            ':student_teacher_ratio_GAS' => $input['student_teacher_ratio_GAS'],
            ':student_teacher_ratio_ABM' => $input['student_teacher_ratio_ABM'],
            ':student_teacher_ratio_HUMSS' => $input['student_teacher_ratio_HUMSS'],
            ':teachers_STEM' => $input['teachers_STEM'],
            ':teachers_ICT' => $input['teachers_ICT'],
            ':teachers_GAS' => $input['teachers_GAS'],
            ':teachers_ABM' => $input['teachers_ABM'],
            ':teachers_HUMSS' => $input['teachers_HUMSS'],
            ':subject_handled' => $input['subject_handled'],
            ':grade_level' => $input['grade_level'],
            ':employment_status' => $input['employment_status'],
            ':workload_hours' => $input['workload_hours'],
            ':years_in_service' => $input['years_in_service'],
            ':age' => $input['age'],
            ':performance_rating' => $input['performance_rating'],
            ':historical_resignations' => $input['historical_resignations'],
            ':historical_retentions' => $input['historical_retentions'],
        ]);

        send_response(['message' => 'Data saved successfully.']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    send_response(['error' => 'Method not allowed'], 405);
}
?>
