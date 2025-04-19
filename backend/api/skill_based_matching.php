<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['resource'])) {
        $resource = $_GET['resource'];
        if ($resource === 'teachers') {
            // Sample teacher profiles data
            $teachers = [
                [
                    "id" => "T-1001",
                    "name" => "John Smith",
                    "subjects_expertise" => ["Physics", "Mathematics"],
                    "certifications" => ["LET Passer", "NC2"],
                    "proficiency" => ["Physics" => "Advanced", "Mathematics" => "Intermediate"],
                    "experience_years" => 8,
                    "additional_skills" => ["Drama", "Sports Coaching"],
                    "availability" => ["Monday" => true, "Tuesday" => true, "Wednesday" => true, "Thursday" => true, "Friday" => true],
                    "max_hours_per_week" => 20,
                    "preferences" => ["grades" => [11, 12], "subjects" => ["Physics"], "preferred_hours" => "morning", "preferred_days_off" => ["Friday"], "shift_preference" => "early"]
                ],
                [
                    "id" => "T-1002",
                    "name" => "Maria Garcia",
                    "subjects_expertise" => ["Biology", "Chemistry"],
                    "certifications" => ["LET Passer"],
                    "proficiency" => ["Biology" => "Advanced", "Chemistry" => "Intermediate"],
                    "experience_years" => 5,
                    "additional_skills" => ["Counseling"],
                    "availability" => ["Monday" => true, "Tuesday" => false, "Wednesday" => true, "Thursday" => true, "Friday" => true],
                    "max_hours_per_week" => 18,
                    "preferences" => ["grades" => [10, 11], "subjects" => ["Biology"], "preferred_hours" => "any", "preferred_days_off" => ["Monday"], "shift_preference" => null]
                ]
            ];
            echo json_encode($teachers);
            exit;
        } elseif ($resource === 'classes') {
            // Sample class/activity requirements data
            $classes = [
                [
                    "id" => "C-101",
                    "name" => "Grade 11 Physics",
                    "required_skills" => ["Physics", "Lab Safety Certification"],
                    "hours_per_week" => 10,
                    "class_time" => "08:00",
                    "class_end_time" => "10:00",
                    "class_day" => "Monday",
                    "shift" => "early",
                    "status" => "unassigned"
                ],
                [
                    "id" => "C-102",
                    "name" => "Grade 10 Biology",
                    "required_skills" => ["Biology"],
                    "hours_per_week" => 8,
                    "class_time" => "13:00",
                    "class_end_time" => "15:00",
                    "class_day" => "Tuesday",
                    "shift" => "late",
                    "status" => "assigned"
                ]
            ];
            echo json_encode($classes);
            exit;
        }
    }
} elseif ($method === 'POST') {
    // For matching request - to be implemented with ML integration
    $input = json_decode(file_get_contents('php://input'), true);
    // Integrate with Python ML script for matching with extended parameters
    $teachers = $input['teachers'] ?? [];
    $classes = $input['classes'] ?? [];
    $constraints = $input['constraints'] ?? [];
    $preferences = $input['preferences'] ?? [];

    // Save input data to temp files
    $teachers_file = sys_get_temp_dir() . '/teachers_input.json';
    $classes_file = sys_get_temp_dir() . '/classes_input.json';
    $constraints_file = sys_get_temp_dir() . '/constraints_input.json';
    $preferences_file = sys_get_temp_dir() . '/preferences_input.json';

    file_put_contents($teachers_file, json_encode($teachers));
    file_put_contents($classes_file, json_encode($classes));
    file_put_contents($constraints_file, json_encode($constraints));
    file_put_contents($preferences_file, json_encode($preferences));

    // Determine which Python script to run based on presence of constraints and preferences
    if (!empty($constraints) && !empty($preferences)) {
        $command = escapeshellcmd("python backend/ml_models/workload_distribution.py $teachers_file $classes_file $constraints_file $preferences_file");
    } else {
        $command = escapeshellcmd("python backend/ml_models/skill_based_matching.py $teachers_file $classes_file");
    }
    $output = shell_exec($command);

    if ($output === null) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to execute matching script"]);
        exit;
    }

    echo $output;
    exit;
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}
?>
