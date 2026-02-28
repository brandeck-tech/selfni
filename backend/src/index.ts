import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
import { testConnection } from './config/connection';
import authRoutes from './routes/auth.routes';
import debtsRoutes from './routes/debts.routes';
import groupsRoutes from './routes/groups.routes';
import sharesRoutes from './routes/shares.routes';
import pdfRoutes from './routes/pdf.routes';
import remindersRoutes from './routes/reminders.routes';
import paymentsRoutes from './routes/payments.routes';
import backupRoutes from './routes/backup.routes';
import riskRoutes from './routes/risk.routes';
import customersRoutes from './routes/customers.routes';
import installmentsRoutes from './routes/installments.routes';
import customerDebtsRoutes from './routes/customer-debts.routes';
const app: Application = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/customer-debts', customerDebtsRoutes);
app.use('/api/installments', installmentsRoutes);
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'success', message: 'سلفني شغال!' });
});

const start = async () => {
  await testConnection();
  app.listen(PORT, () => console.log(`سلفني على http://localhost:${PORT}`));
};

start();
