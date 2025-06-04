<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

function send_response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Only allow POST method for restart
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(['error' => 'Only POST method is allowed'], 405);
}

// Command to restart backend server gracefully
// Adjust this command based on your backend server start command and environment
// This example assumes you have a script to restart the backend safely

$restart_script = __DIR__ . '/../restart_backend_safe.sh';

if (file_exists($restart_script)) {
    exec("bash " . escapeshellarg($restart_script) . " > /dev/null 2>&1 &", $output, $return_var);
    if ($return_var === 0) {
        send_response(['message' => 'Backend server restart triggered successfully']);
    } else {
        send_response(['error' => 'Failed to trigger backend restart'], 500);
    }
} else {
    send_response(['error' => 'Restart script not found'], 500);
}
?>
