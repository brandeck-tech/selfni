import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export const shareDebt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const debt = await query('SELECT d.*, u.username FROM debts d JOIN users u ON d.user_id=u.id WHERE d.id=$1 AND d.user_id=$2', [id, req.user!.id]);
    if (debt.rows.length === 0) return res.status(404).json({ status: 'error', message: 'الدين مش موجود' });

    const d = debt.rows[0];
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query('INSERT INTO debt_shares (debt_id, share_token, expires_at) VALUES ($1,$2,$3)', [id, token, expires]);

    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    const confirmUrl = `${baseUrl}/api/shares/confirm/${token}`;
    const type = d.type === 'lend' ? 'سلّفتك' : 'استلفت منك';
    const amount = parseFloat(d.amount).toFixed(2);
    const due = d.due_date ? `\nموعد السداد: ${new Date(d.due_date).toLocaleDateString('ar-EG')}` : '';
    const note = d.description ? `\nملاحظة: ${d.description}` : '';

    const msg = `💰 *سلفني — إشعار دين رسمي*\n\nأهلاً،\n*${d.username}* ${type} مبلغ *${amount} جنيه*${note}${due}\n\n✅ اضغط الرابط دا عشان تأكد الدين:\n${confirmUrl}\n\n_تم الإرسال عبر منصة سلفني_`;

    const phone = d.phone ? d.phone.replace(/[^0-9]/g, '') : null;
    const waBase = phone ? `https://wa.me/2${phone}` : 'https://wa.me';
    const whatsapp = `${waBase}?text=${encodeURIComponent(msg)}`;
    return res.json({ status: 'success', share_url: confirmUrl, whatsapp });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const viewSharedDebt = async (req: any, res: Response) => {
  const { token } = req.params;
  try {
    const share = await query(
      `SELECT ds.*, d.person_name, d.amount, d.type, d.description, d.due_date, d.is_paid, d.created_at as debt_date, u.username as lender
       FROM debt_shares ds 
       JOIN debts d ON ds.debt_id=d.id 
       JOIN users u ON d.user_id=u.id
       WHERE ds.share_token=$1 AND ds.expires_at > NOW()`,
      [token]
    );
    if (share.rows.length === 0) return res.status(404).json({ status: 'error', message: 'الرابط منتهي أو مش موجود' });
    await query('UPDATE debt_shares SET viewed=true, viewed_at=NOW() WHERE share_token=$1', [token]);
    return res.json({ status: 'success', debt: share.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const confirmDebt = async (req: any, res: Response) => {
  const { token } = req.params;
  try {
    const share = await query(
      `SELECT ds.*, d.person_name, d.amount, d.type, d.description, d.due_date, u.username as lender
       FROM debt_shares ds 
       JOIN debts d ON ds.debt_id=d.id
       JOIN users u ON d.user_id=u.id
       WHERE ds.share_token=$1 AND ds.expires_at > NOW()`,
      [token]
    );

    if (share.rows.length === 0) {
      return res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>سلفني</title><style>body{font-family:Arial;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{background:#1e293b;padding:2rem;border-radius:16px;text-align:center;max-width:400px}.icon{font-size:3rem;margin-bottom:1rem}</style></head><body><div class="box"><div class="icon">❌</div><h2>الرابط منتهي</h2><p style="color:#94a3b8">الرابط ده انتهت صلاحيته أو مش موجود</p></div></body></html>`);
    }

    const d = share.rows[0];
    const confirmed = req.query.action === 'confirm';

    if (confirmed) {
      await query('UPDATE debt_shares SET confirmed=true, confirmed_at=NOW() WHERE share_token=$1', [token]);
      return res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>سلفني — تم التأكيد</title><style>body{font-family:Arial;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{background:#1e293b;padding:2rem;border-radius:16px;text-align:center;max-width:400px;border:1px solid #16a34a}.icon{font-size:3rem;margin-bottom:1rem}.badge{background:#16a34a20;color:#16a34a;border:1px solid #16a34a;padding:.5rem 1rem;border-radius:20px;display:inline-block;margin:1rem 0}</style></head><body><div class="box"><div class="icon">✅</div><h2 style="color:#16a34a">تم التأكيد!</h2><div class="badge">موثق رسمياً</div><p style="color:#94a3b8">أكدت الدين مع <strong style="color:white">${d.lender}</strong></p><p style="color:#94a3b8">المبلغ: <strong style="color:white">${parseFloat(d.amount).toFixed(2)} جنيه</strong></p><p style="color:#475569;font-size:.8rem;margin-top:2rem">سلفني — منصة إدارة الديون</p></div></body></html>`);
    }

    const typeText = d.type === 'lend' ? `<strong style="color:white">${d.lender}</strong> سلّفك` : `أنت سلّفت <strong style="color:white">${d.lender}</strong>`;
    const dueText = d.due_date ? `<p style="color:#f59e0b">📅 موعد السداد: ${new Date(d.due_date).toLocaleDateString('ar-EG')}</p>` : '';
    const noteText = d.description ? `<p style="color:#94a3b8;font-size:.9rem">📝 ${d.description}</p>` : '';

    return res.send(`<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>سلفني — تأكيد دين</title>
  <style>
    body{font-family:Arial;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem;box-sizing:border-box}
    .box{background:#1e293b;padding:2rem;border-radius:16px;text-align:center;max-width:420px;width:100%;border:1px solid #334155}
    .logo{color:#38bdf8;font-size:1.5rem;font-weight:bold;margin-bottom:1.5rem}
    .amount{font-size:2.5rem;font-weight:800;color:${d.type === 'lend' ? '#ef4444' : '#16a34a'};margin:1rem 0}
    .btn-confirm{background:#16a34a;color:white;border:none;padding:1rem 2rem;border-radius:10px;font-size:1rem;cursor:pointer;width:100%;margin-top:1rem;font-family:Arial}
    .btn-reject{background:#ef444420;color:#ef4444;border:1px solid #ef4444;padding:.75rem 2rem;border-radius:10px;font-size:.9rem;cursor:pointer;width:100%;margin-top:.5rem;font-family:Arial}
    .divider{border:none;border-top:1px solid #334155;margin:1.5rem 0}
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">💰 سلفني</div>
    <p style="color:#94a3b8">${typeText} مبلغ</p>
    <div class="amount">${parseFloat(d.amount).toFixed(2)} جنيه</div>
    ${noteText}
    ${dueText}
    <hr class="divider">
    <p style="color:#94a3b8;font-size:.9rem">هل تأكد هذا الدين؟</p>
    <a href="?action=confirm"><button class="btn-confirm">✅ أؤكد الدين</button></a>
    <button class="btn-reject" onclick="window.close()">❌ رفض</button>
    <p style="color:#475569;font-size:.75rem;margin-top:1.5rem">سلفني — منصة إدارة الديون الموثوقة</p>
  </div>
</body>
</html>`);
  } catch (e) {
    return res.status(500).send('خطأ في السيرفر');
  }
};
