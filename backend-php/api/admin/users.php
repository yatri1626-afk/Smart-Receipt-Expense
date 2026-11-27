<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET: list all users
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT u.id, u.name, u.email, u.monthly_budget, u.created_at,
               COUNT(r.id) as receipt_count,
               COALESCE(SUM(r.total_amount), 0) as total_spent
        FROM users u
        LEFT JOIN receipts r ON u.id = r.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll();

    sendJsonResponse([
        'success' => true,
        'users' => $users
    ]);
}

// DELETE: Delete a user
if ($method === 'DELETE') {
    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        $input = getJsonInput();
        $userId = $input['id'] ?? null;
    }

    if (!$userId) {
        sendJsonResponse(['error' => 'User ID is required'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    sendJsonResponse([
        'success' => true,
        'message' => 'User deleted successfully'
    ]);
}

sendJsonResponse(['error' => 'Method not allowed'], 405);
