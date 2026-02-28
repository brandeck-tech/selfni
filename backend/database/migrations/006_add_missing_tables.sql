-- ============================================
-- إضافة الجداول الناقصة والأعمدة المفقودة
-- ============================================

-- 1. إضافة عمود customer_id في جدول debts إذا مش موجود
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

-- 2. تحديث debts بربطها بالعملاء (للموجودين)
UPDATE debts d
SET customer_id = c.id
FROM customers c
WHERE d.user_id = c.user_id 
  AND d.customer_id IS NULL 
  AND c.phone IS NOT NULL
  AND d.description LIKE '%' || c.name || '%';

-- 3. جدول الأقساط (installments) - تأكد من وجوده
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

-- 4. جدول سجل المخاطر (risk_history)
CREATE TABLE IF NOT EXISTS risk_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    debt_id INTEGER REFERENCES debts(id),
    old_score INTEGER,
    new_score INTEGER NOT NULL,
    old_category VARCHAR(20),
    new_category VARCHAR(20) NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول الإشعارات (notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    debt_id INTEGER REFERENCES debts(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول الإنجازات (achievements)
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول رسائل واتساب (whatsapp_messages)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    debt_id INTEGER REFERENCES debts(id),
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول النسخ الاحتياطي (backups)
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_type VARCHAR(20),
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. إضافة فهارس جديدة
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status_due ON debts(status, due_date);
CREATE INDEX IF NOT EXISTS idx_installments_debt_id ON installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_risk_history_customer ON risk_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- 10. إضافة بعض البيانات التجريبية للمخاطر
INSERT INTO risk_history (customer_id, new_score, new_category, change_reason)
SELECT id, risk_score, risk_category, 'initial_setup'
FROM customers 
WHERE NOT EXISTS (SELECT 1 FROM risk_history WHERE customer_id = customers.id);

-- رسالة النجاح
SELECT '✅ تم إضافة جميع الجداول الناقصة بنجاح' as message;
SELECT '📊 الجداول الموجودة:' as tables;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
