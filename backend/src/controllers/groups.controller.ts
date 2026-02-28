import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await query('SELECT * FROM groups WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]);
    for (const group of groups.rows) {
      const members = await query('SELECT * FROM group_members WHERE group_id=$1 ORDER BY round_number', [group.id]);
      group.members = members.rows;
    }
    return res.json({ status: 'success', groups: groups.rows });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  const { name, amount, members, start_date, frequency } = req.body;
  if (!name || !amount || !members || !start_date) {
    return res.status(400).json({ status: 'error', message: 'كل الحقول مطلوبة' });
  }
  try {
    const group = await query(
      'INSERT INTO groups (user_id, name, amount, total_members, start_date, frequency) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user!.id, name, amount, members.length, start_date, frequency || 'monthly']
    );
    const groupId = group.rows[0].id;
    for (let i = 0; i < members.length; i++) {
      await query(
        'INSERT INTO group_members (group_id, name, phone, round_number) VALUES ($1,$2,$3,$4)',
        [groupId, members[i].name, members[i].phone, i + 1]
      );
    }
    const allMembers = await query('SELECT * FROM group_members WHERE group_id=$1 ORDER BY round_number', [groupId]);
    return res.status(201).json({ status: 'success', group: { ...group.rows[0], members: allMembers.rows } });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const payRound = async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  try {
    const result = await query(
      'UPDATE group_members SET is_paid=true, paid_at=NOW() WHERE id=$1 RETURNING *',
      [memberId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'العضو مش موجود' });
    }
    return res.json({ status: 'success', member: result.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};
