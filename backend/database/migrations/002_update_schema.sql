-- ============================================
-- تحديث قاعدة البيانات الحالية - إضافة الجداول والأعمدة المفقودة
-- ============================================

-- أولاً: إضافة الأعمدة الجديدة لجدول users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS notification_before_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ar',
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS emergency_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- ثانياً: إضافة الأعمدة الجديدة لجدول customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS id_card_image TEXT,
ADD COLUMN IF NOT EXISTS total_pending DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_overdue DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avg_repayment_days INTEGER,
ADD COLUMN IF NOT EXISTS best_contact_time TIME,
ADD COLUMN IF NOT EXISTS whatsapp_response_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS shared_reputation DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS blacklist_reports INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transaction_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- تحديث first_transaction_date إذا كان موجوداً
UPDATE customers SET first_transaction_date = created_at WHERE first_transaction_date IS NULL;

-- ثالثاً: إضافة الأعمدة الجديدة لجدول debts
ALTER TABLE debts 
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
ADD COLUMN IF NOT EXISTS collection_probability DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- رابعاً: إضافة الأعمدة الجديدة لجدول payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS receipt_image TEXT,
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);

-- ============================================
-- إنشاء الجداول الجديدة (باستخدام INTEGER للـ IDs)
-- ============================================

-- 1. جدول الأقساط (Installments) - إذا لم يكن موجوداً
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

-- 2. جدول سجل تقييم المخاطر (Risk History)
CREATE TABLE IF NOT EXISTS risk_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    debt_id INTEGER REFERENCES debts(id),
    old_score INTEGER,
    new_score INTEGER NOT NULL,
    old_category VARCHAR(20),
    new_category VARCHAR(20) NOT NULL,
    change_reason TEXT,
    change_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    debt_id INTEGER REFERENCES debts(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_taken BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول الإنجازات (Achievements)
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

-- 5. جدول التحديات الشهرية (Challenges)
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

-- 6. جدول السمعة المشتركة (Shared Reputation)
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

-- 7. جدول رسائل واتساب (WhatsApp Messages)
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

-- 8. جدول النسخ الاحتياطي (Backups)
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

-- 9. جدول سجل النشاط (Activity Log)
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

-- ============================================
-- إنشاء الفهارس (Indexes) لتحسين الأداء
-- ============================================

-- فهارس العملاء
CREATE INDEX IF NOT EXISTS idx_customers_risk_category ON customers(risk_category);
CREATE INDEX IF NOT EXISTS idx_customers_risk_score ON customers(risk_score);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- فهارس الديون
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

-- فهارس المدفوعات
CREATE INDEX IF NOT EXISTS idx_payments_debt_id ON payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- فهارس الجداول الجديدة
CREATE INDEX IF NOT EXISTS idx_installments_debt_id ON installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_risk_history_customer_id ON risk_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);

-- ============================================
-- إنشاء الدوال (Functions) والمحفزات (Triggers)
-- ============================================

-- دالة تحديث إحصائيات العميل بعد أي عملية
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إجمالي المديونيات للعميل
    UPDATE customers SET
        total_borrowed = COALESCE((SELECT SUM(amount) FROM debts WHERE customer_id = NEW.customer_id AND type = 'lent'), 0),
        total_repaid = COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = NEW.customer_id), 0),
        total_pending = COALESCE((SELECT SUM(remaining_amount) FROM debts WHERE customer_id = NEW.customer_id AND status IN ('active', 'overdue')), 0),
        total_transactions = COALESCE((SELECT COUNT(*) FROM debts WHERE customer_id = NEW.customer_id), 0),
        last_transaction_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات (إذا لم تكن موجودة)
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON debts;
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

DROP TRIGGER IF EXISTS trigger_update_customer_stats_payments ON payments;
CREATE TRIGGER trigger_update_customer_stats_payments
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- تحديث البيانات التجريبية (اختياري)
-- ============================================

-- تحديث بيانات المستخدم التجريبي (تأكد من وجود المستخدم أولاً)
UPDATE users SET
    store_name = 'سوبر ماركت النور',
    language = 'ar',
    notification_before_days = 3
WHERE email = 'hossamnassem23@gmail.com' OR phone = '01273721840';

-- إضافة سجل مخاطر تجريبي (إذا كان العميل موجوداً)
INSERT INTO risk_history (customer_id, new_score, new_category, change_reason)
SELECT id, risk_score, risk_category, 'initial_score'
FROM customers 
WHERE phone = '01273721840'
AND NOT EXISTS (SELECT 1 FROM risk_history WHERE customer_id = customers.id LIMIT 1);

-- ============================================
-- التحقق من البيانات
-- ============================================

SELECT '✅ تم تحديث قاعدة البيانات بنجاح' as message;
