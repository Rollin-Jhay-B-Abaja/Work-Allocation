<?php
// skill_based_matching.php
// API endpoint to perform skill-based matching by calling the Python module
// Ensure no whitespace or BOM before opening PHP tag

// Disable error display to avoid HTML error output breaking JSON response
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Log errors to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

// Add CORS headers to allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight CORS requests
    http_response_code(200);
    exit();
}

// Database connection parameters
$host = 'localhost';
$dbname = 'workforce';
$user = 'root';
$pass = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $resource = $_GET['resource'] ?? '';

        try {
            if ($resource === 'teachers') {
                $stmt = $pdo->query("SELECT teacher_id AS id, name FROM teachers");
                $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $stmt = $pdo->query("SELECT tse.teacher_id, tse.skill, tse.proficiency_level, tse.years_experience FROM teacher_subject_expertise tse");
                $skills = [];
                $proficiency_levels = [];
                $years_experience = [];
                foreach ($stmt as $row) {
                    $skills[$row['teacher_id']][] = $row['skill'];
                    if (!isset($proficiency_levels[$row['teacher_id']])) {
                        $proficiency_levels[$row['teacher_id']] = [];
                    }
                    $proficiency_levels[$row['teacher_id']][$row['skill']] = $row['proficiency_level'];
                    $years_experience[$row['teacher_id']] = $row['years_experience']; // Assuming one experience per teacher
                }

                // Fetch max_allowed_hours from teacher_workload table
                $stmt = $pdo->query("SELECT teacher_id, max_allowed_hours FROM teacher_workload");
                $workload_hours = [];
                foreach ($stmt as $row) {
                    $workload_hours[$row['teacher_id']] = $row['max_allowed_hours'];
                }

                foreach ($teachers as &$teacher) {
                    $id = $teacher['id'];
                    $teacher['skills'] = $skills[$id] ?? [];
                    $teacher['proficiency_levels'] = $proficiency_levels[$id] ?? [];
                    $teacher['years_experience'] = $years_experience[$id] ?? [];
                    $teacher['max_allowed_hours'] = $workload_hours[$id] ?? 40; // default to 40 if not found
                }
                unset($teacher);

                echo json_encode($teachers);
                exit;
            } elseif ($resource === 'classes') {
                // Fetch strands
                $stmt = $pdo->query("SELECT strand_id, strand_name FROM strands");
                $strands = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Fetch subjects grouped by strand
                $stmt = $pdo->query("SELECT strand_id, subject FROM subject_areas");
                $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Group subjects by strand_id
                $subjects_by_strand = [];
                foreach ($subjects as $subj) {
                    $subjects_by_strand[$subj['strand_id']][] = $subj['subject'];
                }

                // Build classes array with core_subjects and specialized_subjects per strand
                $classes = [];

                // Define core and specialized subjects per strand
                $strandParameters = [
                    "STEM" => [
                        "core_subjects" => [
                            "Oral Communication",
                            "Komunikasyon at Pananaliksap",
                            "General Mathematics",
                            "Earth and Life Science",
                            "PE and Health",
                            "Personal Development",
                            "Understanding Culture, Society, and Politics"
                        ],
                        "specialized_subjects" => [
                            "Pre-Calculus",
                            "Basic Calculus",
                            "General Biology 1",
                            "General Biology 2",
                            "General Chemistry 1",
                            "General Chemistry 2",
                            "General Physics 1",
                            "General Physics 2",
                            "Research/Capstone Project"
                        ]
                    ],
                    "ABM" => [
                        "core_subjects" => [
                            "Oral Communication",
                            "Komunikasyon at Pananaliksap",
                            "General Mathematics",
                            "Earth and Life Science",
                            "PE and Health",
                            "Personal Development",
                            "Understanding Culture, Society, and Politics"
                        ],
                        "specialized_subjects" => [
                            "Business Mathematics",
                            "Fundamentals of ABM 1",
                            "Fundamentals of ABM 2",
                            "Business Finance",
                            "Organization and Management",
                            "Principles of Marketing",
                            "Work Immersion/Research"
                        ]
                    ],
                    "GAS" => [
                        "core_subjects" => [
                            "Oral Communication",
                            "Komunikasyon at Pananaliksap",
                            "General Mathematics",
                            "Earth and Life Science",
                            "PE and Health",
                            "Personal Development",
                            "Understanding Culture, Society, and Politics"
                        ],
                        "specialized_subjects" => [
                            "Humanities 1",
                            "Humanities 2",
                            "Social Science 1",
                            "Social Science 2",
                            "Applied Economics",
                            "Research in Daily Life",
                            "Media and Information Literacy",
                            "Work Immersion"
                        ]
                    ],
                    "HUMMS" => [
                        "core_subjects" => [
                            "Oral Communication",
                            "Komunikasyon at Pananaliksap",
                            "General Mathematics",
                            "Earth and Life Science",
                            "PE and Health",
                            "Personal Development",
                            "Understanding Culture, Society, and Politics"
                        ],
                        "specialized_subjects" => [
                            "Creative Writing",
                            "Disciplines and Ideas in Social Sciences",
                            "Philippine Politics and Governance",
                            "Community Engagement",
                            "Trends in Social Sciences",
                            "Research in Social Sciences"
                        ]
                    ],
                    "ICT" => [
                        "core_subjects" => [
                            "Oral Communication",
                            "Komunikasyon at Pananaliksap",
                            "General Mathematics",
                            "Earth and Life Science",
                            "PE and Health",
                            "Personal Development",
                            "Understanding Culture, Society, and Politics"
                        ],
                        "specialized_subjects" => [
                            "Computer Systems Servicing (NC II)",
                            "Programming (Java, Python, etc.)",
                            "Web Development",
                            "Animation",
                            "Work Immersion (ICT Industry)"
                        ]
                    ]
                ];

                foreach ($strands as $strand) {
                    $strandName = $strand['strand_name'];
                    $core_subjects = $strandParameters[$strandName]['core_subjects'] ?? [];
                    $specialized_subjects = $strandParameters[$strandName]['specialized_subjects'] ?? [];
                    $classes[] = [
                        'id' => $strand['strand_id'],
                        'name' => $strandName,
                        'core_subjects' => $core_subjects,
                        'specialized_subjects' => $specialized_subjects,
                        'hours_per_week' => 10, // default or configurable
                        'subject' => $strandName,
                        'grade' => 'Senior High'
                    ];
                }

                echo json_encode($classes);
                exit;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid resource']);
                exit;
            }
        } catch (PDOException $e) {
            error_log("Database query error in GET $resource: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database query error: ' . $e->getMessage()]);
            exit;
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Parse JSON POST body
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        if ($input === null) {
            error_log("Invalid JSON input in POST request");
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        $teachers = $input['teachers'] ?? [];
        $classes = $input['classes'] ?? [];
        $constraints = $input['constraints'] ?? ['max_hours_per_week' => 40, 'min_rest_hours' => 8];
        $preferences = $input['preferences'] ?? [];
        $prediction_data = $input['prediction_data'] ?? null;

        $tempDir = __DIR__ . '/temp';
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $teachersFile = $tempDir . '/teachers_input.json';
        $classesFile = $tempDir . '/classes_input.json';
        $constraintsFile = $tempDir . '/constraints_input.json';
        $preferencesFile = $tempDir . '/preferences_input.json';
        $predictionDataFile = $tempDir . '/prediction_data_input.json';

        if (file_put_contents($teachersFile, json_encode($teachers)) === false ||
            file_put_contents($classesFile, json_encode($classes)) === false ||
            file_put_contents($constraintsFile, json_encode($constraints)) === false ||
            file_put_contents($preferencesFile, json_encode($preferences)) === false ||
            file_put_contents($predictionDataFile, json_encode($prediction_data)) === false) {
            error_log("Failed to write input JSON files for skill based matching");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to write input files']);
            exit;
        }

        // Correct path to python script
        $pythonScript = realpath(__DIR__ . '/../ml_models/skill_based_matching.py');
        if ($pythonScript === false) {
            error_log("Python script skill_based_matching.py not found");
            http_response_code(500);
            echo json_encode(['error' => 'Python script not found']);
            exit;
        }
        // Fix path for Windows backslashes
        $pythonScript = str_replace('\\', '/', $pythonScript);
        $command = escapeshellcmd("python \"$pythonScript\" 2>&1");
        exec($command, $output, $return_var);

        $fullOutput = implode("\n", $output);

        // Log full output to debug file
        file_put_contents(__DIR__ . '/temp/skill_based_matching_debug.log', $fullOutput);

        if ($return_var !== 0) {
            error_log("Skill based matching script failed with return code $return_var. Output: " . $fullOutput);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute skill based matching', 'details' => $output]);
            exit;
        }

        // Validate JSON
        $jsonData = json_decode($fullOutput, true);
        if ($jsonData === null) {
            error_log("Invalid JSON output from skill based matching script: " . $fullOutput);
            http_response_code(500);
            echo json_encode(['error' => 'Invalid JSON output from skill based matching script']);
            exit;
        }

        // Return JSON with 'result' field as string for frontend compatibility
        echo json_encode(['result' => $fullOutput]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}
?>
