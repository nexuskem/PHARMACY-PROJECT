<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';

function getAllProducts() {
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT * FROM products ORDER BY createdAt DESC");
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJSON($products);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching products'], 500);
    }
}

function getOneProduct($id) {
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($product) {
            sendJSON($product);
        } else {
            sendJSON(['success' => false, 'message' => 'Product not found'], 404);
        }
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching product'], 500);
    }
}

function getCategories() {
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT DISTINCT category FROM products");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $categories = array_map(function($row) { return $row['category']; }, $rows);
        sendJSON($categories);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching categories'], 500);
    }
}

function createProduct() {
    // Only pharmacist/admin
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] === 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    $db = new Database();
    $conn = $db->getConnection();
    $data = getBody();

    try {
        $sql = "INSERT INTO products (name, description, price, category, icon, requiresApproval, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['name'], 
            $data['description'], 
            $data['price'], 
            $data['category'], 
            $data['icon'] ?? '💊', 
            $data['requiresApproval'] ? 1 : 0, 
            $data['stock'],
            $data['image'] ?? null
        ]);
        sendJSON(['success' => true, 'message' => 'Product created', 'id' => $conn->lastInsertId()], 201);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error creating product'], 500);
    }
}

function updateProduct($id) {
    // Only pharmacist/admin
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] === 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    $db = new Database();
    $conn = $db->getConnection();
    $data = getBody();

    try {
        $sql = "UPDATE products SET name=?, description=?, price=?, category=?, icon=?, requiresApproval=?, stock=?, image=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['name'], 
            $data['description'], 
            $data['price'], 
            $data['category'], 
            $data['icon'], 
            $data['requiresApproval'] ? 1 : 0, 
            $data['stock'],
            $data['image'],
            $id
        ]);
        sendJSON(['success' => true, 'message' => 'Product updated']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error updating product'], 500);
    }
}

function deleteProduct($id) {
    // Only pharmacist/admin
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] === 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    $db = new Database();
    $conn = $db->getConnection();

    try {
        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        sendJSON(['success' => true, 'message' => 'Product deleted']);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error deleting product'], 500);
    }
}
?>
