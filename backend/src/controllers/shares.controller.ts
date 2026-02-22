import { Response } from 'express';
import { query } from '../database/config/connection';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export const shareDebt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const debt = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (debt.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'الدين مش موجود' });
    }
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO debt_shares (debt_id, share_token, expires_at) VALUES ($1,$2,$3)',
      [id, token, expires]
    );
    const shareUrl = `http://localhost:4000/api/shares/${token}`;
    const whatsappMsg = `https://wa.me/?text=شوف الدين ده: ${encodeURIComponent(shareUrl)}`;
    return res.json({ status: 'success', share_url: shareUrl, whatsapp: whatsappMsg });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const viewSharedDebt = async (req: any, res: Response) => {
  const { token } = req.params;
  try {
    const share = await query(
      'SELECT ds.*, d.person_name, d.amount, d.type, d.description, d.due_date, d.is_paid FROM debt_shares ds JOIN debts d ON ds.debt_id=d.id WHERE ds.share_token=$1 AND ds.expires_at > NOW()',
      [token]
    );
    if (share.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'الرابط منتهي أو مش موجود' });
    }
    await query('UPDATE debt_shares SET viewed=true, viewed_at=NOW() WHERE share_token=$1', [token]);
    return res.json({ status: 'success', debt: share.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};
