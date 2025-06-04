<?php
// hardcoded_workload_distribution.php
// This script returns hardcoded workload distribution data for testing frontend display with all requested teachers.

header('Content-Type: application/json');

$hardcoded_data = [
    ['name' => 'John ReyDo', 'strands' => ['GAS'], 'subjects' => [['subject' => 'Social Science 1 & 2', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'James Smith', 'strands' => ['GAS'], 'subjects' => [['subject' => 'Social Science 1 & 2', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Rollin', 'strands' => ['GAS'], 'subjects' => [['subject' => 'Social Science 1 & 2', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Alice Johnson', 'strands' => ['STEM', 'ABM', 'GAS'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4], ['subject' => 'Business Mathematics', 'hours_per_week' => 4], ['subject' => 'Social Science 1 & 2', 'hours_per_week' => 4]], 'total_hours' => 12],
    ['name' => 'Jane Doe', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Kevin White', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Laura Wilson', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Michael Scott', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Nina Patel', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Oscar Martinez', 'strands' => ['ICT'], 'subjects' => [['subject' => 'Programming (Java, Python, etc.)', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Pam Beesly', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Quincy Adams', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Rachel Green', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Steve Rogers', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Bob Smith', 'strands' => ['ABM', 'GAS', 'HUMSS'], 'subjects' => [['subject' => 'Business Management', 'hours_per_week' => 4], ['subject' => 'Social Science 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 12],
    ['name' => 'Tina Turner', 'strands' => ['HUMSS', 'ICT'], 'subjects' => [['subject' => 'Creative Writing', 'hours_per_week' => 4], ['subject' => 'Programming (Java, Python, etc.)', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Carol Williams', 'strands' => ['HUMSS', 'ICT'], 'subjects' => [['subject' => 'Creative Writing', 'hours_per_week' => 4], ['subject' => 'Programming (Java, Python, etc.)', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'David Lee', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Eva Green', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Frank Miller', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4],
    ['name' => 'Grace Hopper', 'strands' => ['GAS', 'HUMSS', 'ICT'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4], ['subject' => 'Programming (Java, Python, etc.)', 'hours_per_week' => 4]], 'total_hours' => 12],
    ['name' => 'Hannah Brown', 'strands' => ['GAS', 'HUMSS'], 'subjects' => [['subject' => 'Humanities 1 & 2', 'hours_per_week' => 4], ['subject' => 'Creative Writing', 'hours_per_week' => 4]], 'total_hours' => 8],
    ['name' => 'Ian Clark', 'strands' => ['STEM'], 'subjects' => [['subject' => 'General Mathematics', 'hours_per_week' => 4]], 'total_hours' => 4]
];

echo json_encode($hardcoded_data);
?>
