-- ============================================
-- بيانات تجريبية لتطبيق سلفني
-- ============================================

-- 1. مستخدم تجريبي (إذا لم يكن موجوداً)
INSERT INTO users (name, email, phone, password_hash, store_name, created_at)
SELECT 'حسام', 'hossam@example.com', '01273721840', '$2a$10$dummyhash', 'سوبر ماركت النور', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hossam@example.com');

-- 2. عملاء تجريبيون
INSERT INTO customers (user_id, name, phone, email, address, notes, risk_score, risk_category, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'hossam@example.com'),
    name, phone, email, address, notes, risk_score, risk_category, NOW()
FROM (VALUES 
    ('أحمد محمد', '01234567890', 'ahmed@example.com', 'القاهرة', 'عميل دائم', 45, 'risk'),
    ('محمود علي', '01234567891', 'mahmoud@example.com', 'الجيزة', 'صاحب محل', 85, 'excellent'),
    ('فاطمة حسن', '01234567892', 'fatma@example.com', 'الإسكندرية', 'موظفة', 70, 'good'),
    ('خالد إبراهيم', '01234567893', 'khaled@example.com', 'القاهرة', 'عميل جديد', 60, 'watch')
) AS t(name, phone, email, address, notes, risk_score, risk_category)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE phone = t.phone);

-- 3. ديون تجريبية
DO $$
DECLARE
    v_user_id INTEGER;
    v_customer_ahmed INTEGER;
    v_customer_mahmoud INTEGER;
    v_customer_fatma INTEGER;
    v_customer_khaled INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'hossam@example.com';
    SELECT id INTO v_customer_ahmed FROM customers WHERE phone = '01234567890';
    SELECT id INTO v_customer_mahmoud FROM customers WHERE phone = '01234567891';
    SELECT id INTO v_customer_fatma FROM customers WHERE phone = '01234567892';
    SELECT id INTO v_customer_khaled FROM customers WHERE phone = '01234567893';

    -- دين لأحمد (متأخر)
    INSERT INTO debts (user_id, customer_id, type, amount, remaining_amount, description, due_date, status, created_at)
    VALUES (v_user_id, v_customer_ahmed, 'lend', 500, 500, 'سلفة فاتورة كهرباء', CURRENT_DATE - 5, 'overdue', NOW() - INTERVAL '10 days');

    -- دين لمحمود (نشط)
    INSERT INTO debts (user_id, customer_id, type, amount, remaining_amount, description, due_date, status, created_at)
    VALUES (v_user_id, v_customer_mahmoud, 'lend', 300, 300, 'سلفة خضار', CURRENT_DATE + 3, 'active', NOW() - INTERVAL '5 days');

    -- دين لفاطمة (مسدد)
    INSERT INTO debts (user_id, customer_id, type, amount, remaining_amount, description, due_date, status, paid_at, created_at)
    VALUES (v_user_id, v_customer_fatma, 'lend', 200, 0, 'سلفة نقدية', CURRENT_DATE - 10, 'paid', NOW() - INTERVAL '2 days', NOW() - INTERVAL '15 days');

    -- دين لخالد (تقسيط)
    INSERT INTO debts (user_id, customer_id, type, amount, remaining_amount, description, due_date, status, payment_type, installments_count, created_at)
    VALUES (v_user_id, v_customer_khaled, 'lend', 1500, 1500, 'سلفة أجهزة كهربائية', CURRENT_DATE + 30, 'active', 'installment', 3, NOW() - INTERVAL '2 days');
END $$;

-- 4. أقساط للدين الأخير
DO $$
DECLARE
    v_debt_id INTEGER;
BEGIN
    SELECT id INTO v_debt_id FROM debts WHERE description = 'سلفة أجهزة كهربائية' LIMIT 1;
    IF v_debt_id IS NOT NULL THEN
        INSERT INTO installments (debt_id, installment_number, amount, due_date, status)
        VALUES 
            (v_debt_id, 1, 500, CURRENT_DATE + 10, 'pending'),
            (v_debt_id, 2, 500, CURRENT_DATE + 20, 'pending'),
            (v_debt_id, 3, 500, CURRENT_DATE + 30, 'pending');
    END IF;
END $$;

-- 5. مدفوعات للدين المسدد
DO $$
DECLARE
    v_debt_id INTEGER;
    v_user_id INTEGER;
    v_customer_id INTEGER;
BEGIN
    SELECT id, user_id, customer_id INTO v_debt_id, v_user_id, v_customer_id FROM debts WHERE description = 'سلفة نقدية' LIMIT 1;
    IF v_debt_id IS NOT NULL THEN
        INSERT INTO payments (debt_id, user_id, customer_id, amount, payment_method, notes, payment_date)
        VALUES (v_debt_id, v_user_id, v_customer_id, 200, 'كاش', 'تم السداد كاملاً', NOW() - INTERVAL '2 days');
    END IF;
END $$;

-- 6. سجل مخاطر للعملاء
INSERT INTO risk_history (customer_id, new_score, new_category, change_reason)
SELECT id, risk_score, risk_category, 'initial_seed'
FROM customers
WHERE NOT EXISTS (SELECT 1 FROM risk_history WHERE customer_id = customers.id);

-- 7. إشعارات تجريبية
DO $$
DECLARE
    v_user_id INTEGER;
    v_customer_ahmed INTEGER;
    v_debt_ahmed INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'hossam@example.com';
    SELECT id INTO v_customer_ahmed FROM customers WHERE phone = '01234567890';
    SELECT id INTO v_debt_ahmed FROM debts WHERE description LIKE '%كهرباء%' LIMIT 1;

    INSERT INTO notifications (user_id, customer_id, debt_id, type, title, body, created_at)
    VALUES 
        (v_user_id, v_customer_ahmed, v_debt_ahmed, 'overdue', 'دين متأخر', 'أحمد محمد متأخر في سداد 500 جنيه منذ 5 أيام', NOW()),
        (v_user_id, NULL, NULL, 'achievement', 'إنجاز جديد', 'لقد حققت إنجاز "المحصل الذهبي"!', NOW());
END $$;

-- 8. إنجاز تجريبي للمستخدم
INSERT INTO achievements (user_id, achievement_id, achievement_name, progress, is_completed, completed_at)
SELECT id, 'first_debt', 'أول دين', 100, TRUE, NOW()
FROM users WHERE email = 'hossam@example.com'
ON CONFLICT DO NOTHING;

SELECT '✅ تم إدخال البيانات التجريبية بنجاح' AS message;
