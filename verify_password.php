<?php
require_once __DIR__ . '/backend/config.php';

try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("SELECT password, LENGTH(password) AS hash_length FROM users WHERE username = 'admin'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        $hash = $result['password'];
        $length = $result['hash_length'];
        echo "Stored hash: $hash\n";
        echo "Hash length: $length characters\n";
        echo "Verification result: " . (password_verify('12345', $hash) ? 'Match' : 'No match') . "\n";
    } else {
        echo "Admin user not found\n";
    }
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
