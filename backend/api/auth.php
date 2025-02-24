<?php

header("Content-Type: application/json");
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
];


$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}


header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");


require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request
    http_response_code(204);
    header("Access-Control-Max-Age: 3600");
    exit();
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    // Validate input
    if (empty($username) || empty($password)) {
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
        $stmt = $conn->prepare("SELECT id, password, role FROM users WHERE username = :username");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $passwordMatch = password_verify($password, $user['password']);
            
            if ($passwordMatch) {
                // Successful login
                $token = bin2hex(random_bytes(32));
                $role = $user['role'];
                
                // Store token in database
                $stmt = $conn->prepare("UPDATE users SET token = :token WHERE id = :id");
                $stmt->execute(['token' => $token, 'id' => $user['id']]);

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
                        'user_found' => true,
                        'password_match' => false
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
