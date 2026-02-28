import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

const calcRisk = (debts: any[]): { score: number; label: string; color: string; emoji: string } => {
  if (debts.length === 0) return { score: 0, label: 'جديد', color: '#6366f1', emoji: '🆕' };
  const total = debts.length;
  const paid = debts.filter(d => d.is_paid).length;
  const overdue = debts.filter(d => !d.is_paid && d.due_date && new Date(d.due_date) < new Date()).length;
  const latePayments = debts.filter(d => d.is_paid && d.paid_at && d.due_date && new Date(d.paid_at) > new Date(d.due_date)).length;
  const payRate = total > 0 ? (paid / total) * 100 : 0;
  const overdueRate = total > 0 ? (overdue / total) * 100 : 0;

  let score = 100;
  score -= overdueRate * 1.5;
  score -= latePayments * 10;
  score += payRate * 0.3;
  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score: Math.round(score), label: 'ملتزم ممتاز', color: '#10b981', emoji: '🟢' };
  if (score >= 60) return { score: Math.round(score), label: 'جيد', color: '#6366f1', emoji: '🔵' };
  if (score >= 40) return { score: Math.round(score), label: 'متأخر أحياناً', color: '#f59e0b', emoji: '🟡' };
  if (score >= 20) return { score: Math.round(score), label: 'مخاطرة عالية', color: '#ef4444', emoji: '🔴' };
  return { score: Math.round(score), label: 'خطر جداً', color: '#7f1d1d', emoji: '⛔' };
};

export const getClientsRisk = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM debts WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]);
    const all = result.rows;

    const map: Record<string, any[]> = {};
    all.forEach(d => {
      if (!map[d.person_name]) map[d.person_name] = [];
      map[d.person_name].push(d);
    });

    const clients = Object.entries(map).map(([name, debts]) => {
      const risk = calcRisk(debts);
      const totalAmount = debts.filter(d => d.type === 'lend').reduce((s, d) => s + parseFloat(d.amount), 0);
      const paidAmount = debts.filter(d => d.type === 'lend' && d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
      const phone = debts.find(d => d.phone)?.phone || '';
      const lastDebt = debts[0];
      return { name, phone, risk, totalAmount, paidAmount, remaining: totalAmount - paidAmount, debtCount: debts.length, lastDebtId: lastDebt?.id };
    });

    clients.sort((a, b) => a.risk.score - b.risk.score);
    return res.json({ status: 'success', clients });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};
