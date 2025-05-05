<?php
$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Password hash for 'admin123': " . $hash . PHP_EOL;
?>
