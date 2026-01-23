const db = require('../config/database');

// Since server.js might not export app directly for testing without modification, 
// we will simulate the logic by directly calling the booking handler if needed, 
// OR better yet, we can create a script that makes a real HTTP request if the server is running, 
// or mocks the request/response objects to test the controller logic directly.

// Approach: Test Controller Logic directly to verify permission + database insert
// This avoids server running issues.

const { bookAppointment } = require('../routes/pharmacist');

async function testDoctorBooking() {
    console.log("🧪 Starting Doctor Booking Verification...");

    // 1. Init DB
    await db.init();
    const pool = db.getDb();

    // 2. Clear test data
    await pool.query("DELETE FROM users WHERE email = 'test_doctor_verify@example.com'");
    await pool.query("DELETE FROM users WHERE email = 'test_patient_verify@example.com'");

    try {
        // 3. Create Test Patient
        const [pResult] = await pool.query(`
            INSERT INTO patients (patient_id, firstName, lastName, email, password, role) 
            VALUES ('PAT-VERIFY-001', 'Test', 'Patient', 'test_patient_verify@example.com', 'hash', 'patient')
        `);
        const patientId = pResult.insertId;
        console.log("✅ Created Test Patient");

        // 4. Create Test Doctor
        const [dResult] = await pool.query(`
            INSERT INTO doctors (pharmacist_id, firstName, lastName, email, password, role) 
            VALUES ('DOC-VERIFY-001', 'Test', 'Doctor', 'test_doctor_verify@example.com', 'hash', 'doctor')
        `);
        const doctorId = dResult.insertId;
        console.log("✅ Created Test Doctor");

        // 5. Mock Request/Response
        const req = {
            user: { id: doctorId, role: 'doctor' }, // Authenticated as Doctor
            body: {
                patientId: 'PAT-VERIFY-001',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                reason: 'Verification Check'
            }
        };

        const res = {
            headersSent: false,
            statusCode: 200,
            jsonResponse: null,
            setHeader: () => { },
            writeHead: (code) => { res.statusCode = code; },
            end: (data) => {
                if (data) {
                    try {
                        res.jsonResponse = JSON.parse(data);
                    } catch (e) {
                        res.plainResponse = data;
                    }
                }
            }
        };

        // 6. Call Controller
        console.log("🔄 Attempting to book appointment as Doctor...");

        // We need to bypass the middleware call in the route definition and call the function directly.
        // BUT the function itself calls `requirePharmacist`.
        // So we just call `bookAppointment`. It will call `requirePharmacist` internally.

        // Mock middleware helpers if needed? 
        // No, `bookAppointment` imports `requirePharmacist`. 
        // We verified `requirePharmacist` checks `req.user.role`.
        // We need to make sure `requirePharmacist` behaves correctly.

        await bookAppointment(req, res);

        // 7. Verification
        if (res.statusCode === 201) {
            console.log("✅ Success! Doctor booked appointment (Status 201)");
        } else {
            console.log(`❌ Failed! Status: ${res.statusCode}`, res.jsonResponse);
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Error during verification:", error);
        process.exit(1);
    } finally {
        // Cleanup
        await pool.query("DELETE FROM users WHERE email = 'test_doctor_verify@example.com'");
        await pool.query("DELETE FROM users WHERE email = 'test_patient_verify@example.com'");
        await pool.end(); // Close connection
    }
}

testDoctorBooking();
