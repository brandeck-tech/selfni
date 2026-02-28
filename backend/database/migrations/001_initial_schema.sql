-- ============================================
-- قاعدة بيانات: debt_manager (PostgreSQL)
-- ============================================

-- 1. جدول المستخدمين (Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    store_name VARCHAR(200),
    store_logo TEXT,
    store_address TEXT,
    tax_number VARCHAR(50),
    
    -- إعدادات المستخدم
    notification_before_days INTEGER DEFAULT 3,
    dark_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'ar',
    
    -- الأمان
    biometric_enabled BOOLEAN DEFAULT FALSE,
    emergency_mode BOOLEAN DEFAULT FALSE,
    
    -- إحصائيات
    total_points INTEGER DEFAULT 0,
    user_level INTEGER DEFAULT 1,
    achievements JSONB DEFAULT '[]',
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- 2. جدول العملاء (Customers) - موسع
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT,
    
    -- الصورة والوثائق
    profile_image TEXT,
    id_card_image TEXT, -- صورة البطاقة الشخصية
    notes TEXT,
    
    -- إحصائيات مالية
    total_borrowed DECIMAL(12,2) DEFAULT 0,
    total_repaid DECIMAL(12,2) DEFAULT 0,
    total_pending DECIMAL(12,2) DEFAULT 0,
    total_overdue DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- تقييم المخاطر (يحسب تلقائياً)
    risk_score INTEGER DEFAULT 60, -- 0-100
    risk_category VARCHAR(20) DEFAULT 'watch', -- excellent, good, watch, risk
    risk_factors JSONB DEFAULT '{}', -- تخزين تفاصيل التقييم
    
    -- تحليل السلوك
    avg_repayment_days INTEGER, -- متوسط أيام السداد
    best_contact_time TIME, -- أفضل وقت للمتابعة
    whatsapp_response_rate DECIMAL(5,2), -- نسبة الاستجابة على واتساب
    
    -- السمعة المشتركة (اختياري)
    shared_reputation DECIMAL(3,2), -- تقييم من مستخدمين آخرين (1-5)
    blacklist_reports INTEGER DEFAULT 0, -- عدد البلاغات ضده
    
    -- العلاقة
    first_transaction_date TIMESTAMP,
    last_transaction_date TIMESTAMP,
    relationship_months INTEGER GENERATED ALWAYS AS (
        EXTRACT(MONTH FROM age(CURRENT_TIMESTAMP, first_transaction_date))
    ) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- فهارس للبحث
    FULLTEXT(name, phone, email) -- للبحث السريع
);

-- 3. جدول الديون (Debts) - موسع
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- نوع الدين
    type VARCHAR(20) NOT NULL, -- 'lent', 'borrowed'
    status VARCHAR(20) DEFAULT 'active', -- active, paid, overdue, partially_paid, written_off
    payment_type VARCHAR(20) DEFAULT 'lump_sum', -- lump_sum, installment
    
    -- المبالغ
    amount DECIMAL(12,2) NOT NULL,
    remaining_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- التواريخ
    due_date DATE,
    agreed_date DATE DEFAULT CURRENT_DATE,
    paid_at TIMESTAMP,
    written_off_at TIMESTAMP,
    
    -- الوصف والضمانات
    description TEXT,
    collateral_type VARCHAR(50), -- 'id_card', 'invoice', 'check', 'other'
    collateral_images TEXT[], -- مصفوفة من روابط الصور
    collateral_notes TEXT,
    
    -- الأقساط (إذا كان تقسيط)
    installments_count INTEGER,
    installments_paid INTEGER DEFAULT 0,
    
    -- الإعدادات
    reminder_days INTEGER[], -- [3, 1, 0] يعني تذكير قبل 3 أيام، يوم، يوم السداد
    reminder_methods VARCHAR(20)[], -- ['app', 'whatsapp', 'sms']
    
    -- التحليلات
    expected_collection_date DATE, -- تاريخ متوقع للتحصيل (من الذكاء الاصطناعي)
    collection_probability DECIMAL(5,2), -- نسبة احتمالية التحصيل
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول الأقساط (Installments) - موسع
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    
    installment_number INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    
    -- حالة القسط
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, partially_paid
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    
    -- عقوبات التأخير
    penalty_amount DECIMAL(12,2) DEFAULT 0,
    penalty_reason TEXT,
    
    -- إشعارات
    reminders_sent INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول المدفوعات (Payments) - موسع
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES debts(id),
    installment_id UUID REFERENCES installments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- تفاصيل الدفع
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30), -- 'cash', 'bank_transfer', 'instapay', 'fawry', 'wallet'
    transaction_id VARCHAR(100), -- رقم العملية من البنك أو المحفظة
    
    -- الإيصالات
    receipt_number VARCHAR(100),
    receipt_image TEXT,
    
    -- الموقع (اختياري)
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    
    -- ملاحظات
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول سجل تقييم المخاطر (Risk History)
CREATE TABLE risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    debt_id UUID REFERENCES debts(id), -- ربط بتقييم دين معين إن وجد
    
    old_score INTEGER,
    new_score INTEGER NOT NULL,
    old_category VARCHAR(20),
    new_category VARCHAR(20) NOT NULL,
    
    change_reason TEXT, -- 'new_debt', 'payment_made', 'overdue', 'system_update'
    change_details JSONB, -- تفاصيل إضافية عن سبب التغيير
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول إشعارات (Notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    debt_id UUID REFERENCES debts(id),
    
    type VARCHAR(30) NOT NULL, -- 'due_reminder', 'overdue_alert', 'payment_received', 'risk_alert', 'achievement'
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium', -- 'high', 'medium', 'low'
    
    data JSONB, -- بيانات إضافية (مثل رابط الصفحة)
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_taken BOOLEAN DEFAULT FALSE,
    
    scheduled_for TIMESTAMP, -- موعد إرسال الإشعار
    sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول الإنجازات (Achievements)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    achievement_id VARCHAR(50) NOT NULL, -- 'gold_collector', 'zero_late', 'trusted'
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    achievement_icon TEXT,
    achievement_rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'
    
    progress INTEGER DEFAULT 0, -- نسبة التقدم 0-100
    max_progress INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول التحديات الشهرية (Monthly Challenges)
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    challenge_id VARCHAR(50) NOT NULL, -- 'collect_5000', 'no_overdue'
    challenge_name VARCHAR(100) NOT NULL,
    challenge_description TEXT,
    
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        (current_value / target_value) * 100
    ) STORED,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    reward_points INTEGER,
    reward_badge TEXT,
    
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. جدول السمعة المشتركة (Shared Reputation)
CREATE TABLE shared_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    customer_phone VARCHAR(20) NOT NULL, -- نستخدم رقم التليفون كمعرّف مشترك
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- تقييم 1-5
    review TEXT,
    
    -- نوع البلاغ (إذا كان بلاغاً)
    report_type VARCHAR(30), -- 'fraud', 'late_payer', 'good_payer', 'trusted'
    is_blacklist BOOLEAN DEFAULT FALSE, -- هل هو في القائمة السوداء
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- كل مستخدم يقدر يقيم العميل مرة واحدة فقط
    UNIQUE(reporter_user_id, customer_phone)
);

-- 11. جدول التكامل مع واتساب (WhatsApp Integration)
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    debt_id UUID REFERENCES debts(id),
    
    phone_number VARCHAR(20) NOT NULL,
    message_template VARCHAR(50), -- 'reminder', 'overdue', 'receipt', 'custom'
    message_text TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول النسخ الاحتياطي (Backups)
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    backup_type VARCHAR(20), -- 'manual', 'automatic'
    backup_size INTEGER, -- بالبايت
    file_path TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    restored_at TIMESTAMP
);

-- 13. جدول سجل النشاط (Activity Log) - مهم للتحليلات
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    
    action_type VARCHAR(50) NOT NULL, -- 'add_debt', 'add_payment', 'add_customer', 'login'
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- إنشاء الفهارس (Indexes) لتحسين الأداء
-- ============================================

-- فهارس العملاء
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_risk_category ON customers(risk_category);
CREATE INDEX idx_customers_risk_score ON customers(risk_score);

-- فهارس الديون
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_customer_id ON debts(customer_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debts_type ON debts(type);

-- فهارس المدفوعات
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- فهارس البحث النصي للعملاء
CREATE INDEX idx_customers_search ON customers USING GIN (to_tsvector('arabic', name || ' ' || phone || ' ' || COALESCE(email, '')));

-- ============================================
-- إنشاء الدوال (Functions) للعمليات المتكررة
-- ============================================

-- دالة تحديث إحصائيات العميل بعد أي عملية
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إجمالي المديونيات
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

-- Triggers
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_customer_stats_payments
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- بيانات تجريبية (Seed Data)
-- ============================================

-- إضافة مستخدم تجريبي
INSERT INTO users (id, name, email, phone, password_hash, store_name)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'حسام نسيم',
    'hossam@example.com',
    '01234567890',
    '$2a$10$YourHashedPasswordHere', -- استخدم bcrypt
    'سوبر ماركت النور'
);

-- إضافة عملاء تجريبيين
INSERT INTO customers (id, user_id, name, phone, risk_score, risk_category, first_transaction_date) VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'أحمد محمد', '01273721840', 45, 'risk', '2025-01-01'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'حسام نسيم', '01273721841', 60, 'watch', '2026-02-01');

-- إضافة ديون تجريبية
INSERT INTO debts (id, user_id, customer_id, type, amount, remaining_amount, due_date, status) VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'lent', 500, 500, '2026-02-28', 'overdue'),
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'lent', 500, 500, '2026-02-28', 'active');
