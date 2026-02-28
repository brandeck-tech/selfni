-- ============================================
-- إنشاء جدول customers (لو مش موجود)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT,
    profile_image TEXT,
    id_card_image TEXT,
    notes TEXT,
    total_borrowed DECIMAL(12,2) DEFAULT 0,
    total_repaid DECIMAL(12,2) DEFAULT 0,
    risk_score INTEGER DEFAULT 60,
    risk_category VARCHAR(20) DEFAULT 'watch',
    first_transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_transaction_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_risk_score ON customers(risk_score);

-- إضافة بعض البيانات التجريبية (اختياري)
INSERT INTO customers (user_id, name, phone, risk_score, risk_category)
SELECT id, 'أحمد محمد', '01273721840', 45, 'risk'
FROM users 
WHERE phone = '01273721840' OR email = 'hossamnassem23@gmail.com'
AND NOT EXISTS (SELECT 1 FROM customers WHERE phone = '01273721840');

INSERT INTO customers (user_id, name, phone, risk_score, risk_category)
SELECT id, 'حسام نسيم', '01234567890', 60, 'watch'
FROM users 
WHERE phone = '01273721840' OR email = 'hossamnassem23@gmail.com'
AND NOT EXISTS (SELECT 1 FROM customers WHERE phone = '01234567890');

SELECT '✅ تم إنشاء customers بنجاح' as message;
