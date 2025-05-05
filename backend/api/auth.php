<?php

header("Content-Type: application/json");
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
];

function sendCorsHeaders() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    error_log("auth.php Origin header: " . ($origin ?: 'none'));
    if (in_array($origin, $allowed_origins)) {
        error_log("auth.php sending CORS headers for origin: $origin");
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
    } else {
        error_log("auth.php origin not allowed: $origin");
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request
    sendCorsHeaders();
    header("Access-Control-Max-Age: 3600");
    http_response_code(204);
    exit();
}

sendCorsHeaders();

require_once __DIR__ . '/../config.php';


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    sendCorsHeaders();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    // Trim inputs to remove whitespace
    $username_trimmed = trim($username);
    $password_trimmed = trim($password);

    // Validate input
    if (empty($username_trimmed) || empty($password_trimmed)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit();
    }

    try {
        // Connect to database
        $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare and execute query
        $stmt = $conn->prepare("SELECT id, password_hash, role FROM users WHERE username = :username");
        $stmt->execute(['username' => $username_trimmed]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        error_log("auth.php login attempt: username='$username', password='$password', username_trimmed='$username_trimmed', password_trimmed='$password_trimmed', user_found=" . ($user ? 'true' : 'false'));

        if ($user) {
            $passwordMatch = password_verify($password_trimmed, $user['password_hash']);
            error_log("auth.php password match: " . ($passwordMatch ? 'true' : 'false'));

            // Fallback password verification using crypt if password_verify fails
            if (!$passwordMatch && function_exists('crypt')) {
                $passwordMatch = (crypt($password_trimmed, $user['password_hash']) === $user['password_hash']);
                error_log("auth.php fallback crypt password match: " . ($passwordMatch ? 'true' : 'false'));
            }
            
            if ($passwordMatch) {
                // Successful login
                $token = bin2hex(random_bytes(32));
                $role = $user['role'];
                
                // Store token in database with error handling
                $stmt = $conn->prepare("UPDATE users SET token = :token WHERE id = :id");
                $updateSuccess = $stmt->execute(['token' => $token, 'id' => $user['id']]);
                if (!$updateSuccess) {
                    error_log("auth.php failed to update token for user id: " . $user['id']);
                }

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token' => $token,
                    'role' => $role
                ]);
            } else {
                // Failed login
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid username or password',
                    'debug' => [
                        'username' => $username,
                        'password' => $password,
                        'username_trimmed' => $username_trimmed,
                        'password_trimmed' => $password_trimmed,
                        'user_found' => true,
                        'password_match' => false,
                        'stored_password_hash' => $user['password_hash']
                    ]
                ]);
            }
        } else {
            // User not found
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password',
                'debug' => [
                    'username' => $username,
                    'password' => $password,
                    'username_trimmed' => $username_trimmed,
                    'password_trimmed' => $password_trimmed,
                    'user_found' => false
                ]
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
