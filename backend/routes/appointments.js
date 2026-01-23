const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Book appointment
async function book(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    // We strictly enforce emergency booking for now
    // In a real app we might allow non-emergency if the user is a doctor/admin booking for someone else
    // But per requirements: "patient can only book an appointment if it is emergency"
    const { date, time, reason, isEmergency } = req.body;

    if (!date || !time) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Date and time are required'
      });
    }

    if (!isEmergency) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Only emergency appointments can be booked at this time.'
      });
    }

    // Check if date is in the past
    const appointmentDate = new Date(`${date}T${time}`);
    if (appointmentDate < new Date()) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Cannot book appointment in the past'
      });
    }

    const pool = db.getDb();

    // Auto-assign any free doctor
    // Strategy: Find a doctor who does NOT have an appointment at this date/time
    // Prioritize doctors with fewer patients or just pick random/first available

    // First, get all doctors (pharmacists)
    const [doctors] = await pool.query('SELECT id FROM users WHERE role = ? OR role = ?', ['pharmacist', 'doctor']);

    if (doctors.length === 0) {
      return sendJSON(res, 503, {
        success: false,
        message: 'No doctors available in the system.'
      });
    }

    // Check availability for each doctor at the requested time
    // This could be optimized with a complex JOIN, but a simple filter is fine for reduced complexity
    let assignedDoctorId = null;

    for (const doc of doctors) {
      const [busy] = await pool.query(
        'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != ?',
        [doc.id, date, time, 'cancelled']
      );

      if (busy.length === 0) {
        assignedDoctorId = doc.id;
        break;
      }
    }

    if (!assignedDoctorId) {
      return sendJSON(res, 409, {
        success: false,
        message: 'No doctors available at this specific time. Please choose another slot.'
      });
    }

    // Create the appointment
    const [result] = await pool.query(
      'INSERT INTO appointments (user_id, doctor_id, date, time, reason, status, is_emergency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, assignedDoctorId, date, time, reason || 'Emergency Consultation', 'scheduled', 1]
    );

    const appointmentId = result.insertId;

    // Create notification for the assigned doctor
    await pool.query(
      'INSERT INTO notifications (user_id, message, appointment_id) VALUES (?, ?, ?)',
      [assignedDoctorId, `New EMERGENCY appointment booked for ${date} at ${time}`, appointmentId]
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Emergency appointment booked successfully. A doctor has been assigned.',
      appointment: {
        id: appointmentId,
        date,
        time,
        reason,
        status: 'scheduled',
        doctor_id: assignedDoctorId
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error booking appointment'
    });
  }
}

// Get user appointments
async function getAll(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const pool = db.getDb();

    const [appointments] = await pool.query(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY date DESC, time DESC',
      [userId]
    );

    sendJSON(res, 200, { success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching appointments'
    });
  }
}

// Get single appointment
async function getOne(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const pool = db.getDb();

    const [appointments] = await pool.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (appointments.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Appointment not found'
      });
    }

    sendJSON(res, 200, { success: true, appointment: appointments[0] });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching appointment'
    });
  }
}

// Cancel appointment
async function cancel(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query(
      'UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?',
      ['cancelled', id, userId]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Appointment not found'
      });
    }

    sendJSON(res, 200, {
      success: true,
      message: 'Appointment cancelled'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error cancelling appointment'
    });
  }
}

module.exports = {
  book,
  getAll,
  getOne,
  cancel
};
