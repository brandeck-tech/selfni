import { useState } from 'react';
import { debts } from '../services/api';

export default function AddDebt({ setPage }: { setPage: (p: string) => void }) {
  const [form, setForm] = useState({ person_name: '', amount: '', type: 'lend', description: '', due_date: '' });
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

  const inputStyle = { width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'white', marginBottom:'1rem', boxSizing:'border-box' as any, textAlign:'right' as any, fontSize:'1rem' };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', fontFamily:'Arial', direction:'rtl' }}>
      <div style={{ background:'#1e293b', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <button onClick={() => setPage('home')} style={{ background:'none', border:'none', color:'#38bdf8', fontSize:'1.2rem', cursor:'pointer' }}>→</button>
        <h2 style={{ color:'white', margin:0 }}>إضافة دين جديد</h2>
      </div>

      <div style={{ padding:'1.5rem' }}>
        {error && <div style={{ background:'#ef444420', color:'#ef4444', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', textAlign:'center' }}>{error}</div>}

        {/* نوع الدين */}
        <p style={{ color:'#94a3b8', marginBottom:'0.5rem' }}>نوع الدين</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
          <button onClick={() => setForm({...form, type:'lend'})}
            style={{ padding:'1rem', borderRadius:'8px', border:`2px solid ${form.type === 'lend' ? '#16a34a' : '#334155'}`, background: form.type === 'lend' ? '#16a34a20' : 'transparent', color: form.type === 'lend' ? '#16a34a' : '#94a3b8', cursor:'pointer', fontSize:'1rem' }}>
            ✋ أنا سلفت
          </button>
          <button onClick={() => setForm({...form, type:'borrow'})}
            style={{ padding:'1rem', borderRadius:'8px', border:`2px solid ${form.type === 'borrow' ? '#ef4444' : '#334155'}`, background: form.type === 'borrow' ? '#ef444420' : 'transparent', color: form.type === 'borrow' ? '#ef4444' : '#94a3b8', cursor:'pointer', fontSize:'1rem' }}>
            🤲 أنا استلفت
          </button>
        </div>

        <input placeholder="اسم الشخص" value={form.person_name} onChange={e => setForm({...form, person_name: e.target.value})} style={inputStyle} />
        <input placeholder="المبلغ بالجنيه" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={inputStyle} />
        <input placeholder="وصف (اختياري)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} />
        <p style={{ color:'#94a3b8', marginBottom:'0.5rem' }}>تاريخ السداد (اختياري)</p>
        <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} style={inputStyle} />

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'1rem', borderRadius:'8px', background:'#38bdf8', color:'#0f172a', fontWeight:'bold', border:'none', fontSize:'1rem', cursor:'pointer', marginTop:'1rem' }}>
          {loading ? 'جاري الإضافة...' : '✅ إضافة الدين'}
        </button>
      </div>
    </div>
  );
}
