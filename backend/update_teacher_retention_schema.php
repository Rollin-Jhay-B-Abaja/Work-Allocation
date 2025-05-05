<?php
$host = 'localhost';
$dbname = 'workforce';
$username = 'root';
$password = 'Omamam@010101';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if columns exist before adding
    $columns = [];
    $stmt = $pdo->query("SHOW COLUMNS FROM teacher_retention_data");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }

    if (!in_array('salary_ratio', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN salary_ratio DECIMAL(5,2) DEFAULT 0");
        echo "Added column salary_ratio.\n";
    } else {
        echo "Column salary_ratio already exists.\n";
    }

    if (!in_array('professional_dev_hours', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN professional_dev_hours DECIMAL(5,2) DEFAULT 0");
        echo "Added column professional_dev_hours.\n";
    } else {
        echo "Column professional_dev_hours already exists.\n";
    }

    if (!in_array('students_STEM', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN students_STEM INT DEFAULT 0");
        echo "Added column students_STEM.\n";
    } else {
        echo "Column students_STEM already exists.\n";
    }

    if (!in_array('students_ABM', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN students_ABM INT DEFAULT 0");
        echo "Added column students_ABM.\n";
    } else {
        echo "Column students_ABM already exists.\n";
    }

    if (!in_array('students_GAS', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN students_GAS INT DEFAULT 0");
        echo "Added column students_GAS.\n";
    } else {
        echo "Column students_GAS already exists.\n";
    }

    if (!in_array('students_HUMSS', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN students_HUMSS INT DEFAULT 0");
        echo "Added column students_HUMSS.\n";
    } else {
        echo "Column students_HUMSS already exists.\n";
    }

    if (!in_array('students_ICT', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN students_ICT INT DEFAULT 0");
        echo "Added column students_ICT.\n";
    } else {
        echo "Column students_ICT already exists.\n";
    }

    if (!in_array('historical_resignations', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN historical_resignations INT DEFAULT 0");
        echo "Added column historical_resignations.\n";
    } else {
        echo "Column historical_resignations already exists.\n";
    }

    if (!in_array('historical_retentions', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN historical_retentions INT DEFAULT 0");
        echo "Added column historical_retentions.\n";
    } else {
        echo "Column historical_retentions already exists.\n";
    }

    if (!in_array('workload_per_teacher', $columns)) {
        $pdo->exec("ALTER TABLE teacher_retention_data ADD COLUMN workload_per_teacher DECIMAL(5,2) DEFAULT 0");
        echo "Added column workload_per_teacher.\n";
    } else {
        echo "Column workload_per_teacher already exists.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
