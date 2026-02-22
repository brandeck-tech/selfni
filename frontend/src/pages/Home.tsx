import { useState, useEffect } from 'react';
import { debts, downloadPDF } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home({ setPage }: { setPage: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>({ debts: [], summary: { total_lend: 0, total_borrow: 0, net: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDebts(); }, []);

  const loadDebts = async () => {
    try {
      const res = await debts.getAll();
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  const handlePay = async (id: number) => {
    await debts.markPaid(id);
    loadDebts();
  };

  const handleDelete = async (id: number) => {
    await debts.delete(id);
    loadDebts();
  };

  const handlePDF = async () => { await downloadPDF(); };
  const handleShare = async (id: number) => {
    const res = await debts.share(id);
    window.open(res.data.whatsapp, '_blank');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', fontFamily:'Arial', direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:'#1e293b', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'#38bdf8', margin:0 }}>💰 سلفني</h2>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ color:'#94a3b8' }}>أهلاً {user?.username}</span>
          <button onClick={logout} style={{ background:'#ef444420', color:'#ef4444', border:'none', padding:'0.4rem 0.8rem', borderRadius:'8px', cursor:'pointer' }}>خروج</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
        <div style={{ background:'#16a34a20', border:'1px solid #16a34a', borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
          <p style={{ color:'#94a3b8', margin:'0 0 0.5rem' }}>ليك</p>
          <p style={{ color:'#16a34a', fontSize:'1.5rem', fontWeight:'bold', margin:0 }}>{data.summary.total_lend} ج</p>
        </div>
        <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
          <p style={{ color:'#94a3b8', margin:'0 0 0.5rem' }}>عليك</p>
          <p style={{ color:'#ef4444', fontSize:'1.5rem', fontWeight:'bold', margin:0 }}>{data.summary.total_borrow} ج</p>
        </div>
        <div style={{ background:'#38bdf820', border:'1px solid #38bdf8', borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
          <p style={{ color:'#94a3b8', margin:'0 0 0.5rem' }}>الصافي</p>
          <p style={{ color:'#38bdf8', fontSize:'1.5rem', fontWeight:'bold', margin:0 }}>{data.summary.net} ج</p>
        </div>
      </div>

      {/* Debts List */}
      <div style={{ padding:'0 1.5rem' }}>
        {loading ? <p style={{ color:'#94a3b8', textAlign:'center' }}>جاري التحميل...</p> :
          data.debts.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>مفيش ديون دلوقتي 🎉</p> :
          data.debts.map((d: any) => (
            <div key={d.id} style={{ background:'#1e293b', borderRadius:'12px', padding:'1rem', marginBottom:'1rem', borderRight:`4px solid ${d.type === 'lend' ? '#16a34a' : '#ef4444'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ color:'white', fontWeight:'bold', margin:'0 0 0.25rem' }}>{d.person_name}</p>
                  <p style={{ color:'#94a3b8', margin:'0 0 0.25rem', fontSize:'0.875rem' }}>{d.description}</p>
                  {d.due_date && <p style={{ color:'#f59e0b', margin:0, fontSize:'0.8rem' }}>📅 {new Date(d.due_date).toLocaleDateString('ar-EG')}</p>}
                </div>
                <div style={{ textAlign:'left' }}>
                  <p style={{ color: d.type === 'lend' ? '#16a34a' : '#ef4444', fontWeight:'bold', fontSize:'1.2rem', margin:'0 0 0.5rem' }}>
                    {d.type === 'lend' ? '+' : '-'}{d.amount} ج
                  </p>
                  <span style={{ background: d.is_paid ? '#16a34a20' : '#f59e0b20', color: d.is_paid ? '#16a34a' : '#f59e0b', padding:'0.2rem 0.5rem', borderRadius:'6px', fontSize:'0.75rem' }}>
                    {d.is_paid ? '✅ مدفوع' : '⏳ منتظر'}
                  </span>
                </div>
              </div>
              {!d.is_paid && (
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem' }}>
                  <button onClick={() => handlePay(d.id)} style={{ flex:1, padding:'0.5rem', borderRadius:'8px', background:'#16a34a20', color:'#16a34a', border:'1px solid #16a34a', cursor:'pointer' }}>✅ تم السداد</button>
                  <button onClick={() => handleShare(d.id)} style={{ flex:1, padding:'0.5rem', borderRadius:'8px', background:'#25d36620', color:'#25d366', border:'1px solid #25d366', cursor:'pointer' }}>📤 واتساب</button>
                  <button onClick={() => handleDelete(d.id)} style={{ padding:'0.5rem 0.75rem', borderRadius:'8px', background:'#ef444420', color:'#ef4444', border:'1px solid #ef4444', cursor:'pointer' }}>🗑</button>
                </div>
              )}
            </div>
          ))
        }
      </div>

      {/* Bottom Nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#1e293b', display:'flex', borderTop:'1px solid #334155' }}>
        {[['🏠','الرئيسية','home'],['➕','دين جديد','add'],['👥','جمعيات','groups']].map(([icon, label, page]) => (
          <button key={page} onClick={() => setPage(page)}
            style={{ flex:1, padding:'0.75rem', background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.8rem' }}>
            <div style={{ fontSize:'1.2rem' }}>{icon}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
// PDF button added via direct edit
// PDF button added via direct edit
