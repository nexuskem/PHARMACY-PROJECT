const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Handle M-Pesa Callback
async function handleCallback(req, res) {
    try {
        const { Body } = req.body;

        if (!Body || !Body.stkCallback) {
            return sendJSON(res, 400, { message: 'Invalid callback data' });
        }

        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
        const pool = db.getDb();

        console.log(`M-Pesa Callback Received: ${ResultCode} - ${ResultDesc}`);

        if (ResultCode === 0) {
            // Payment Successful
            let receiptNumber = '';

            // Extract Receipt Number
            if (CallbackMetadata && CallbackMetadata.Item) {
                const receiptItem = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
                if (receiptItem) receiptNumber = receiptItem.Value;
            }

            await pool.query(
                'UPDATE orders SET payment_status = ?, mpesa_receipt = ? WHERE checkout_request_id = ?',
                ['completed', receiptNumber, CheckoutRequestID]
            );

            console.log(`Order updated for CheckoutRequestID: ${CheckoutRequestID}`);
        } else {
            // Payment Failed/Cancelled
            await pool.query(
                'UPDATE orders SET payment_status = ? WHERE checkout_request_id = ?',
                ['failed', CheckoutRequestID]
            );
            console.log(`Payment failed for CheckoutRequestID: ${CheckoutRequestID}`);
        }

        // Always respond with success to M-Pesa
        sendJSON(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
        console.error('M-Pesa Callback Error:', error);
        // Still respond 200 to acknowledge receipt to M-Pesa
        sendJSON(res, 200, { ResultCode: 0, ResultDesc: "Error processing" });
    }
}

module.exports = {
    handleCallback
};
