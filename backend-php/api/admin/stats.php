<?php
require_once __DIR__ . '/../../config/db.php';

// Fetch system stats
$totalUsers = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalReceipts = (int) $pdo->query("SELECT COUNT(*) FROM receipts")->fetchColumn();
$totalSpending = (float) $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM receipts")->fetchColumn();
$avgSpending = $totalReceipts > 0 ? round($totalSpending / $totalReceipts, 2) : 0;

// Spending by Category
$catStmt = $pdo->query("SELECT category, COALESCE(SUM(total_amount), 0) as total FROM receipts GROUP BY category");
$spendingByCategory = [];
while ($row = $catStmt->fetch()) {
    $spendingByCategory[$row['category']] = (float) $row['total'];
}

// Top Shops
$shopsStmt = $pdo->query("SELECT store_name, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM receipts GROUP BY store_name ORDER BY total DESC LIMIT 5");
$topShops = $shopsStmt->fetchAll();

sendJsonResponse([
    'success' => true,
    'totalUsers' => $totalUsers,
    'totalReceipts' => $totalReceipts,
    'totalSpending' => $totalSpending,
    'avgSpending' => $avgSpending,
    'spendingByCategory' => $spendingByCategory,
    'topShops' => $topShops
]);
