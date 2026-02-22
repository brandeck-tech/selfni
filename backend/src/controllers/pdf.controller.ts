import { Response } from 'express';
import { query } from '../database/config/connection';
import { AuthRequest } from '../middleware/auth.middleware';
import PDFDocument from 'pdfkit';

export const generatePDF = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM debts WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    const userResult = await query('SELECT username FROM users WHERE id=$1', [req.user!.id]);
    const username = userResult.rows[0]?.username || 'المستخدم';
    const debts = result.rows;
    const total_lend = debts.filter(d => d.type === 'lend' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
    const total_borrow = debts.filter(d => d.type === 'borrow' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=selfni-report.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#38bdf8').text('Selfni - Debt Report', { align: 'center' });
    doc.fontSize(14).fillColor('#666').text(`User: ${username}`, { align: 'center' });
    doc.fontSize(12).fillColor('#666').text(`Date: ${new Date().toLocaleDateString('en-EG')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).fillColor('#000').text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#16a34a').text(`Total Lent (others owe you): ${total_lend} EGP`);
    doc.fontSize(12).fillColor('#ef4444').text(`Total Borrowed (you owe): ${total_borrow} EGP`);
    doc.fontSize(12).fillColor('#38bdf8').text(`Net: ${total_lend - total_borrow} EGP`);
    doc.moveDown(2);

    // Debts Table
    doc.fontSize(16).fillColor('#000').text('Debt Details', { underline: true });
    doc.moveDown(0.5);

    debts.forEach((d, i) => {
      const color = d.type === 'lend' ? '#16a34a' : '#ef4444';
      const type = d.type === 'lend' ? 'Lent' : 'Borrowed';
      const status = d.is_paid ? 'Paid' : 'Pending';
      doc.fontSize(11).fillColor(color)
        .text(`${i + 1}. ${d.person_name} - ${type} - ${d.amount} EGP - ${status}`, { continued: false });
      if (d.description) doc.fontSize(10).fillColor('#666').text(`   Note: ${d.description}`);
      if (d.due_date) doc.fontSize(10).fillColor('#f59e0b').text(`   Due: ${new Date(d.due_date).toLocaleDateString('en-EG')}`);
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'خطأ في إنشاء PDF' });
  }
};
