<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';

function registerPatient() {
    $db = new Database();
    $conn = $db->getConnection();
    $data = getBody();

    if (empty($data['firstName']) || empty($data['lastName']) || empty($data['patientId']) || empty($data['password'])) {
        sendJSON(['success' => false, 'message' => 'Please fill in all required fields'], 400);
    }

    // Check if patient exists
    $stmt = $conn->prepare("SELECT id FROM patients WHERE patient_id = ?");
    $stmt->execute([$data['patientId']]);
    if ($stmt->rowCount() > 0) {
        sendJSON(['success' => false, 'message' => 'Patient ID already registered'], 400);
    }

    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

    // Auto-assign doctor logic
    $assignedDoctorId = null;
    try {
        $sql = "SELECT d.id, COUNT(p.id) as patient_count 
                FROM doctors d 
                LEFT JOIN patients p ON d.id = p.assigned_doctor_id 
                GROUP BY d.id 
                ORDER BY patient_count ASC, d.createdAt ASC 
                LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($doctor) {
            $assignedDoctorId = $doctor['id'];
        }
    } catch (PDOException $e) {
        // Continue without assignment
    }

    // Insert Patient
    $sql = "INSERT INTO patients (patient_id, password, firstName, lastName, phone, email, assigned_doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if ($stmt->execute([$data['patientId'], $hashedPassword, $data['firstName'], $data['lastName'], $data['phone'] ?? null, $data['email'] ?? null, $assignedDoctorId])) {
        $userId = $conn->lastInsertId();
        
        $tokenPayload = [
            'id' => $userId, 
            'patientId' => $data['patientId'], 
            'role' => 'patient',
            'exp' => time() + (7 * 24 * 60 * 60) // 7 days
        ];
        $token = JWT::encode($tokenPayload);

        sendJSON([
            'success' => true,
            'message' => 'Patient registration successful',
            'user' => ['id' => $userId, 'patientId' => $data['patientId'], 'firstName' => $data['firstName'], 'lastName' => $data['lastName'], 'role' => 'patient'],
            'token' => $token
        ], 201);
    } else {
        sendJSON(['success' => false, 'message' => 'Registration failed'], 500);
    }
}

function login() {
    $db = new Database();
    $conn = $db->getConnection();
    $data = getBody();

    if (empty($data['userId']) || empty($data['password']) || empty($data['role'])) {
        sendJSON(['success' => false, 'message' => 'ID, Password, and Role are required'], 400);
    }

    $role = $data['role'];
    $userId = $data['userId'];
    $password = $data['password'];

    $user = null;
    if ($role === 'patient') {
        $stmt = $conn->prepare("SELECT * FROM patients WHERE patient_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } elseif ($role === 'pharmacist' || $role === 'doctor') {
        $stmt = $conn->prepare("SELECT * FROM doctors WHERE pharmacist_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        sendJSON(['success' => false, 'message' => 'Invalid role'], 400);
    }

    if (!$user || !password_verify($password, $user['password'])) {
        sendJSON(['success' => false, 'message' => 'Invalid ID or password'], 401);
    }

    $tokenPayload = ['id' => $user['id'], 'role' => $user['role'], 'exp' => time() + (7 * 24 * 60 * 60)];
    if ($role === 'patient') $tokenPayload['patientId'] = $user['patient_id'];
    if ($role === 'pharmacist') $tokenPayload['pharmacistId'] = $user['pharmacist_id'];

    $token = JWT::encode($tokenPayload);

    $responseData = [
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'name' => $user['firstName'] . ' ' . $user['lastName'],
            'role' => $user['role']
        ],
        'token' => $token
    ];
    
    if ($role === 'patient') $responseData['user']['patientId'] = $user['patient_id'];
    else $responseData['user']['pharmacistId'] = $user['pharmacist_id'];

    sendJSON($responseData, 200);
}

function getMe() {
    $token = JWT::getBearerToken();
    if (!$token) {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $decoded = JWT::decode($token);
    if (!$decoded) {
        sendJSON(['success' => false, 'message' => 'Invalid Token'], 403);
    }

    $db = new Database();
    $conn = $db->getConnection();
    $userId = $decoded['id'];
    $role = $decoded['role'];

    try {
        $user = null;
        $assignedDoctor = null;

        if ($role === 'patient') {
            $stmt = $conn->prepare("
                SELECT p.*, d.firstName as docFirstName, d.lastName as docLastName 
                FROM patients p 
                LEFT JOIN doctors d ON p.assigned_doctor_id = d.id 
                WHERE p.id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Lazy assignment if check needed (skipping for brevity, rely on reg)
            if ($user && !empty($user['docFirstName'])) {
                $assignedDoctor = "Dr. " . $user['docFirstName'] . " " . $user['docLastName'];
            }
        } else {
            $stmt = $conn->prepare("SELECT * FROM doctors WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$user) {
            sendJSON(['success' => false, 'message' => 'User not found'], 404);
        }

        $responseUser = [
            'id' => $user['id'],
            'name' => $user['firstName'] . ' ' . $user['lastName'],
            'firstName' => $user['firstName'],
            'lastName' => $user['lastName'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'assignedDoctor' => $assignedDoctor
        ];

        if (isset($user['patient_id'])) $responseUser['patientId'] = $user['patient_id'];
        if (isset($user['pharmacist_id'])) $responseUser['pharmacistId'] = $user['pharmacist_id'];

        sendJSON(['success' => true, 'user' => $responseUser]);

    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching user'], 500);
    }
}
?>
