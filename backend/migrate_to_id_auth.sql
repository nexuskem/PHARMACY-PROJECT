-- Migration script to update existing database for ID-based authentication
-- Run this if you have an existing database with the old schema

USE medicare_pharmacy;

-- Add new ID columns (allow NULL initially)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50) UNIQUE AFTER id,
ADD COLUMN IF NOT EXISTS pharmacist_id VARCHAR(50) UNIQUE AFTER patient_id;

-- Update existing users based on their role
-- For existing 'customer' role users, generate patient IDs
UPDATE users 
SET patient_id = CONCAT('PAT-', LPAD(id, 6, '0'))
WHERE role = 'customer' AND patient_id IS NULL;

-- For existing 'pharmacist' role users, generate pharmacist IDs
UPDATE users 
SET pharmacist_id = CONCAT('PHARM-', LPAD(id, 6, '0'))
WHERE role = 'pharmacist' AND pharmacist_id IS NULL;

-- Change default role from 'customer' to 'patient'
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) DEFAULT 'patient';

-- Change 'customer' role to 'patient' for existing records
UPDATE users SET role = 'patient' WHERE role = 'customer';

-- Make email optional (since ID is now required)
ALTER TABLE users MODIFY COLUMN email VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);
CREATE INDEX IF NOT EXISTS idx_users_pharmacist_id ON users(pharmacist_id);

-- Note: The CHECK constraint for ensuring either patient_id or pharmacist_id exists
-- based on role cannot be added in MySQL 5.7, but is enforced in application logic.
-- For MySQL 8.0+, you can add:
-- ALTER TABLE users ADD CONSTRAINT chk_user_id CHECK (
--   (role = 'patient' AND patient_id IS NOT NULL) OR
--   (role = 'pharmacist' AND pharmacist_id IS NOT NULL)
-- );
