
export const formatAmount = (amount: number | string): string =>
  new Intl.NumberFormat('ar-DZ').format(Number(amount)) + ' دج';

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('ar-DZ');

export const isOverdue = (dueDate: string, isPaid: boolean): boolean =>
  !isPaid && !!dueDate && new Date(dueDate) < new Date();

export const getRiskInfo = (score: number) => {
  if (score >= 80) return { label: 'ممتاز', color: '#10b981', bg: '#d1fae5', emoji: 'A+' };
  if (score >= 60) return { label: 'جيد', color: '#3b82f6', bg: '#dbeafe', emoji: 'B' };
  if (score >= 40) return { label: 'متوسط', color: '#f59e0b', bg: '#fef3c7', emoji: 'C' };
  if (score >= 20) return { label: 'ضعيف', color: '#ef4444', bg: '#fee2e2', emoji: 'D' };
  return { label: 'خطر', color: '#7f1d1d', bg: '#fee2e2', emoji: 'F' };
};

export const generateWhatsAppMsg = (name: string, amount: number, dueDate?: string): string => {
  let msg = 'السلام عليكم ' + name + ',
تذكير بدين: ' + amount + ' دج';
  if (dueDate) msg += '
الموعد: ' + new Date(dueDate).toLocaleDateString('ar-DZ');
  return msg + '
شكرا';
};
