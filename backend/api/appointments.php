<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';

function bookAppointment() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded || $decoded['role'] !== 'patient') {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $patientId = $decoded['id'];
    $data = getBody();
    
    $date = $data['date'];
    $time = $data['time'];
    $reason = $data['reason'] ?? 'Emergency Consultation';
    $isEmergency = $data['isEmergency'] ?? false;

    if (!$date || !$time) {
        sendJSON(['success' => false, 'message' => 'Date and time are required'], 400);
    }

    if (!$isEmergency) {
        sendJSON(['success' => false, 'message' => 'Only emergency appointments can be booked at this time.'], 400);
    }

    if (strtotime("$date $time") < time()) {
        sendJSON(['success' => false, 'message' => 'Cannot book appointment in the past'], 400);
    }

    $db = new Database();
    $conn = $db->getConnection();

    try {
        // Find available doctor
        // Get all doctors
        $stmt = $conn->prepare("SELECT id FROM doctors WHERE role = 'pharmacist' OR role = 'doctor'");
        $stmt->execute();
        $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($doctors)) {
            sendJSON(['success' => false, 'message' => 'No doctors available in the system.'], 503);
        }

        $assignedDoctorId = null;

        foreach ($doctors as $doc) {
            $checkStmt = $conn->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'cancelled'");
            $checkStmt->execute([$doc['id'], $date, $time]);
            if ($checkStmt->rowCount() === 0) {
                $assignedDoctorId = $doc['id'];
                break;
            }
        }

        if (!$assignedDoctorId) {
            sendJSON(['success' => false, 'message' => 'No doctors available at this specific time. Please choose another slot.'], 409);
        }

        // Create appointment
        $sql = "INSERT INTO appointments (patient_id, doctor_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$patientId, $assignedDoctorId, $date, $time, $reason, 'scheduled']);
        $appointmentId = $conn->lastInsertId();

        // Create notification
        $notifSql = "INSERT INTO notifications (doctor_id, message, appointment_id) VALUES (?, ?, ?)";
        $notifStmt = $conn->prepare($notifSql);
        $notifStmt->execute([$assignedDoctorId, "New EMERGENCY appointment booked for $date at $time", $appointmentId]);

        sendJSON([
            'success' => true, 
            'message' => 'Emergency appointment booked successfully. A doctor has been assigned.',
            'appointment' => [
                'id' => $appointmentId,
                'date' => $date,
                'time' => $time,
                'reason' => $reason,
                'status' => 'scheduled',
                'doctor_id' => $assignedDoctorId
            ]
        ], 201);

    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error booking appointment'], 500);
    }
}

function getAllAppointments() {
    $token = JWT::getBearerToken();
    $decoded = JWT::decode($token);
    if (!$decoded) {
        sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    $userId = $decoded['id'];
    $role = $decoded['role'];

    $db = new Database();
    $conn = $db->getConnection();

    try {
        if ($role === 'patient') {
            $stmt = $conn->prepare("SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, time DESC");
            $stmt->execute([$userId]);
        } else {
            // Doctor sees their appointments
            $stmt = $conn->prepare("SELECT * FROM appointments WHERE doctor_id = ? ORDER BY date DESC, time DESC");
            $stmt->execute([$userId]);
        }
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJSON(['success' => true, 'appointments' => $appointments]);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Error fetching appointments'], 500);
    }
}
?>
