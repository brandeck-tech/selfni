import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';
import PDFDocument from 'pdfkit';
import path from 'path';

const FONT = path.join(__dirname, '../fonts/Cairo-Regular.ttf');

// عكس النص العربي عشان PDFKit
const reverseArabic = (text: string): string => {
  if (!text) return '';
  return text.split(' ').reverse().join(' ');
};

export const generatePDF = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM debts WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]);
    const userResult = await query('SELECT username, email FROM users WHERE id=$1', [req.user!.id]);
    const username = userResult.rows[0]?.username || 'User';
    const email = userResult.rows[0]?.email || '';
    const debts = result.rows;
    const total_lend = debts.filter(d => d.type === 'lend' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
    const total_borrow = debts.filter(d => d.type === 'borrow' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
    const net = total_lend - total_borrow;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.registerFont('Arabic', FONT);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=selfni-report.pdf');
    doc.pipe(res);

    doc.rect(0, 0, 595, 100).fill('#0f172a');
    doc.fontSize(28).fillColor('#38bdf8').text('SELFNI', 50, 30);
    doc.fontSize(12).fillColor('#94a3b8').text('Debt Report', 50, 65);
    doc.fontSize(11).fillColor('#64748b').text(new Date().toLocaleDateString('en-GB'), 400, 65);

    doc.roundedRect(50, 115, 495, 55, 8).fill('#f8fafc').stroke('#e2e8f0');
    doc.fontSize(12).fillColor('#0f172a').text(`Account: ${username}`, 70, 128);
    doc.fontSize(11).fillColor('#64748b').text(`Email: ${email}`, 70, 148);
    doc.fontSize(11).fillColor('#64748b').text(`Records: ${debts.length}`, 420, 138);

    const boxY = 185;
    doc.roundedRect(50, boxY, 150, 65, 8).fill('#f0fdf4').stroke('#86efac');
    doc.fontSize(10).fillColor('#16a34a').text('Total Lent', 60, boxY + 10, { width: 130, align: 'center' });
    doc.fontSize(22).fillColor('#16a34a').text(`${total_lend} EGP`, 60, boxY + 28, { width: 130, align: 'center' });

    doc.roundedRect(222, boxY, 150, 65, 8).fill('#fef2f2').stroke('#fca5a5');
    doc.fontSize(10).fillColor('#ef4444').text('Total Borrowed', 232, boxY + 10, { width: 130, align: 'center' });
    doc.fontSize(22).fillColor('#ef4444').text(`${total_borrow} EGP`, 232, boxY + 28, { width: 130, align: 'center' });

    doc.roundedRect(394, boxY, 151, 65, 8).fill(net >= 0 ? '#eff6ff' : '#fff7ed').stroke(net >= 0 ? '#93c5fd' : '#fdba74');
    doc.fontSize(10).fillColor(net >= 0 ? '#2563eb' : '#ea580c').text('Net Balance', 404, boxY + 10, { width: 131, align: 'center' });
    doc.fontSize(22).fillColor(net >= 0 ? '#2563eb' : '#ea580c').text(`${net} EGP`, 404, boxY + 28, { width: 131, align: 'center' });

    const tableY = 270;
    doc.rect(50, tableY, 495, 26).fill('#0f172a');
    doc.fontSize(10).fillColor('white');
    doc.text('Person', 60, tableY + 8);
    doc.text('Type', 200, tableY + 8);
    doc.text('Amount', 300, tableY + 8);
    doc.text('Status', 390, tableY + 8);
    doc.text('Due', 470, tableY + 8);

    let y = tableY + 26;
    debts.forEach((d, i) => {
      if (y > 750) { doc.addPage(); y = 50; }
      doc.rect(50, y, 495, 28).fill(i % 2 === 0 ? '#ffffff' : '#f8fafc').stroke('#e2e8f0');
      doc.fontSize(10);
      doc.font('Arabic').fillColor('#0f172a').text(reverseArabic(d.person_name), 60, y + 9, { width: 130 });
      doc.font('Helvetica').fillColor(d.type === 'lend' ? '#16a34a' : '#ef4444').text(d.type === 'lend' ? 'Lent' : 'Borrowed', 200, y + 9);
      doc.fillColor('#0f172a').text(`${parseFloat(d.amount).toFixed(0)} EGP`, 300, y + 9);
      doc.fillColor(d.is_paid ? '#16a34a' : '#f59e0b').text(d.is_paid ? 'Paid' : 'Pending', 390, y + 9);
      doc.fillColor('#64748b').text(d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : '-', 470, y + 9);
      y += 28;
    });

    doc.rect(0, 810, 595, 32).fill('#0f172a');
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Selfni — Debt Management Platform', 50, 820, { align: 'center' });
    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'خطأ في PDF' });
  }
};

export const generateDebtReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const debtResult = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (debtResult.rows.length === 0) return res.status(404).json({ status: 'error', message: 'الدين مش موجود' });

    const userResult = await query('SELECT username FROM users WHERE id=$1', [req.user!.id]);
    const d = debtResult.rows[0];
    const username = userResult.rows[0]?.username || 'User';
    const receiptNo = `SLF-${String(d.id).padStart(5, '0')}`;
    const businessName = (req.query.business as string) || 'Selfni';
    const businessPhone = (req.query.phone as string) || '';
    const businessAddress = (req.query.address as string) || '';
    const logoData = (req.query.logo as string) || '';

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.registerFont('Arabic', FONT);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=receipt-${receiptNo}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 595, 120).fill('#0f172a');
    // Logo or business name
    if (logoData && logoData.startsWith('data:image')) {
      try {
        const base64 = logoData.split(',')[1];
        const imgBuffer = Buffer.from(base64, 'base64');
        doc.image(imgBuffer, 50, 15, { width: 80, height: 80 });
      } catch(e) {
        doc.font('Helvetica-Bold').fontSize(30).fillColor('#38bdf8').text(businessName, 50, 22);
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(30).fillColor('#38bdf8').text(businessName, 50, 22);
    }
    doc.font('Helvetica').fontSize(13).fillColor('#94a3b8').text('Official Debt Receipt', 150, 55);
    if (businessPhone) doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Tel: ${businessPhone}`, 150, 72);
    if (businessAddress) doc.font('Helvetica').fontSize(10).fillColor('#475569').text(businessAddress, 150, 85);
    doc.fontSize(11).fillColor('#475569').text(`Receipt No: ${receiptNo}`, 350, 28);
    doc.fontSize(11).fillColor('#475569').text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 350, 48);

    // Status
    doc.roundedRect(350, 72, 120, 26, 13).fill(d.is_paid ? '#16a34a' : '#f59e0b');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
      .text(d.is_paid ? 'PAID ✓' : 'PENDING', 350, 80, { width: 120, align: 'center' });

    // Amount box
    doc.roundedRect(50, 138, 495, 90, 10)
      .fill(d.type === 'lend' ? '#f0fdf4' : '#fef2f2')
      .stroke(d.type === 'lend' ? '#86efac' : '#fca5a5');
    doc.font('Helvetica').fontSize(13).fillColor('#64748b')
      .text(d.type === 'lend' ? 'AMOUNT LENT TO' : 'AMOUNT BORROWED FROM', 50, 152, { align: 'center', width: 495 });
    doc.font('Arabic').fontSize(16).fillColor('#64748b')
      .text(reverseArabic(d.person_name), 50, 172, { align: 'center', width: 495 });
    doc.font('Helvetica-Bold').fontSize(36).fillColor(d.type === 'lend' ? '#16a34a' : '#ef4444')
      .text(`${parseFloat(d.amount).toFixed(2)} EGP`, 50, 192, { align: 'center', width: 495 });

    // Details
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text('TRANSACTION DETAILS', 50, 248);
    doc.rect(50, 265, 495, 1).fill('#e2e8f0');

    const details: [string, string][] = [
      ['Person', d.person_name],
      ['Type', d.type === 'lend' ? 'Lent (they owe you)' : 'Borrowed (you owe them)'],
      ['Amount', `${parseFloat(d.amount).toFixed(2)} EGP`],
      ['Created', new Date(d.created_at).toLocaleDateString('en-GB')],
      ['Due Date', d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : 'Not specified'],
      ['Status', d.is_paid ? 'Paid' : 'Pending payment'],
      ['Note', d.description || 'No notes'],
      ['Issued by', username],
    ];

    let dy = 266;
    details.forEach(([label, value], i) => {
      doc.rect(50, dy, 495, 28).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(label, 65, dy + 9, { width: 150 });
      // اسم الشخص والملاحظة بالخط العربي
      if (label === 'Person' || label === 'Note' || label === 'Issued by') {
        doc.font('Arabic').fontSize(10).fillColor('#0f172a').text(value, 220, dy + 9, { width: 300 });
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(value, 220, dy + 9, { width: 300 });
      }
      dy += 28;
    });

    doc.rect(50, dy + 8, 495, 1).fill('#e2e8f0');
    doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
      .text(`This is an official receipt from Selfni platform. Receipt: ${receiptNo}`, 50, dy + 18, { align: 'center', width: 495 });

    doc.rect(0, 810, 595, 32).fill('#0f172a');
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Selfni — Debt Management Platform', 50, 820, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Receipt error:', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'خطأ في الإيصال' });
  }
};

export const generateHTMLReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const debtResult = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (debtResult.rows.length === 0) return res.status(404).send('مش موجود');

    const userResult = await query('SELECT username FROM users WHERE id=$1', [req.user!.id]);
    const d = debtResult.rows[0];
    const username = userResult.rows[0]?.username || 'مستخدم';
    const receiptNo = `SLF-${String(d.id).padStart(5, '0')}`;
    const businessName = (req.query.business as string) || 'سلفني';
    const businessPhone = (req.query.phone as string) || '';
    const businessAddress = (req.query.address as string) || '';
    const logoData = (req.query.logo as string) || '';
    const isPaid = d.is_paid;
    const isLend = d.type === 'lend';
    const amount = parseFloat(d.amount).toFixed(2);
    const color = isLend ? '#16a34a' : '#ef4444';
    const dueDate = d.due_date ? new Date(d.due_date).toLocaleDateString('ar-EG') : 'غير محدد';
    const createdDate = new Date(d.created_at).toLocaleDateString('ar-EG');
    const today = new Date().toLocaleDateString('ar-EG');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>إيصال ${receiptNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; direction: rtl; }
  .page { max-width: 500px; margin: 0 auto; background: white; min-height: 100vh; }
  .header { background: #0f172a; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .logo-area { display: flex; align-items: center; gap: 0.75rem; }
  .logo-img { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; }
  .logo-text { color: #38bdf8; font-size: 1.5rem; font-weight: 900; }
  .logo-sub { color: #64748b; font-size: 0.75rem; }
  .receipt-info { text-align: left; }
  .receipt-no { color: #94a3b8; font-size: 0.75rem; }
  .receipt-date { color: #64748b; font-size: 0.75rem; }
  .status-badge { padding: 0.5rem 1.5rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem; margin: 1rem auto; display: block; width: fit-content; }
  .amount-box { margin: 1rem; padding: 1.5rem; border-radius: 16px; text-align: center; }
  .amount-label { font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem; }
  .amount-person { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .amount-value { font-size: 2.5rem; font-weight: 900; }
  .details { margin: 0 1rem; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
  .detail-row:last-child { border-bottom: none; }
  .detail-row:nth-child(even) { background: #f8fafc; }
  .detail-label { color: #64748b; font-size: 0.85rem; }
  .detail-value { color: #1e293b; font-size: 0.85rem; font-weight: 600; max-width: 60%; text-align: left; }
  .footer { margin: 1.5rem 1rem; padding: 1rem; background: #f8fafc; border-radius: 10px; text-align: center; }
  .footer p { color: #94a3b8; font-size: 0.75rem; line-height: 1.6; }
  .print-btn { display: block; margin: 1rem; padding: 0.875rem; background: #0f172a; color: white; text-align: center; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; border: none; width: calc(100% - 2rem); }
  .business-info { color: #94a3b8; font-size: 0.7rem; }
  @media print { .print-btn { display: none; } body { background: white; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-area">
      ${logoData && logoData.startsWith('data:image') ? `<img src="${logoData}" class="logo-img">` : ''}
      <div>
        <div class="logo-text">${businessName}</div>
        ${businessPhone ? `<div class="business-info">📞 ${businessPhone}</div>` : ''}
        ${businessAddress ? `<div class="business-info">📍 ${businessAddress}</div>` : ''}
      </div>
    </div>
    <div class="receipt-info">
      <div class="receipt-no">${receiptNo}</div>
      <div class="receipt-date">${today}</div>
    </div>
  </div>

  <div style="text-align:center; padding: 0.75rem;">
    <span class="status-badge" style="background:${isPaid ? '#dcfce7' : '#fef9c3'}; color:${isPaid ? '#16a34a' : '#ca8a04'};">
      ${isPaid ? '✅ مدفوع' : '⏳ منتظر السداد'}
    </span>
  </div>

  <div class="amount-box" style="background:${isLend ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${color}20;">
    <div class="amount-label">${isLend ? 'سلّفت لـ' : 'استلفت من'}</div>
    <div class="amount-person" style="color:${color};">${d.person_name}</div>
    <div class="amount-value" style="color:${color};">${amount} جنيه</div>
  </div>

  <div class="details">
    <div class="detail-row">
      <span class="detail-label">رقم الإيصال</span>
      <span class="detail-value">${receiptNo}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الشخص</span>
      <span class="detail-value">${d.person_name}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">نوع المعاملة</span>
      <span class="detail-value" style="color:${color};">${isLend ? 'سلّفت (مديون لك)' : 'استلفت (أنت مديون)'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">المبلغ</span>
      <span class="detail-value" style="color:${color}; font-size:1rem;">${amount} جنيه</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">تاريخ التسجيل</span>
      <span class="detail-value">${createdDate}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">موعد السداد</span>
      <span class="detail-value">${dueDate}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الحالة</span>
      <span class="detail-value" style="color:${isPaid ? '#16a34a' : '#f59e0b'};">${isPaid ? 'مدفوع ✓' : 'منتظر ⏳'}</span>
    </div>
    ${d.description ? `<div class="detail-row"><span class="detail-label">ملاحظة</span><span class="detail-value">${d.description}</span></div>` : ''}
    <div class="detail-row">
      <span class="detail-label">صادر بواسطة</span>
      <span class="detail-value">${username}</span>
    </div>
  </div>

  <div class="footer">
    <p>هذا الإيصال وثيقة رسمية صادرة من ${businessName}</p>
    <p style="margin-top:0.3rem; color:#cbd5e1;">سلفني — منصة إدارة الديون | ${receiptNo}</p>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('HTML Receipt error:', err);
    res.status(500).send('خطأ في إنشاء الإيصال');
  }
};
