-- ============================================
-- إضافة المميزات الجديدة لسلفني
-- ============================================

-- 1. إضافة أعمدة جديدة لجدول users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS notification_before_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE;

-- 2. إضافة أعمدة جديدة لجدول customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avg_repayment_days INTEGER,
ADD COLUMN IF NOT EXISTS best_contact_time TIME,
ADD COLUMN IF NOT EXISTS whatsapp_response_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_pending DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_overdue DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. إضافة أعمدة جديدة لجدول debts
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'lump_sum',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS collateral_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS collateral_images TEXT[],
ADD COLUMN IF NOT EXISTS reminder_days INTEGER[],
ADD COLUMN IF NOT EXISTS reminder_methods VARCHAR(20)[],
ADD COLUMN IF NOT EXISTS expected_collection_date DATE,
ADD COLUMN IF NOT EXISTS collection_probability DECIMAL(5,2);

-- 4. جدول الأقساط الجديد
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول سجل المخاطر
CREATE TABLE IF NOT EXISTS risk_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    old_score INTEGER,
    new_score INTEGER NOT NULL,
    old_category VARCHAR(20),
    new_category VARCHAR(20) NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    debt_id INTEGER REFERENCES debts(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول الإنجازات
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول رسائل واتساب
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. إنشاء الفهارس الجديدة
CREATE INDEX IF NOT EXISTS idx_customers_risk_score ON customers(risk_score);
CREATE INDEX IF NOT EXISTS idx_customers_risk_category ON customers(risk_category);
CREATE INDEX IF NOT EXISTS idx_debts_expected_date ON debts(expected_collection_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

-- 10. تحديث بيانات المخاطر للعملاء الحاليين
INSERT INTO risk_history (customer_id, new_score, new_category, change_reason)
SELECT id, risk_score, 
    CASE 
        WHEN risk_score >= 85 THEN 'excellent'
        WHEN risk_score >= 70 THEN 'good'
        WHEN risk_score >= 50 THEN 'watch'
        ELSE 'risk'
    END,
    'initial_score'
FROM customers 
WHERE NOT EXISTS (SELECT 1 FROM risk_history WHERE customer_id = customers.id);

SELECT '✅ تم إضافة المميزات الجديدة بنجاح' as message;
