const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Helper to get correct ID column
const getIdCol = (req) => req.user.role === 'patient' ? 'patient_id' : 'doctor_id';

// Get unread notifications
async function getNotifications(req, res) {
    const authResult = await authenticateToken(req, res);
    if (!authResult) return;

    try {
        const pool = db.getDb();
        const idCol = getIdCol(req);

        const [notifications] = await pool.query(
            `SELECT * FROM notifications WHERE ${idCol} = ? ORDER BY createdAt DESC`,
            [req.user.id]
        );

        sendJSON(res, 200, { success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        sendJSON(res, 500, { success: false, message: 'Error fetching notifications' });
    }
}

// Mark notifications as read
async function markRead(req, res) {
    const authResult = await authenticateToken(req, res);
    if (!authResult) return;

    try {
        const pool = db.getDb();
        const { id } = req.body;
        const idCol = getIdCol(req);

        // If id provided, mark specific, else mark all
        let query = `UPDATE notifications SET is_read = 1 WHERE ${idCol} = ?`;
        let params = [req.user.id];

        if (id) {
            query += ' AND id = ?';
            params.push(id);
        }

        await pool.query(query, params);

        sendJSON(res, 200, { success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        sendJSON(res, 500, { success: false, message: 'Error updating notifications' });
    }
}

// Delete notification
async function deleteNotification(req, res) {
    const authResult = await authenticateToken(req, res);
    if (!authResult) return;

    try {
        const pool = db.getDb();
        const { id } = req.params;
        const idCol = getIdCol(req);

        // Check if notification exists and belongs to user
        const [notifications] = await pool.query(
            `SELECT * FROM notifications WHERE id = ? AND ${idCol} = ?`,
            [id, req.user.id]
        );

        if (notifications.length === 0) {
            return sendJSON(res, 404, { success: false, message: 'Notification not found' });
        }

        const notification = notifications[0];

        // If linked to an appointment, check if time has passed
        if (notification.appointment_id) {
            const [appointments] = await pool.query(
                'SELECT date, time FROM appointments WHERE id = ?',
                [notification.appointment_id]
            );

            if (appointments.length > 0) {
                const appt = appointments[0];
                const apptDateTime = new Date(`${appt.date}T${appt.time}`);
                const now = new Date();

                if (now < apptDateTime) {
                    return sendJSON(res, 400, {
                        success: false,
                        message: 'Cannot clear until appointment time has passed'
                    });
                }
            }
        }

        // Delete notification
        await pool.query('DELETE FROM notifications WHERE id = ?', [id]);

        sendJSON(res, 200, { success: true, message: 'Notification cleared' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        sendJSON(res, 500, { success: false, message: 'Error deleting notification' });
    }
}

module.exports = {
    getNotifications,
    markRead,
    deleteNotification
};
