# Dual Portal System - Patient & Admin (Pharmacist/Doctor)

## Overview

The MediCare Pharmacy application now supports **two separate portals**:

1. **Patient Portal** - For patients to register, login, and manage their orders
2. **Admin Portal** - For pharmacists and doctors to manage orders and appointments

Both portals require **ID-based authentication** instead of email-based authentication.

---

## Database Schema Changes

### Updated Users Table

The `users` table now includes:
- `patient_id` - Unique identifier for patients (required for patient role)
- `pharmacist_id` - Unique identifier for pharmacists (required for pharmacist role)
- `email` - Now optional (was required before)
- `role` - Changed from 'customer' to 'patient' as default

### Migration

If you have an existing database, run the migration script:
```bash
mysql -u root -p medicare_pharmacy < backend/migrate_to_id_auth.sql
```

This will:
- Add the new ID columns
- Generate IDs for existing users based on their role
- Update role values ('customer' → 'patient')
- Make email optional

---

## Backend API Changes

### New Registration Endpoints

1. **Patient Registration**
   - `POST /api/auth/register/patient`
   - Requires: `patientId`, `firstName`, `lastName`, `password`
   - Optional: `email`, `phone`

2. **Pharmacist Registration**
   - `POST /api/auth/register/pharmacist`
   - Requires: `pharmacistId`, `firstName`, `lastName`, `password`
   - Optional: `email`, `phone`

### Updated Login Endpoint

- `POST /api/auth/login`
- Requires: `userId`, `password`, `role` ('patient' or 'pharmacist')
- Supports both patient_id and pharmacist_id login

---

## Frontend Pages

### Patient Portal

1. **Patient Login** (`patient-login.html`)
   - Login with Patient ID and password
   - Links to patient registration and admin login

2. **Patient Registration** (`patient-register.html`)
   - Register with Patient ID, name, and password
   - Optional email and phone

### Admin Portal

1. **Admin Login** (`admin-login.html`)
   - Login with Pharmacist ID and password
   - Links to pharmacist registration and patient login

2. **Pharmacist Registration** (`admin-register.html`)
   - Register with Pharmacist ID, name, and password
   - Optional email and phone

### Updated Pages

- `index.html` - Now shows "Patient Login" and "Admin Login" buttons
- `dashboard.html` - Redirects pharmacists to `pharmacist.html`
- All pages use the updated authentication system

---

## Authentication Flow

### Patient Flow

1. Patient visits `patient-login.html` or `patient-register.html`
2. Registers/Logs in with Patient ID
3. Redirected to `dashboard.html` (patient dashboard)
4. Can browse products, place orders, book appointments

### Pharmacist Flow

1. Pharmacist visits `admin-login.html` or `admin-register.html`
2. Registers/Logs in with Pharmacist ID
3. Redirected to `pharmacist.html` (admin dashboard)
4. Can approve/reject orders, manage appointments

---

## ID Format Examples

### Patient IDs
- `PAT-000001`
- `PAT-123456`
- `PAT-ABC123`

### Pharmacist IDs
- `PHARM-000001`
- `PHARM-123456`
- `PHARM-ABC123`

**Note:** The format is flexible - any unique string can be used as an ID.

---

## Security Notes

1. **ID Uniqueness**: Both `patient_id` and `pharmacist_id` must be unique
2. **Role Enforcement**: The application ensures users can only login with the correct ID type for their role
3. **Token-Based Auth**: JWT tokens are used for session management
4. **Password Requirements**: Minimum 6 characters (can be enforced stricter)

---

## Testing the System

### Test Patient Registration

1. Go to `patient-register.html`
2. Fill in:
   - Patient ID: `PAT-001`
   - First Name: `John`
   - Last Name: `Doe`
   - Password: `password123`
3. Submit and verify redirect to dashboard

### Test Pharmacist Registration

1. Go to `admin-register.html`
2. Fill in:
   - Pharmacist ID: `PHARM-001`
   - First Name: `Jane`
   - Last Name: `Smith`
   - Password: `password123`
3. Submit and verify redirect to pharmacist dashboard

### Test Login

1. Use the created IDs to login
2. Verify role-based redirection
3. Test logout functionality

---

## Next Steps

1. **Update Database**: Run the migration script if you have existing data
2. **Test Registration**: Create test accounts for both roles
3. **Customize IDs**: Implement any ID generation/validation rules needed
4. **Add Validation**: Add stricter ID format validation if required
5. **Email Verification**: Add email verification for optional email addresses

---

## File Changes Summary

### Backend
- `backend/config/database.js` - Updated schema
- `backend/routes/auth.js` - New ID-based auth routes
- `backend/server.js` - Updated route definitions
- `backend/database.sql` - Updated schema
- `backend/migrate_to_id_auth.sql` - Migration script

### Frontend
- `frontend/patient-login.html` - New patient login page
- `frontend/patient-register.html` - New patient registration page
- `frontend/admin-login.html` - New admin login page
- `frontend/admin-register.html` - New pharmacist registration page
- `frontend/js/auth.js` - Updated authentication logic
- `frontend/index.html` - Updated navigation
- `frontend/dashboard.html` - Added role-based redirection

---

## Support

For issues or questions:
1. Check database migration completed successfully
2. Verify MySQL service is running
3. Check browser console for JavaScript errors
4. Verify API endpoints are accessible
5. Ensure CORS is properly configured for localhost:3000
