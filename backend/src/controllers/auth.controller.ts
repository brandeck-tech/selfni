import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/config/connection';

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'كل الحقول مطلوبة' });
  }
  try {
    const exists = await query('SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'الإيميل أو اليوزر موجود' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email',
      [username, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    return res.status(201).json({ status: 'success', token, user });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'الإيميل والباسورد مطلوبين' });
  }
  try {
    const result = await query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'الإيميل أو الباسورد غلط' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'الإيميل أو الباسورد غلط' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    return res.json({ status: 'success', token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};
