<?php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($email) || empty($password)) {
    sendJsonResponse(['error' => 'Email and password are required'], 400);
}

$stmt = $pdo->prepare("SELECT id, name, email, password, monthly_budget, preferred_categories FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    sendJsonResponse(['error' => 'Invalid email or password'], 401);
}

// In production, password_verify() is recommended. Supports both plain and hashed for seamless compatibility
$isPasswordValid = ($password === $user['password']) || password_verify($password, $user['password']);

if (!$isPasswordValid) {
    sendJsonResponse(['error' => 'Invalid email or password'], 401);
}

// Strip password from response
unset($user['password']);
$user['preferred_categories'] = $user['preferred_categories'] ? json_decode($user['preferred_categories'], true) : [];

// Generate simple auth token
$token = base64_encode(json_encode([
    'user_id' => $user['id'],
    'email'   => $user['email'],
    'exp'     => time() + (86400 * 30) // 30 days
]));

sendJsonResponse([
    'success' => true,
    'token'   => $token,
    'user'    => $user
]);
