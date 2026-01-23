-- Add is_emergency and doctor_id to appointments table
ALTER TABLE appointments 
ADD COLUMN is_emergency TINYINT(1) DEFAULT 0,
ADD COLUMN doctor_id INT,
ADD CONSTRAINT fk_appointments_doctor 
FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;
