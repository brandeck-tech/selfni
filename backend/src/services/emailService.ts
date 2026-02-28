import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: '"سلفني" <noreply@selfni.com>',
    to,
    subject: 'تفعيل البريد الإلكتروني',
    html: `
      <h2>مرحباً بك في سلفني</h2>
      <p>يرجى النقر على الرابط التالي لتفعيل بريدك الإلكتروني:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>هذا الرابط صالح لمدة 24 ساعة.</p>
    `,
  });
};
