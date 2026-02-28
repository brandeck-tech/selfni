-- ============================================
-- إصلاح هيكل جدول debts وإعادة تعريف الـ trigger
-- ============================================

-- 1. إضافة الأعمدة المفقودة إلى debts
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'lent',
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- 2. تحديث القيم للصفوف الموجودة
UPDATE debts SET remaining_amount = amount WHERE remaining_amount = 0 OR remaining_amount IS NULL;
UPDATE debts SET type = 'lent' WHERE type IS NULL;
UPDATE debts SET status = 'active' WHERE status IS NULL;

-- 3. إسقاط الـ trigger القديم والدالة
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON debts;
DROP TRIGGER IF EXISTS trigger_update_customer_stats_payments ON payments;
DROP FUNCTION IF EXISTS update_customer_stats();

-- 4. إعادة تعريف دالة التحديث بشكل آمن (بدون الاعتماد على payments)
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إحصائيات العميل فقط إذا كان customer_id موجودًا
    IF NEW.customer_id IS NOT NULL THEN
        UPDATE customers SET
            total_borrowed = COALESCE((
                SELECT SUM(amount) FROM debts 
                WHERE customer_id = NEW.customer_id AND type = 'lent'
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

-- 5. إنشاء trigger جديد على debts بعد الإدراج أو التحديث
CREATE TRIGGER trigger_update_customer_stats
AFTER INSERT OR UPDATE ON debts
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- 6. تحديث جميع العملاء مرة واحدة (لتصحيح الإحصائيات)
UPDATE customers SET
    total_borrowed = COALESCE((
        SELECT SUM(amount) FROM debts 
        WHERE customer_id = customers.id AND type = 'lent'
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

-- 7. تحديث customer_id للديون القديمة (ربطها بالعميل محمود علي id=5)
UPDATE debts SET customer_id = 5 WHERE customer_id IS NULL;

-- 8. عرض النتيجة
SELECT 
    d.id, d.amount, d.remaining_amount, d.status, d.customer_id, 
    c.name AS customer_name
FROM debts d
LEFT JOIN customers c ON d.customer_id = c.id;

SELECT '✅ تم إصلاح الجدول والـ trigger بنجاح' AS message;
