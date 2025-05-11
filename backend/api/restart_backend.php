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

// Command to restart backend server
// Adjust this command based on your backend server start command and environment
// Example: stop existing backend process and start it again
// WARNING: This is a simple example and may need to be adapted for your environment

$stop_command = 'taskkill /F /IM python.exe'; // Kill all python processes forcibly (adjust if needed)
$start_command = 'start /B python -m flask run'; // Start backend server in background (adjust if needed)

exec($stop_command, $output_stop, $return_stop);
exec($start_command, $output_start, $return_start);

if ($return_stop === 0 && $return_start === 0) {
    send_response(['message' => 'Backend server restarted successfully']);
} else {
    send_response(['error' => 'Failed to restart backend server', 'stop_return' => $return_stop, 'start_return' => $return_start], 500);
}
?>
