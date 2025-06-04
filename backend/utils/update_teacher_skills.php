<?php
// Script to update teacher_subject_expertise.skill column based on teacher strands and strand skill lists

$host = 'localhost';
$dbname = 'workforce';
$user = 'root';
$pass = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Strand skill lists
    $strand_skill_map = [
        'STEM' => [
            'General Physics 1', 'General Physics 2', 'General Chemistry 1', 'General Chemistry 2',
            'General Biology 1', 'General Biology 2', 'General Mathematics', 'Earth and Life Science',
            'Basic Calculus', 'Pre-Calculus', 'Oral Communication', 'Komunikasyon at Pananaliksap',
            'PE and Health', 'Personal Development', 'Understanding Culture Society and Politics',
            'Research/Capstone Project'
        ],
        'ABM' => [
            'Business Mathematics', 'Fundamentals of ABM 1', 'Fundamentals of ABM 2', 'Business Finance',
            'Organization and Management', 'Principles of Marketing', 'Work Immersion/Research'
        ],
        'GAS' => [
            'Humanities 1', 'Humanities 2', 'Social Science 1', 'Social Science 2', 'Applied Economics',
            'Research in Daily Life', 'Media and Information Literacy', 'Work Immersion'
        ],
        'HUMMS' => [
            'Creative Writing', 'Disciplines and Ideas in Social Sciences', 'Philippine Politics and Governance',
            'Community Engagement', 'Trends in Social Sciences', 'Research in Social Sciences'
        ],
        'ICT' => [
            'Computer Systems Servicing (NC II)', 'Programming (Java, Python, etc.)', 'Web Development',
            'Animation', 'Work Immersion (ICT Industry)'
        ]
    ];

    // Get teacher strands
    $stmt = $pdo->query("SELECT teacher_id, strand_id FROM teacher_strand_assignments");
    $teacher_strands = [];
    foreach ($stmt as $row) {
        $teacher_strands[$row['teacher_id']] = $row['strand_id'];
    }

    // Get strand names
    $stmt = $pdo->query("SELECT strand_id, strand_name FROM strands");
    $strand_names = [];
    foreach ($stmt as $row) {
        $strand_names[$row['strand_id']] = $row['strand_name'];
    }

    // For each teacher, update skill column for existing expertise rows
    foreach ($teacher_strands as $teacher_id => $strand_id) {
        // Check if teacher exists in teachers table
        $check_stmt = $pdo->prepare("SELECT COUNT(*) FROM teachers WHERE teacher_id = ?");
        $check_stmt->execute([$teacher_id]);
        $exists = $check_stmt->fetchColumn();
        if (!$exists) {
            echo "Skipping teacher_id $teacher_id as it does not exist in teachers table.\n";
            continue;
        }

        $strand_name = $strand_names[$strand_id] ?? null;
        if (!$strand_name) continue;

        $skills = $strand_skill_map[$strand_name] ?? [];
        if (empty($skills)) continue;

        // Get teacher's expertise rows
        $stmt = $pdo->prepare("SELECT tse.expertise_id, sa.subject FROM teacher_subject_expertise tse JOIN subject_areas sa ON tse.subject_id = sa.subject_id WHERE tse.teacher_id = ?");
        $stmt->execute([$teacher_id]);
        $expertise_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Update skill for up to 2 expertise rows with matching skills
        $updated_skills = [];
        foreach ($expertise_rows as $row) {
            foreach ($skills as $skill) {
                if (strcasecmp(trim($row['subject']), trim($skill)) === 0 && !in_array($skill, $updated_skills)) {
                    $update_stmt = $pdo->prepare("UPDATE teacher_subject_expertise SET skill = ? WHERE expertise_id = ?");
                    $success = $update_stmt->execute([$skill, $row['expertise_id']]);
                    if ($success) {
                        echo "Updated skill '{$skill}' for expertise_id {$row['expertise_id']} (teacher_id $teacher_id)\n";
                        $updated_skills[] = $skill;
                    } else {
                        echo "Failed to update skill '{$skill}' for expertise_id {$row['expertise_id']} (teacher_id $teacher_id)\n";
                    }
                    break;
                }
            }
            if (count($updated_skills) >= 2) break;
        }

        // If fewer than 2 skills updated, insert missing skills
        $missing_skills = array_diff($skills, $updated_skills);
        $insert_stmt = $pdo->prepare("INSERT INTO teacher_subject_expertise (teacher_id, subject_id, skill) SELECT ?, subject_id, ? FROM subject_areas WHERE subject = ? LIMIT 1");
        foreach ($missing_skills as $skill) {
            if (count($updated_skills) >= 2) break;
            $success = $insert_stmt->execute([$teacher_id, $skill, $skill]);
            if ($success) {
                echo "Inserted skill '{$skill}' for teacher_id $teacher_id\n";
                $updated_skills[] = $skill;
            } else {
                echo "Failed to insert skill '{$skill}' for teacher_id $teacher_id\n";
            }
        }
    }

    echo "Teacher skills updated successfully.\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
