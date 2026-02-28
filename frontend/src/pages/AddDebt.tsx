import { useState } from 'react';
import { debts } from '../services/api';

export default function AddDebt({ setPage }: { setPage: (p: string) => void }) {
  const [form, setForm] = useState({ person_name: '', phone: '', amount: '', type: 'lend', description: '', due_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.person_name || !form.amount) return setError('الاسم والمبلغ مطلوبين');
    setLoading(true); setError('');
    try {
      await debts.add(form);
      setPage('home');
    } catch (e: any) {
      setError(e.response?.data?.message || 'خطأ في الإضافة');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '0.875rem', borderRadius: '12px',
    border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a',
    marginBottom: '1rem', boxSizing: 'border-box' as any,
    textAlign: 'right' as any, fontSize: '0.95rem', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px #00000010' }}>
        <button onClick={() => setPage('home')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>➕ إضافة دين جديد</h2>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center', border: '1px solid #fecaca', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Type Selector */}
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>نوع الدين</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button onClick={() => setForm({ ...form, type: 'lend' })}
            style={{ padding: '1rem', borderRadius: '14px', border: `2px solid ${form.type === 'lend' ? '#10b981' : '#e2e8f0'}`, background: form.type === 'lend' ? 'linear-gradient(135deg, #10b981, #059669)' : 'white', color: form.type === 'lend' ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, boxShadow: form.type === 'lend' ? '0 4px 12px #10b98140' : 'none', transition: 'all 0.2s' }}>
            ✋ أنا سلّفت
          </button>
          <button onClick={() => setForm({ ...form, type: 'borrow' })}
            style={{ padding: '1rem', borderRadius: '14px', border: `2px solid ${form.type === 'borrow' ? '#ef4444' : '#e2e8f0'}`, background: form.type === 'borrow' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'white', color: form.type === 'borrow' ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, boxShadow: form.type === 'borrow' ? '0 4px 12px #ef444440' : 'none', transition: 'all 0.2s' }}>
            🤲 أنا استلفت
          </button>
        </div>

        {/* Form Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.4rem' }}>اسم الشخص *</p>
          <input placeholder="مثال: أحمد محمد" value={form.person_name} onChange={e => setForm({ ...form, person_name: e.target.value })} style={inputStyle} />

          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.4rem' }}>رقم التليفون <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(اختياري)</span></p>
          <input placeholder="01012345678" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />

          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.4rem' }}>المبلغ بالجنيه *</p>
          <input placeholder="500" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 700, color: form.type === 'lend' ? '#10b981' : '#ef4444' }} />

          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.4rem' }}>وصف <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(اختياري)</span></p>
          <input placeholder="مثال: سلفة عشان الفاتورة" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />

          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.4rem' }}>تاريخ السداد <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(اختياري)</span></p>
          <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: loading ? '#e2e8f0' : form.type === 'lend' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: loading ? '#94a3b8' : 'white', fontWeight: 800, border: 'none', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', boxShadow: loading ? 'none' : '0 4px 16px #00000020' }}>
          {loading ? '⏳ جاري الإضافة...' : `✅ إضافة ${form.type === 'lend' ? 'السلفة' : 'الدين'}`}
        </button>
      </div>
    </div>
  );
}
