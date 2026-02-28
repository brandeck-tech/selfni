-- ============================================
-- إكمال جميع الجداول الناقصة والأعمدة والعلاقات
-- ============================================

-- 1. التأكد من وجود الأعمدة الأساسية في جدول debts
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'lend',
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'lump_sum',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS agreed_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS written_off_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS collateral_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS collateral_images TEXT[],
ADD COLUMN IF NOT EXISTS collateral_notes TEXT,
ADD COLUMN IF NOT EXISTS installments_count INTEGER,
ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_days INTEGER[],
ADD COLUMN IF NOT EXISTS reminder_methods VARCHAR(20)[],
ADD COLUMN IF NOT EXISTS expected_collection_date DATE,
ADD COLUMN IF NOT EXISTS collection_probability DECIMAL(5,2);

-- 2. تحديث القيم للصفوف الموجودة
UPDATE debts SET remaining_amount = amount WHERE remaining_amount IS NULL OR remaining_amount = 0;
UPDATE debts SET type = 'lend' WHERE type IS NULL;
UPDATE debts SET status = 'active' WHERE status IS NULL;
UPDATE debts SET user_id = (SELECT user_id FROM customers WHERE customers.id = debts.customer_id) WHERE user_id IS NULL AND customer_id IS NOT NULL;

-- 3. إنشاء جدول installments كامل (مع الأعمدة المفقودة)
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    penalty_amount DECIMAL(12,2) DEFAULT 0,
    penalty_reason TEXT,
    reminders_sent INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. إنشاء جدول risk_history (سجل المخاطر)
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

-- 5. إنشاء جدول notifications (الإشعارات)
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
    action_taken BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. إنشاء جدول achievements (الإنجازات)
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    achievement_icon TEXT,
    achievement_rarity VARCHAR(20),
    progress INTEGER DEFAULT 0,
    max_progress INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. إنشاء جدول whatsapp_messages (رسائل واتساب)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    debt_id INTEGER REFERENCES debts(id),
    phone_number VARCHAR(20) NOT NULL,
    message_template VARCHAR(50),
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. إنشاء جدول backups (النسخ الاحتياطي)
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_type VARCHAR(20),
    backup_size INTEGER,
    file_path TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    restored_at TIMESTAMP
);

-- 9. إنشاء جدول activity_log (سجل النشاط)
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. إنشاء جدول challenges (التحديات الشهرية)
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(50) NOT NULL,
    challenge_name VARCHAR(100) NOT NULL,
    challenge_description TEXT,
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reward_points INTEGER,
    reward_badge TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. إنشاء جدول shared_reputation (السمعة المشتركة)
CREATE TABLE IF NOT EXISTS shared_reputation (
    id SERIAL PRIMARY KEY,
    reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    report_type VARCHAR(30),
    is_blacklist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_user_id, customer_phone)
);

-- 12. إضافة الفهارس اللازمة
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_debt_id ON installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_risk_history_customer ON risk_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- 13. إعادة تعريف دالة التحديث للعملاء (بدون الاعتماد على payments)
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إحصائيات العميل فقط إذا كان customer_id موجودًا
    IF NEW.customer_id IS NOT NULL THEN
        UPDATE customers SET
            total_borrowed = COALESCE((
                SELECT SUM(amount) FROM debts 
                WHERE customer_id = NEW.customer_id AND type = 'lend'
            ), 0),
            total_pending = COALESCE((
                SELECT SUM(remaining_amount) FROM debts 
                WHERE customer_id = NEW.customer_id AND status IN ('active', 'overdue')
            ), 0),
            total_transactions = COALESCE((
                SELECT COUNT(*) FROM debts 
                WHERE customer_id = NEW.customer_id
            ), 0),
            last_transaction_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إسقاط trigger القديم وإنشاء الجديد
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON debts;
CREATE TRIGGER trigger_update_customer_stats
AFTER INSERT OR UPDATE ON debts
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- 14. تحديث جميع العملاء مرة واحدة
UPDATE customers SET
    total_borrowed = COALESCE((
        SELECT SUM(amount) FROM debts 
        WHERE customer_id = customers.id AND type = 'lend'
    ), 0),
    total_pending = COALESCE((
        SELECT SUM(remaining_amount) FROM debts 
        WHERE customer_id = customers.id AND status IN ('active', 'overdue')
    ), 0),
    total_transactions = COALESCE((
        SELECT COUNT(*) FROM debts 
        WHERE customer_id = customers.id
    ), 0),
    updated_at = CURRENT_TIMESTAMP;

-- 15. رسالة نجاح
SELECT '✅ تم إكمال جميع الجداول والأعمدة والعلاقات بنجاح' AS message;
