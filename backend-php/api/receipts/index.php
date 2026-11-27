<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper to extract user ID from query, header or payload
function getRequestUserId() {
    if (!empty($_GET['userId'])) {
        return $_GET['userId'];
    }
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $tokenData = json_decode(base64_decode($matches[1]), true);
        if (!empty($tokenData['user_id'])) {
            return $tokenData['user_id'];
        }
    }
    return null;
}

// 1. GET: Fetch receipts
if ($method === 'GET') {
    $userId = getRequestUserId();
    
    if ($userId) {
        $stmt = $pdo->prepare("SELECT * FROM receipts WHERE user_id = ? ORDER BY date DESC, created_at DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM receipts ORDER BY date DESC, created_at DESC LIMIT 100");
    }
    
    $receipts = $stmt->fetchAll();
    
    // Fetch items for each receipt
    foreach ($receipts as &$r) {
        $itemStmt = $pdo->prepare("SELECT name, quantity, price, category FROM receipt_items WHERE receipt_id = ?");
        $itemStmt->execute([$r['id']]);
        $r['items'] = $itemStmt->fetchAll();
        $r['totalAmount'] = floatval($r['total_amount']);
        $r['storeName'] = $r['store_name'];
        $r['paymentMethod'] = $r['payment_method'];
    }
    unset($r);

    sendJsonResponse(['success' => true, 'receipts' => $receipts]);
}

// 2. POST: Add or save a receipt
if ($method === 'POST') {
    $input = getJsonInput();
    
    $id = $input['id'] ?? ('rec_' . bin2hex(random_bytes(8)));
    $userId = $input['userId'] ?? getRequestUserId();
    $storeName = $input['storeName'] ?? $input['store_name'] ?? 'Store';
    $date = $input['date'] ?? date('Y-m-d');
    $totalAmount = floatval($input['totalAmount'] ?? $input['total_amount'] ?? 0);
    $category = $input['category'] ?? 'Other';
    $paymentMethod = $input['paymentMethod'] ?? $input['payment_method'] ?? 'Cash';
    $taxAmount = floatval($input['taxAmount'] ?? 0);
    $imageUrl = $input['imageUrl'] ?? null;
    $rawText = $input['rawText'] ?? null;
    $items = $input['items'] ?? [];

    if (empty($userId)) {
        // Fallback to demo user if not specified
        $userId = 'demo-user-1';
    }

    // Insert or update receipt
    $stmt = $pdo->prepare("
        INSERT INTO receipts (id, user_id, store_name, date, total_amount, category, payment_method, tax_amount, image_url, raw_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            store_name = VALUES(store_name),
            date = VALUES(date),
            total_amount = VALUES(total_amount),
            category = VALUES(category),
            payment_method = VALUES(payment_method)
    ");
    $stmt->execute([$id, $userId, $storeName, $date, $totalAmount, $category, $paymentMethod, $taxAmount, $imageUrl, $rawText]);

    // Insert items
    if (is_array($items) && count($items) > 0) {
        $deleteItemsStmt = $pdo->prepare("DELETE FROM receipt_items WHERE receipt_id = ?");
        $deleteItemsStmt->execute([$id]);

        $itemInsertStmt = $pdo->prepare("INSERT INTO receipt_items (receipt_id, name, quantity, price, category) VALUES (?, ?, ?, ?, ?)");
        foreach ($items as $item) {
            $itemName = $item['name'] ?? 'Item';
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['price'] ?? 0);
            $cat = $item['category'] ?? $category;
            $itemInsertStmt->execute([$id, $itemName, $qty, $price, $cat]);
        }
    }

    sendJsonResponse([
        'success' => true,
        'message' => 'Receipt saved successfully',
        'receipt' => [
            'id' => $id,
            'userId' => $userId,
            'storeName' => $storeName,
            'date' => $date,
            'totalAmount' => $totalAmount,
            'category' => $category,
            'items' => $items
        ]
    ], 201);
}

// 3. DELETE: Remove a receipt
if ($method === 'DELETE') {
    $receiptId = $_GET['id'] ?? null;
    if (!$receiptId) {
        $input = getJsonInput();
        $receiptId = $input['id'] ?? null;
    }

    if (!$receiptId) {
        sendJsonResponse(['error' => 'Receipt ID is required'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM receipts WHERE id = ?");
    $stmt->execute([$receiptId]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Receipt deleted successfully'
    ]);
}

sendJsonResponse(['error' => 'Method not allowed'], 405);
