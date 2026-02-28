ALTER TABLE users 
ADD COLUMN is_verified BOOLEAN DEFAULT false,
ADD COLUMN verification_token VARCHAR(255) UNIQUE,
ADD COLUMN verification_expires TIMESTAMP;
