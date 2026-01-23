<?php
// backend/router.php

// Handle CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

// Helper to send JSON response
function sendJSON($data, $code = 200) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Helper to get request body
function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$requestUri = explode('?', $requestUri)[0];

// Routing Logic
// Auth
if ($requestUri === '/api/auth/register/patient' && $method === 'POST') {
    require_once 'api/auth.php';
    registerPatient();
} elseif ($requestUri === '/api/auth/login' && $method === 'POST') {
    require_once 'api/auth.php';
    login();
} elseif ($requestUri === '/api/auth/me' && $method === 'GET') {
    require_once 'api/auth.php';
    getMe();
} 

// Products
elseif (strpos($requestUri, '/api/products') === 0) {
    require_once 'api/products.php';
    if ($requestUri === '/api/products' && $method === 'GET') {
        getAllProducts();
    } elseif ($requestUri === '/api/products/categories/list' && $method === 'GET') {
        getCategories();
    } elseif (preg_match('#^/api/products/(\d+)$#', $requestUri, $matches) && $method === 'GET') {
        getOneProduct($matches[1]);
    } elseif ($requestUri === '/api/products' && $method === 'POST') {
        createProduct();
    } elseif (preg_match('#^/api/products/(\d+)$#', $requestUri, $matches) && $method === 'PUT') {
        updateProduct($matches[1]);
    } elseif (preg_match('#^/api/products/(\d+)$#', $requestUri, $matches) && $method === 'DELETE') {
        deleteProduct($matches[1]);
    }
}

// Cart
elseif (strpos($requestUri, '/api/cart') === 0) {
    require_once 'api/cart.php';
    if ($requestUri === '/api/cart' && $method === 'GET') {
        getCart();
    } elseif ($requestUri === '/api/cart/add' && $method === 'POST') {
        addToCart();
    } elseif (preg_match('#^/api/cart/update/(\d+)$#', $requestUri, $matches) && $method === 'PUT') {
        updateCartItem($matches[1]);
    } elseif (preg_match('#^/api/cart/remove/(\d+)$#', $requestUri, $matches) && $method === 'DELETE') {
        removeFromCart($matches[1]);
    } elseif ($requestUri === '/api/cart/clear' && $method === 'DELETE') {
        clearCart();
    }
}

// Orders
elseif (strpos($requestUri, '/api/orders') === 0) {
    require_once 'api/orders.php';
    if ($requestUri === '/api/orders' && $method === 'GET') {
        getAllOrders();
    } elseif ($requestUri === '/api/orders/create' && $method === 'POST') {
        createOrder();
    }
}

// Appointments
elseif (strpos($requestUri, '/api/appointments') === 0) {
    require_once 'api/appointments.php';
    if ($requestUri === '/api/appointments' && $method === 'GET') {
        getAllAppointments();
    } elseif ($requestUri === '/api/appointments/book' && $method === 'POST') {
        bookAppointment();
    }
}

// Health Check
elseif ($requestUri === '/api/health') {
    sendJSON(['status' => 'ok', 'message' => 'MediCare Pharmacy API is running (PHP)']);
}

else {
    sendJSON(['message' => 'Not Found'], 404);
}
?>
