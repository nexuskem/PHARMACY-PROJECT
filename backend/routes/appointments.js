const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Book appointment
async function book(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { date, time, reason } = req.body;

    if (!date || !time) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Date and time are required'
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

    // Check if time slot is available (optional: implement slot checking)
    const [result] = await pool.query(
      'INSERT INTO appointments (patient_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?)',
      [userId, date, time, reason || null, 'pending']
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        id: result.insertId,
        date,
        time,
        reason,
        status: 'scheduled'
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
      'SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, time DESC',
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
      'SELECT * FROM appointments WHERE id = ? AND patient_id = ?',
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
      'UPDATE appointments SET status = ? WHERE id = ? AND patient_id = ?',
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
