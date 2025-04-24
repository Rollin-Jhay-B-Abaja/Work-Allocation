<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../config.php';

// Connect to database
try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Get POST data (assuming JSON)
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validation function
function validate_field($field, $value, $required = false, $type = 'string') {
    if ($required && (is_null($value) || $value === '')) {
        return "$field is required.";
    }
    if ($type === 'int' && !is_int($value)) {
        return "$field must be an integer.";
    }
    if ($type === 'array' && !is_array($value)) {
        return "$field must be an array.";
    }
    // Add more validation rules as needed
    return null;
}

// Validate fields
$errors = [];

$fields = [
    'employee_id' => ['required' => true, 'type' => 'string'],
    'name' => ['required' => true, 'type' => 'string'],
    'email' => ['required' => false, 'type' => 'string'],
    'contact_number' => ['required' => false, 'type' => 'string'],
    'position' => ['required' => true, 'type' => 'string'],
    'department' => ['required' => true, 'type' => 'string'],
    'subjects_expertise' => ['required' => false, 'type' => 'array'],
    'teaching_certifications' => ['required' => false, 'type' => 'array'],
    'teaching_experience_years' => ['required' => false, 'type' => 'int'],
    'additional_skills' => ['required' => false, 'type' => 'string'],
    'preferred_grade_levels' => ['required' => false, 'type' => 'array'],
    'proficiency_level' => ['required' => false, 'type' => 'array'],
    'availability_schedule' => ['required' => false, 'type' => 'string'],
    'preferred_time_slots' => ['required' => false, 'type' => 'string'],
    'preferred_days_off' => ['required' => false, 'type' => 'string'],
    'shift_preferences' => ['required' => false, 'type' => 'string'],
    'overtime_willingness' => ['required' => false, 'type' => 'bool'],
    'leave_requests' => ['required' => false, 'type' => 'string'],
    'assigned_classes' => ['required' => false, 'type' => 'string'],
    'teaching_hours_per_week' => ['required' => false, 'type' => 'int'],
    'administrative_duties' => ['required' => false, 'type' => 'string'],
    'extracurricular_duties' => ['required' => false, 'type' => 'string'],
    'feedback_scores' => ['required' => false, 'type' => 'string'],
    'absences' => ['required' => false, 'type' => 'string'],
    'max_teaching_hours' => ['required' => false, 'type' => 'int'],
    'min_rest_period' => ['required' => false, 'type' => 'string'],
    'contractual_constraints' => ['required' => false, 'type' => 'string'],
    'substitute_eligible_subjects' => ['required' => false, 'type' => 'array'],
    'substitute_availability' => ['required' => false, 'type' => 'string'],
];

// Validate each field
foreach ($fields as $field => $rules) {
    $value = $data[$field] ?? null;
    $error = validate_field($field, $value, $rules['required'], $rules['type']);
    if ($error) {
        $errors[$field] = $error;
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

// Prepare data for insertion/updating
// Convert arrays to JSON strings for storage
foreach ($fields as $field => $rules) {
    if ($rules['type'] === 'array' && isset($data[$field]) && is_array($data[$field])) {
        $data[$field] = json_encode($data[$field]);
    }
}

// Check if employee exists
$stmt = $conn->prepare("SELECT COUNT(*) FROM employees WHERE employee_id = :employee_id");
$stmt->execute(['employee_id' => $data['employee_id']]);
$exists = $stmt->fetchColumn() > 0;

try {
    if ($exists) {
        // Update existing employee
        $updateFields = [];
        foreach ($fields as $field => $rules) {
            if ($field !== 'employee_id') {
                $updateFields[] = "$field = :$field";
            }
        }
        $sql = "UPDATE employees SET " . implode(', ', $updateFields) . " WHERE employee_id = :employee_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute($data);
    } else {
        // Insert new employee
        $columns = implode(', ', array_keys($fields));
        $placeholders = ':' . implode(', :', array_keys($fields));
        $sql = "INSERT INTO employees ($columns) VALUES ($placeholders)";
        $stmt = $conn->prepare($sql);
        $stmt->execute($data);
    }
    echo json_encode(['success' => true, 'message' => 'Employee data saved successfully.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
