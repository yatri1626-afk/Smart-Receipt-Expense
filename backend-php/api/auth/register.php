<?php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');
$monthlyBudget = floatval($input['monthlyBudget'] ?? 10000);
$preferredCategories = $input['preferredCategories'] ?? ['Grocery', 'Food & Health'];

if (empty($name) || empty($email) || empty($password)) {
    sendJsonResponse(['error' => 'Name, email, and password are required'], 400);
}

// Check if user already exists
$checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$checkStmt->execute([$email]);
if ($checkStmt->fetch()) {
    sendJsonResponse(['error' => 'An account with this email already exists'], 409);
}

// Create new user
$userId = 'usr_' . bin2hex(random_bytes(8));
$categoriesJson = json_encode($preferredCategories);

$insertStmt = $pdo->prepare("INSERT INTO users (id, name, email, password, monthly_budget, preferred_categories) VALUES (?, ?, ?, ?, ?, ?)");
$insertStmt->execute([$userId, $name, $email, $password, $monthlyBudget, $categoriesJson]);

$newUser = [
    'id' => $userId,
    'name' => $name,
    'email' => $email,
    'monthly_budget' => $monthlyBudget,
    'preferred_categories' => $preferredCategories
];

$token = base64_encode(json_encode([
    'user_id' => $userId,
    'email'   => $email,
    'exp'     => time() + (86400 * 30)
]));

sendJsonResponse([
    'success' => true,
    'token'   => $token,
    'user'    => $newUser
], 201);
