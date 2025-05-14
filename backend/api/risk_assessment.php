<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function send_response($data, $code = 200) {
    http_response_code($code);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $error = json_last_error_msg();
        error_log("JSON encode error: " . $error);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to encode response JSON: ' . $error]);
        exit();
    }
    echo $json;
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pythonPath = 'python'; // Adjust if needed
    $weightedRiskScriptPath = __DIR__ . '/../ml_models/risk_assessment_weighted_step_by_step.py';

    $descriptorspec = [
        0 => ["pipe", "r"],  // stdin
        1 => ["pipe", "w"],  // stdout
        2 => ["pipe", "w"]   // stderr
    ];

    $command = "$pythonPath \"$weightedRiskScriptPath\"";
    error_log("Executing weighted risk assessment script command: " . $command);
    $process = proc_open($command, $descriptorspec, $pipes);

    if (is_resource($process)) {
        fclose($pipes[0]); // No input to python script
        $output = stream_get_contents($pipes[1]);
        error_log("Raw Python script output: " . $output);
        fclose($pipes[1]);
        $errorOutput = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $return_value = proc_close($process);

        error_log("Weighted risk assessment script return code: " . $return_value);
        error_log("Weighted risk assessment script stderr: " . $errorOutput);

        if ($return_value !== 0) {
            send_response(['error' => 'Failed to run weighted risk assessment script', 'details' => $errorOutput], 500);
        }

        $result = json_decode($output, true);
        if ($result === null) {
            $errorMsg = "Failed to decode weighted risk results JSON. Output: $output";
            error_log($errorMsg);
            send_response(['error' => $errorMsg], 500);
        }

        send_response($result);
    } else {
        $errorMsg = "Failed to start weighted risk assessment script process.";
        error_log($errorMsg);
        send_response(['error' => $errorMsg], 500);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}
?>
