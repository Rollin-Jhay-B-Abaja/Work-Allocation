<?php
// Script to populate workload_distribution table based on teachers, strands, expertise, and strand parameters

header('Content-Type: application/json');

try {
    // Database connection (update credentials as needed)
    $dsn = "mysql:host=localhost;dbname=workforce;charset=utf8mb4";
    $username = "root";
    $password = "Omamam@010101";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);

    // Clear existing workload_distribution data
    $pdo->exec("TRUNCATE TABLE workload_distribution");

    // Fetch teachers with assigned strands
    $teachersQuery = "
        SELECT t.teacher_id, t.name AS teacher_name, tsa.strand_id, s.strand_name
        FROM teachers t
        JOIN teacher_strand_assignments tsa ON t.teacher_id = tsa.teacher_id
        JOIN strands s ON tsa.strand_id = s.strand_id
    ";
    $teachers = $pdo->query($teachersQuery)->fetchAll();

    // Fetch teacher subject expertise joined with subject_areas to get subject names
    $expertiseQuery = "
        SELECT tse.teacher_id, sa.subject
        FROM teacher_subject_expertise tse
        JOIN subject_areas sa ON tse.subject_id = sa.subject_id
    ";
    $expertiseRows = $pdo->query($expertiseQuery)->fetchAll();

    // Map teacher_id to expertise subjects
    $teacherExpertiseMap = [];
    foreach ($expertiseRows as $row) {
        $tid = $row['teacher_id'];
        if (!isset($teacherExpertiseMap[$tid])) {
            $teacherExpertiseMap[$tid] = [];
        }
        $teacherExpertiseMap[$tid][] = $row['subject'];
    }

    // Define strand parameters (should match STRAND_PARAMETERS in Python)
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
        "HUMSS" => [
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

    $hoursPerSubject = 4;

    // Prepare insert statement
    $insertStmt = $pdo->prepare("
        INSERT INTO workload_distribution (teacher_id, teacher_name, strand_id, strand_name, subjects, total_hours_per_day)
        VALUES (:teacher_id, :teacher_name, :strand_id, :strand_name, :subjects, :total_hours_per_day)
    ");

    foreach ($teachers as $teacher) {
        $tid = $teacher['teacher_id'];
        $strandId = $teacher['strand_id'];
        $strandName = $teacher['strand_name'];
        $teacherName = $teacher['teacher_name'];

        $expertiseSubjects = $teacherExpertiseMap[$tid] ?? [];

        $strandParam = $strandParameters[$strandName] ?? null;
        if (!$strandParam) {
            continue;
        }

        $assignedSubjects = [];

        // Assign specialized subjects teacher has expertise in
        foreach ($strandParam['specialized_subjects'] as $subj) {
            if (in_array($subj, $expertiseSubjects)) {
                $assignedSubjects[] = $subj;
            }
        }

        // Assign core subjects teacher has expertise in
        foreach ($strandParam['core_subjects'] as $subj) {
            if (in_array($subj, $expertiseSubjects)) {
                $assignedSubjects[] = $subj;
            }
        }

        // Calculate total hours per day
        $totalHoursPerWeek = count($assignedSubjects) * $hoursPerSubject;
        $totalHoursPerDay = $totalHoursPerWeek / 5.0; // Assuming 5 working days

        // Insert into workload_distribution table
        $insertStmt->execute([
            ':teacher_id' => $tid,
            ':teacher_name' => $teacherName,
            ':strand_id' => $strandId,
            ':strand_name' => $strandName,
            ':subjects' => json_encode($assignedSubjects),
            ':total_hours_per_day' => $totalHoursPerDay
        ]);
    }

    echo json_encode(['status' => 'success', 'message' => 'Workload distribution table populated successfully.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
