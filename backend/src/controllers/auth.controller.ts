import { Request, Response } from 'express';
import pool from '../config/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ field: 'email', message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ field: 'phone', message: 'رقم الهاتف مستخدم بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, phone, verification_token, verification_expires, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, name, email, phone`,
      [name, email, hashedPassword, phone, verificationToken, verificationExpires]
    );

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'تم التسجيل بنجاح. يرجى تفعيل بريدك الإلكتروني',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({ message: 'حدث خطأ داخلي' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ field: 'email', message: 'البريد الإلكتروني غير مسجل' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ field: 'password', message: 'كلمة المرور غير صحيحة' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ field: 'email', message: 'البريد الإلكتروني غير مفعل' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1d' });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ داخلي' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE verification_token = $1 AND verification_expires > NOW() AND is_verified = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'الرمز غير صالح أو منتهي الصلاحية' });
    }

    await pool.query(
      `UPDATE users SET is_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1`,
      [result.rows[0].id]
    );

    res.json({ message: 'تم تفعيل البريد الإلكتروني بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء التفعيل' });
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.query;
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  res.json({ exists: result.rows.length > 0 });
};

export const checkPhone = async (req: Request, res: Response) => {
  const { phone } = req.query;
  const result = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
  res.json({ exists: result.rows.length > 0 });
};
