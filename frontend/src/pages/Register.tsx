import { useState } from 'react';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) return setError('كل الحقول مطلوبة');
    setLoading(true); setError('');
    try {
      const res = await auth.register(form);
      login(res.data.token, res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' as any, textAlign: 'right' as any };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', direction: 'rtl', padding: '1.5rem' }}>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 70, height: 70, borderRadius: '20px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.75rem', boxShadow: '0 0 30px #38bdf830' }}>
          💰
        </div>
        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.25rem' }}>سلفني</h1>
        <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>حساب جديد</p>
      </div>

      <div style={{ width: '100%', maxWidth: 400, background: '#1e293b', borderRadius: '20px', padding: '1.75rem', border: '1px solid #334155' }}>
        <h2 style={{ color: 'white', margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>✨ إنشاء حساب جديد</h2>

        {error && (
          <div style={{ background: '#ef444420', color: '#ef4444', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem', border: '1px solid #ef444430' }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>الاسم</p>
        <input placeholder="مثال: حسام" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ ...inputStyle, marginBottom: '1rem' }} />

        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>البريد الإلكتروني</p>
        <input placeholder="example@email.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, marginBottom: '1rem' }} />

        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>كلمة المرور</p>
        <input placeholder="••••••••" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, marginBottom: '1.5rem' }} />

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: loading ? '#334155' : 'linear-gradient(135deg, #38bdf8, #818cf8)', color: loading ? '#64748b' : '#0f172a', fontWeight: 800, border: 'none', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ جاري التسجيل...' : '✅ إنشاء الحساب'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <span style={{ color: '#475569', fontSize: '0.85rem' }}>عندك حساب؟ </span>
          <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
            سجّل دخول
          </button>
        </div>
      </div>
    </div>
  );
}
