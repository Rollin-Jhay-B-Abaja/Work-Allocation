<?php
// Script to generate dummy teacher evaluations for all teachers for multiple evaluation periods

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch all teachers
    $teachersStmt = $pdo->query("SELECT teacher_id FROM workforce.teachers");
    $teachers = $teachersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all evaluation periods
    $evalPeriodsStmt = $pdo->query("SELECT eval_period_id FROM workforce.evaluation_periods");
    $evalPeriods = $evalPeriodsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare insert statement for teacher_evaluations
    $insertStmt = $pdo->prepare("INSERT INTO workforce.teacher_evaluations (teacher_id, eval_period_id, evaluator_id, overall_score, classroom_observation_score, student_feedback_score, peer_review_score) VALUES (:teacher_id, :eval_period_id, :evaluator_id, :overall_score, :classroom_observation_score, :student_feedback_score, :peer_review_score)");

    $evaluator_id = 1;   // Assuming a valid evaluator_id exists

    foreach ($evalPeriods as $period) {
        $eval_period_id = $period['eval_period_id'];

        foreach ($teachers as $teacher) {
            $teacher_id = $teacher['teacher_id'];

            // Generate random dummy scores between 60 and 100
            $overall_score = rand(60, 100);
            $classroom_observation_score = rand(60, 100);
            $student_feedback_score = rand(60, 100);
            $peer_review_score = rand(60, 100);

            $insertStmt->execute([
                ':teacher_id' => $teacher_id,
                ':eval_period_id' => $eval_period_id,
                ':evaluator_id' => $evaluator_id,
                ':overall_score' => $overall_score,
                ':classroom_observation_score' => $classroom_observation_score,
                ':student_feedback_score' => $student_feedback_score,
                ':peer_review_score' => $peer_review_score
            ]);
        }
    }

    echo "Dummy teacher evaluations generated successfully for all teachers and evaluation periods.\n";

} catch (PDOException $e) {
    echo "Error generating dummy evaluations: " . $e->getMessage() . "\n";
    exit(1);
}
?>
