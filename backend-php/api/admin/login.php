<?php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($email) || empty($password)) {
    sendJsonResponse(['error' => 'Admin email and password required'], 400);
}

$stmt = $pdo->prepare("SELECT id, name, email, password, role FROM admins WHERE email = ?");
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin) {
    sendJsonResponse(['error' => 'Invalid administrator credentials'], 401);
}

$isValid = ($password === $admin['password']) || password_verify($password, $admin['password']);

if (!$isValid) {
    sendJsonResponse(['error' => 'Invalid administrator credentials'], 401);
}

unset($admin['password']);

$adminToken = 'adm_' . base64_encode(json_encode([
    'admin_id' => $admin['id'],
    'email'    => $admin['email'],
    'role'     => $admin['role'],
    'exp'      => time() + 86400
]));

sendJsonResponse([
    'success' => true,
    'token'   => $adminToken,
    'admin'   => $admin
]);
