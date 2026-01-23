<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';

function getAllOrders() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("SELECT * FROM orders WHERE patient_id = ? ORDER BY createdAt DESC");
        $stmt->execute([$patientId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJSON($orders); // Match Node's response format (array directly)
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching orders'], 500);
    }
}

function createOrder() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];
    $data = getBody();
    
    // Calculate from cart
    $db = new Database();
    $conn = $db->getConnection();

    try {
        // Get cart
        $cartSql = "SELECT c.product_id, c.quantity, p.price FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.patient_id = ?";
        $cartStmt = $conn->prepare($cartSql);
        $cartStmt->execute([$patientId]);
        $cartItems = $cartStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($cartItems)) {
            sendJSON(['success' => false, 'message' => 'Cart is empty'], 400);
        }

        $total = 0;
        foreach ($cartItems as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        $orderNumber = 'ORD-' . time() . '-' . rand(1000, 9999);

        // Create Order
        $sql = "INSERT INTO orders (patient_id, order_number, total, status, payment_status) VALUES (?, ?, ?, 'pending', 'pending')";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$patientId, $orderNumber, $total]);
        $orderId = $conn->lastInsertId();

        // Create Order Items
        $itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
        $itemStmt = $conn->prepare($itemSql);
        
        foreach ($cartItems as $item) {
            $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
        }

        // Clear Cart
        $clearStmt = $conn->prepare("DELETE FROM cart_items WHERE patient_id = ?");
        $clearStmt->execute([$patientId]);

        sendJSON([
            'success' => true,
            'message' => 'Order created successfully',
            'orderId' => $orderId,
            'orderNumber' => $orderNumber
        ], 201);

    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error creating order'], 500);
    }
}

function getOneOrder($id) {
    // Might need this if frontend calls it. Node had OrderHandlers.getOne
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ? AND patient_id = ?");
        $stmt->execute([$id, $patientId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($order) {
            // Get items
            $itemStmt = $conn->prepare("SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $itemStmt->execute([$id]);
            $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            sendJSON($order);
        } else {
            sendJSON(['success' => false, 'message' => 'Order not found'], 404);
        }
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching order'], 500);
    }
}
?>
