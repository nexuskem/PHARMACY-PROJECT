<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';

function getCart() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $sql = "SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image, p.category 
                FROM cart_items c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.patient_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$patientId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJSON($items);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching cart'], 500);
    }
}

function addToCart() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];
    $data = getBody();
    $productId = $data['productId'];
    $quantity = $data['quantity'] ?? 1;

    $db = new Database();
    $conn = $db->getConnection();

    try {
        // Check if exists
        $stmt = $conn->prepare("SELECT id, quantity FROM cart_items WHERE patient_id = ? AND product_id = ?");
        $stmt->execute([$patientId, $productId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $newQuantity = $existing['quantity'] + $quantity;
            $stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
            $stmt->execute([$newQuantity, $existing['id']]);
        } else {
            $stmt = $conn->prepare("INSERT INTO cart_items (patient_id, product_id, quantity) VALUES (?, ?, ?)");
            $stmt->execute([$patientId, $productId, $quantity]);
        }
        sendJSON(['success' => true, 'message' => 'Added to cart']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error adding to cart'], 500);
    }
}

function updateCartItem($id) {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $data = getBody();
    $quantity = $data['quantity'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
        $stmt->execute([$quantity, $id]);
        sendJSON(['success' => true, 'message' => 'Cart updated']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error updating cart'], 500);
    }
}

function removeFromCart($id) {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("DELETE FROM cart_items WHERE id = ?");
        $stmt->execute([$id]);
        sendJSON(['success' => true, 'message' => 'Item removed']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error removing item'], 500);
    }
}

function clearCart() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("DELETE FROM cart_items WHERE patient_id = ?");
        $stmt->execute([$patientId]);
        sendJSON(['success' => true, 'message' => 'Cart cleared']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error clearing cart'], 500);
    }
}
?>
