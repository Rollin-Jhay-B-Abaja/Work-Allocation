<?php
$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Generated hash: " . $hash . "\n";

$verify = password_verify($password, $hash);
echo "Password verify result: " . ($verify ? "true" : "false") . "\n";
?>
