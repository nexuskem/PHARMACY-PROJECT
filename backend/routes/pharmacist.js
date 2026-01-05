const { authenticateToken, requirePharmacist } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Get pending orders requiring approval
async function getPendingOrders(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const pool = db.getDb();

    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.total,
        o.createdAt,
        u.firstName,
        u.lastName,
        u.email,
        GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      JOIN patients u ON o.patient_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'pending' AND o.requiresApproval = 1
      GROUP BY o.id
      ORDER BY o.createdAt ASC`,
      []
    );

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      total: parseFloat(order.total),
      customer: `${order.firstName} ${order.lastName}`,
      customerEmail: order.email,
      items: order.items ? order.items.split(', ') : [],
      createdAt: order.createdAt
    }));

    sendJSON(res, 200, { success: true, orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching pending orders'
    });
  }
}

// Get order details for approval
async function getOrder(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { id } = req.params;
    const pool = db.getDb();

    // Get order
    const [orders] = await pool.query(
      `SELECT 
        o.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phone
      FROM orders o
      JOIN patients u ON o.patient_id = u.id
      WHERE (o.id = ? OR o.order_number = ?) AND o.requiresApproval = 1`,
      [id, id]
    );

    if (orders.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT 
        oi.quantity,
        oi.price,
        p.id,
        p.name,
        p.description,
        p.category,
        p.requiresApproval
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [order.id]
    );

    sendJSON(res, 200, {
      success: true,
      order: {
        ...order,
        total: parseFloat(order.total),
        customer: `${order.firstName} ${order.lastName}`,
        items: items.map(item => ({
          ...item,
          price: parseFloat(item.price),
          requiresApproval: item.requiresApproval === 1
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching order'
    });
  }
}

// Approve order
async function approveOrder(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const pharmacistId = req.user.id;
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query(
      `UPDATE orders 
       SET status = 'approved', 
           approvedBy = ?, 
           approvedAt = CURRENT_TIMESTAMP 
       WHERE (id = ? OR order_number = ?) AND status = 'pending'`,
      [pharmacistId, id, id]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Order not found or already processed'
      });
    }

    sendJSON(res, 200, {
      success: true,
      message: 'Order approved successfully'
    });
  } catch (error) {
    console.error('Error approving order:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error approving order'
    });
  }
}

// Reject order
async function rejectOrder(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const pharmacistId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    const pool = db.getDb();

    const [result] = await pool.query(
      `UPDATE orders 
       SET status = 'rejected', 
           approvedBy = ?, 
           approvedAt = CURRENT_TIMESTAMP 
       WHERE (id = ? OR order_number = ?) AND status = 'pending'`,
      [pharmacistId, id, id]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Order not found or already processed'
      });
    }

    sendJSON(res, 200, {
      success: true,
      message: 'Order rejected'
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error rejecting order'
    });
  }
}

// Get all appointments
async function getAppointments(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { status, date } = req.query;
    let query = `SELECT 
      a.*,
      u.firstName,
      u.lastName,
      u.email,
      u.phone
    FROM appointments a
    JOIN patients u ON a.patient_id = u.id
    WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    query += ' ORDER BY a.date ASC, a.time ASC';

    const pool = db.getDb();
    const [appointments] = await pool.query(query, params);

    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      customer: `${apt.firstName} ${apt.lastName}`
    }));

    sendJSON(res, 200, { success: true, appointments: formattedAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching appointments'
    });
  }
}

// Book appointment for patient
async function bookAppointment(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { patientId, date, time, reason } = req.body;

    if (!patientId || !date || !time) {
      return sendJSON(res, 400, { success: false, message: 'Please provide Patient ID, Date, and Time' });
    }

    const pool = db.getDb();

    // Find patient and verify assignment
    const [users] = await pool.query(
      'SELECT id, firstName, lastName, email, phone FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (users.length === 0) {
      return sendJSON(res, 404, { success: false, message: 'Patient ID not found' });
    }

    const patient = users[0];

    // Optional: Verify assignment if strict relationship is enforced
    // const [assignments] = await pool.query(
    //   'SELECT * FROM users WHERE id = ? AND assigned_doctor_id = ?',
    //   [patient.id, req.user.id]
    // );
    // if (assignments.length === 0) {
    //    return sendJSON(res, 403, { success: false, message: 'Patient is not assigned to you' });
    // }

    // Create Appointment
    const [apptResult] = await pool.query(
      'INSERT INTO appointments (patient_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?)',
      [patient.id, date, time, reason || 'Doctor initiated consultation', 'scheduled']
    );
    const appointmentId = apptResult.insertId;

    // Create Notification
    // Fetch doctor details first since they might not be in req.user
    const [doctors] = await pool.query('SELECT firstName, lastName FROM doctors WHERE id = ?', [req.user.id]);
    const doctorName = doctors.length > 0 ? `${doctors[0].firstName} ${doctors[0].lastName}` : 'Doctor';
    const notificationMessage = `Dr. ${doctorName} has scheduled an appointment with you on ${date} at ${time}.`;

    await pool.query(
      'INSERT INTO notifications (patient_id, message, is_read, appointment_id, createdAt) VALUES (?, ?, 0, ?, NOW())',
      [patient.id, notificationMessage, appointmentId]
    );

    sendJSON(res, 201, { success: true, message: 'Appointment booked and patient notified' });

  } catch (error) {
    console.error('Error booking appointment:', error);
    sendJSON(res, 500, { success: false, message: 'Error booking appointment: ' + error.message });
  }
}

// Approve Appointment
async function approveAppointment(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;
  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query(
      "UPDATE appointments SET status = 'scheduled' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, { success: false, message: 'Appointment not found' });
    }

    // Notify Patient
    const [appt] = await pool.query('SELECT patient_id, date, time FROM appointments WHERE id = ?', [id]);
    if (appt.length > 0) {
      const message = `Your appointment on ${appt[0].date} at ${appt[0].time} has been confirmed.`;
      await pool.query(
        'INSERT INTO notifications (patient_id, message, is_read, appointment_id, createdAt) VALUES (?, ?, 0, ?, NOW())',
        [appt[0].patient_id, message, id]
      );
    }

    sendJSON(res, 200, { success: true, message: 'Appointment confirmed' });
  } catch (error) {
    console.error('Error approving appointment:', error);
    sendJSON(res, 500, { success: false, message: 'Error confirming appointment' });
  }
}

// Reject Appointment
async function rejectAppointment(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;
  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, { success: false, message: 'Appointment not found' });
    }

    // Notify Patient
    const [appt] = await pool.query('SELECT patient_id, date, time FROM appointments WHERE id = ?', [id]);
    if (appt.length > 0) {
      const message = `Your appointment on ${appt[0].date} at ${appt[0].time} has been DECLINED by the doctor.`;
      await pool.query(
        'INSERT INTO notifications (patient_id, message, is_read, appointment_id, createdAt) VALUES (?, ?, 0, ?, NOW())',
        [appt[0].patient_id, message, id]
      );
    }

    sendJSON(res, 200, { success: true, message: 'Appointment rejected' });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    sendJSON(res, 500, { success: false, message: 'Error rejecting appointment' });
  }
}

module.exports = {
  getPendingOrders,
  getOrder,
  approveOrder,
  rejectOrder,
  getAppointments,
  bookAppointment,
  approveAppointment,
  rejectAppointment
};
