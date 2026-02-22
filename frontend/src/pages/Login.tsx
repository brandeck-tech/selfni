import { useState } from 'react';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await auth.login(form);
      login(res.data.token, res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial' }}>
      <div style={{ background:'#1e293b', padding:'2rem', borderRadius:'16px', width:'90%', maxWidth:'400px' }}>
        <h1 style={{ color:'#38bdf8', textAlign:'center', marginBottom:'0.5rem' }}>💰 سلفني</h1>
        <p style={{ color:'#94a3b8', textAlign:'center', marginBottom:'2rem' }}>تسجيل الدخول</p>
        {error && <div style={{ background:'#ef444420', color:'#ef4444', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', textAlign:'center' }}>{error}</div>}
        <input
          placeholder="الإيميل"
          type="email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'white', marginBottom:'1rem', boxSizing:'border-box', textAlign:'right' }}
        />
        <input
          placeholder="كلمة السر"
          type="password"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'white', marginBottom:'1.5rem', boxSizing:'border-box', textAlign:'right' }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', background:'#38bdf8', color:'#0f172a', fontWeight:'bold', border:'none', fontSize:'1rem', cursor:'pointer' }}
        >{loading ? 'جاري الدخول...' : 'دخول'}</button>
        <p style={{ color:'#94a3b8', textAlign:'center', marginTop:'1rem' }}>
          مش عندك حساب؟{' '}
          <span onClick={onSwitch} style={{ color:'#38bdf8', cursor:'pointer' }}>سجل دلوقتي</span>
        </p>
      </div>
    </div>
  );
}
