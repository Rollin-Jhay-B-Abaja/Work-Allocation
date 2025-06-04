<?php
// Ensure no whitespace or blank lines before this tag to prevent output before headers
ini_set('display_errors', 0);
error_reporting(0);

header("Content-Type: application/json");
require_once __DIR__ . '/../config.php';

// Debug log function
function debug_log($message) {
    error_log("[employee_handler.php] " . $message);
}

// Connect to database
try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debug_log("Database connection established.");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    debug_log("Database connection failed: " . $e->getMessage());
    exit;
}

// Helper function to get or create department_id by name
function getDepartmentId(PDO $conn, $departmentName) {
    $stmt = $conn->prepare("SELECT department_id FROM departments WHERE department = :name");
    $stmt->execute([':name' => $departmentName]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }
    $stmt = $conn->prepare("INSERT INTO departments (department) VALUES (:name)");
    $stmt->execute([':name' => $departmentName]);
    return $conn->lastInsertId();
}

// Helper function to get or create position_id by title
function getPositionId(PDO $conn, $positionTitle) {
    $stmt = $conn->prepare("SELECT position_id FROM positions WHERE position = :title");
    $stmt->execute([':title' => $positionTitle]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }
    $stmt = $conn->prepare("INSERT INTO positions (position) VALUES (:title)");
    $stmt->execute([':title' => $positionTitle]);
    return $conn->lastInsertId();
}

// Helper function to get or create certification type id
function getCertificationTypeId(PDO $conn, $certName) {
    $stmt = $conn->prepare("SELECT cert_id FROM certification_types WHERE certification = :name");
    $stmt->execute([':name' => $certName]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }
    $stmt = $conn->prepare("INSERT INTO certification_types (certification) VALUES (:name)");
    $stmt->execute([':name' => $certName]);
    return $conn->lastInsertId();
}

// Helper function to get or create subject area id
function getSubjectAreaId(PDO $conn, $subjectName) {
    $stmt = $conn->prepare("SELECT subject_id FROM subject_areas WHERE subject = :name");
    $stmt->execute([':name' => $subjectName]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }
    $stmt = $conn->prepare("INSERT INTO subject_areas (subject) VALUES (:name)");
    $stmt->execute([':name' => $subjectName]);
    return $conn->lastInsertId();
}

// Validation function (simplified)
function validate_required($field, $value) {
    if (empty($value)) {
        return "$field is required.";
    }
    return null;
}

// Validate employment_status against allowed ENUM values
function validate_employment_status($value) {
    $allowed = ['Active', 'On Leave', 'Terminated'];
    if (!in_array($value, $allowed, true)) {
        return "employment_status must be one of: " . implode(', ', $allowed) . ".";
    }
    return null;
}

// Map CSV/JSON input keys to database fields
function mapInputData($data) {
    return [
        // 'teacher_id' => $data['teacher_id'] ?? null, // Removed teacher_id mapping
        'teacher_name' => $data['name'] ?? null,
        'hire_date' => $data['hire_date'] ?? null,
        'employment_status' => $data['employment_status'] ?? null,
        'email' => $data['email'] ?? null,
        'phone' => $data['contact_number'] ?? null,
        'position' => $data['position'] ?? null,
        'department' => $data['department'] ?? null,
        'teaching_certifications' => $data['teaching_certifications'] ?? null,
        'subjects_expertise' => $data['subjects_expertise'] ?? null,
        'teaching_hours_per_week' => $data['teaching_hours_per_week'] ?? null,
        'administrative_duties' => $data['administrative_duties'] ?? null,
        'extracurricular_duties' => $data['extracurricular_duties'] ?? null,
        'max_teaching_hours' => $data['max_teaching_hours'] ?? null,
    ];
}

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("
            SELECT
                t.teacher_id AS id, 
                t.name AS teacher_name, 
                t.photo AS photo,
                GROUP_CONCAT(DISTINCT sa.subject SEPARATOR ', ') AS strand_name, 
                MAX(CASE WHEN ct.type_name = 'Email' THEN tc.contact_value ELSE NULL END) AS email,
                MAX(CASE WHEN ct.type_name = 'Phone' THEN tc.contact_value ELSE NULL END) AS phone,
                DATE_FORMAT(t.hire_date, '%Y-%m-%d') AS hire_date
            FROM teachers t
            LEFT JOIN teacher_contacts tc ON t.teacher_id = tc.teacher_id
            LEFT JOIN contact_types ct ON tc.contact_type_id = ct.contact_type_id
            LEFT JOIN teacher_subject_expertise tse ON t.teacher_id = tse.teacher_id
            LEFT JOIN subject_areas sa ON tse.subject_id = sa.subject_id
            GROUP BY t.teacher_id, t.name, t.photo, t.hire_date
            ORDER BY t.name ASC
        ");
        $stmt->execute();
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['employees' => $employees]);
    } catch (PDOException $e) {
        error_log("Error fetching employees: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch employees: ' . $e->getMessage()]);
    }
    exit;
}

$inputData = null;
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    if (isset($_FILES['csv_upload']) && $_FILES['csv_upload']['error'] === UPLOAD_ERR_OK) {
        debug_log("CSV upload detected.");
        $fileTmpPath = $_FILES['csv_upload']['tmp_name'];
        $handle = fopen($fileTmpPath, 'r');
        if ($handle === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to open uploaded CSV file.']);
            exit;
        }
        $header = fgetcsv($handle);
        if ($header === false) {
            http_response_code(400);
            echo json_encode(['error' => 'CSV file is empty or invalid.']);
            exit;
        }
        $inputData = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) !== count($header)) {
                continue; // skip invalid rows
            }
            $inputData[] = array_combine($header, $row);
        }
        fclose($handle);
    } else {
        $inputData = json_decode(file_get_contents('php://input'), true);
        if (!$inputData) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }
        // Wrap single object into array for uniform processing
        if (isset($inputData['name'])) {
            $inputData = [$inputData];
        }
    }
}

$errors = [];
$successCount = 0;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    try {
        $conn->beginTransaction();

        foreach ($inputData as $index => $data) {
            $rowNum = $index + 1;

            $mapped = mapInputData($data);

            // Validate required fields
            $err = validate_required('teacher_name', $mapped['teacher_name']);
            if ($err) {
                $errors[] = "Row $rowNum: $err";
                continue;
            }

            // Validate employment_status
            $err = validate_employment_status($mapped['employment_status']);
            if ($err) {
                $errors[] = "Row $rowNum: $err";
                continue;
            }

            // Insert or update teacher
            $teacherId = $mapped['teacher_id'];
            if ($teacherId) {
                $stmt = $conn->prepare("SELECT COUNT(*) FROM teachers WHERE teacher_id = :id");
                $stmt->execute([':id' => $teacherId]);
                $exists = $stmt->fetchColumn() > 0;
            } else {
                $exists = false;
            }

            if ($exists) {
                $sql = "UPDATE teachers SET name = :name, hire_date = :hire_date, employment_status = :status WHERE teacher_id = :id";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    ':name' => $mapped['teacher_name'],
                    ':hire_date' => $mapped['hire_date'],
                    ':status' => $mapped['employment_status'],
                    ':id' => $teacherId,
                ]);
            } else {
                if (!$teacherId) {
                    // Generate incremental zero-padded teacher_id starting from 0001
                    $stmtMax = $conn->prepare("SELECT MAX(CAST(teacher_id AS UNSIGNED)) FROM teachers");
                    $stmtMax->execute();
                    $maxId = $stmtMax->fetchColumn();
                    $nextId = $maxId ? $maxId + 1 : 1;
                    $teacherId = str_pad($nextId, 4, '0', STR_PAD_LEFT);
                }
                $sql = "INSERT INTO teachers (teacher_id, name, hire_date, employment_status) VALUES (:id, :name, :hire_date, :status)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    ':id' => $teacherId,
                    ':name' => $mapped['teacher_name'],
                    ':hire_date' => $mapped['hire_date'],
                    ':status' => $mapped['employment_status'],
                ]);
            }

            // Handle contacts (email, phone)
            $contactTypes = ['email' => 'Email', 'phone' => 'Phone'];
            foreach ($contactTypes as $field => $typeName) {
                if (!empty($mapped[$field])) {
                    $stmt = $conn->prepare("SELECT contact_type_id FROM contact_types WHERE type_name = :name");
                    $stmt->execute([':name' => $typeName]);
                    $contactTypeId = $stmt->fetchColumn();
                    if (!$contactTypeId) {
                        $stmt = $conn->prepare("INSERT INTO contact_types (type_name) VALUES (:name)");
                        $stmt->execute([':name' => $typeName]);
                        $contactTypeId = $conn->lastInsertId();
                    }
                    // Insert or update teacher_contacts
                    $stmt = $conn->prepare("SELECT contact_id FROM teacher_contacts WHERE teacher_id = :tid AND contact_type_id = :ctid");
                    $stmt->execute([':tid' => $teacherId, ':ctid' => $contactTypeId]);
                    $contactId = $stmt->fetchColumn();
                    if ($contactId) {
                        $stmt = $conn->prepare("UPDATE teacher_contacts SET contact_value = :val, is_primary = 1 WHERE contact_id = :cid");
                        $stmt->execute([':val' => $mapped[$field], ':cid' => $contactId]);
                    } else {
                        $stmt = $conn->prepare("INSERT INTO teacher_contacts (teacher_id, contact_type_id, contact_value, is_primary) VALUES (:tid, :ctid, :val, 1)");
                        $stmt->execute([':tid' => $teacherId, ':ctid' => $contactTypeId, ':val' => $mapped[$field]]);
                    }
                }
            }

            // Handle position and department
            if (!empty($mapped['position']) && !empty($mapped['department'])) {
                $positionId = getPositionId($conn, $mapped['position']);
                $departmentId = getDepartmentId($conn, $mapped['department']);
                // Insert teacher_positions with current date as effective_date
                $stmt = $conn->prepare("INSERT INTO teacher_positions (teacher_id, position_id, department_id, effective_date) VALUES (:tid, :pid, :did, CURDATE())");
                $stmt->execute([':tid' => $teacherId, ':pid' => $positionId, ':did' => $departmentId]);
            }

            // Handle certifications
            if (!empty($mapped['teaching_certifications'])) {
                $certifications = $mapped['teaching_certifications'];
                if (is_array($certifications)) {
                    $certifications = implode(',', $certifications);
                }
                $certs = preg_split('/[;,]/', $certifications);
                foreach ($certs as $certName) {
                    $certName = trim($certName);
                    if ($certName === '') continue;
                    $certId = getCertificationTypeId($conn, $certName);
                    $stmt = $conn->prepare("INSERT INTO teacher_certifications (teacher_id, cert_id) VALUES (:tid, :cid)");
                    $stmt->execute([':tid' => $teacherId, ':cid' => $certId]);
                }
            }

            // Handle subject expertise
            if (!empty($mapped['subjects_expertise'])) {
                $subjectsExpertise = $mapped['subjects_expertise'];
                if (is_array($subjectsExpertise)) {
                    $subjectsExpertise = implode(',', $subjectsExpertise);
                }
                $subjects = preg_split('/[;,]/', $subjectsExpertise);
                foreach ($subjects as $subjectName) {
                    $subjectName = trim($subjectName);
                    if ($subjectName === '') continue;
                    $subjectId = getSubjectAreaId($conn, $subjectName);
                    $stmt = $conn->prepare("INSERT INTO teacher_subject_expertise (teacher_id, subject_id) VALUES (:tid, :sid)");
                    $stmt->execute([':tid' => $teacherId, ':sid' => $subjectId]);
                }
            }

            // Handle workload
            if (!empty($mapped['teaching_hours_per_week'])) {
                $periodName = date('Y');
                $stmt = $conn->prepare("SELECT period_id FROM workload_periods WHERE period_name = :name");
                $stmt->execute([':name' => $periodName]);
                $periodId = $stmt->fetchColumn();
                if (!$periodId) {
                    $stmt = $conn->prepare("INSERT INTO workload_periods (period_name, start_date, end_date) VALUES (:name, :start, :end)");
                    $stmt->execute([
                        ':name' => $periodName,
                        ':start' => date('Y-01-01'),
                        ':end' => date('Y-12-31'),
                    ]);
                    $periodId = $conn->lastInsertId();
                }
                $stmt = $conn->prepare("INSERT INTO teacher_workload (teacher_id, period_id, teaching_hours, admin_hours, extracurricular_hours, max_allowed_hours) VALUES (:tid, :pid, :teach, :admin, :extra, :max)");
                $stmt->execute([
                    ':tid' => $teacherId,
                    ':pid' => $periodId,
                    ':teach' => is_numeric($mapped['teaching_hours_per_week']) ? $mapped['teaching_hours_per_week'] : 0,
                    ':admin' => is_numeric($mapped['administrative_duties']) ? $mapped['administrative_duties'] : 0,
                    ':extra' => is_numeric($mapped['extracurricular_duties']) ? $mapped['extracurricular_duties'] : 0,
                    ':max' => is_numeric($mapped['max_teaching_hours']) ? $mapped['max_teaching_hours'] : null,
                ]);
            }

            $successCount++;
        }

        $conn->commit();

        if (count($errors) > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Some rows failed to save.', 'details' => $errors, 'successCount' => $successCount]);
            debug_log("Some rows failed to save. Errors: " . json_encode($errors));
        } else {
            echo json_encode(['success' => true, 'message' => "All $successCount rows saved successfully."]);
            debug_log("All $successCount rows saved successfully.");
        }
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        debug_log("Database error: " . $e->getMessage());
    }
}
