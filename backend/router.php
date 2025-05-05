<?php
// router.php for PHP built-in server with realpath for path resolution

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$requested = $_SERVER['REQUEST_URI'];
$path = parse_url($requested, PHP_URL_PATH);
$baseDir = realpath(__DIR__);
$file = realpath($baseDir . DIRECTORY_SEPARATOR . ltrim($path, '/'));

error_log("Requested URI: $requested");
error_log("Resolved file path: $file");

if ($file && is_file($file)) {
    return false; // serve the requested file as-is
} else {
    if (preg_match('#^/api/(.+\.php)$#', $path, $matches)) {
        $apiFile = realpath($baseDir . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . $matches[1]);
        error_log("API file resolved to: $apiFile");
        if ($apiFile && is_file($apiFile)) {
            include $apiFile;
            exit();
        } else {
            error_log("API file not found: $apiFile");
        }
    }
    if ($path === '/auth.php') {
        $authFile = realpath($baseDir . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'auth.php');
        if ($authFile && is_file($authFile)) {
            include $authFile;
            exit();
        }
    }
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Not Found']);
}
