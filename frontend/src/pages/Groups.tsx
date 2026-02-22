import { useState, useEffect } from 'react';
import { groups } from '../services/api';

export default function Groups({ setPage }: { setPage: (p: string) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', start_date: '', frequency: 'monthly', members: [{ name: '', phone: '' }] });

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try { const res = await groups.getAll(); setData(res.data.groups); }
    catch {} finally { setLoading(false); }
  };

  const addMember = () => setForm({...form, members: [...form.members, { name: '', phone: '' }]});

  const updateMember = (i: number, field: string, val: string) => {
    const m = [...form.members];
    m[i] = {...m[i], [field]: val};
    setForm({...form, members: m});
  };

  const handleCreate = async () => {
    try { await groups.create(form); setShowAdd(false); loadGroups(); }
    catch {}
  };

  const handlePay = async (memberId: number) => {
    await groups.payRound(memberId);
    loadGroups();
  };

  const inputStyle = { width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'white', marginBottom:'0.75rem', boxSizing:'border-box' as any, textAlign:'right' as any };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', fontFamily:'Arial', direction:'rtl', paddingBottom:'80px' }}>
      <div style={{ background:'#1e293b', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'white', margin:0 }}>👥 الجمعيات</h2>
        <button onClick={() => setShowAdd(true)} style={{ background:'#38bdf8', color:'#0f172a', border:'none', padding:'0.5rem 1rem', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' }}>+ جمعية جديدة</button>
      </div>

      <div style={{ padding:'1.5rem' }}>
        {loading ? <p style={{ color:'#94a3b8', textAlign:'center' }}>جاري التحميل...</p> :
          data.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>مفيش جمعيات دلوقتي</p> :
          data.map((g: any) => (
            <div key={g.id} style={{ background:'#1e293b', borderRadius:'12px', padding:'1rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
                <div>
                  <p style={{ color:'white', fontWeight:'bold', margin:'0 0 0.25rem' }}>{g.name}</p>
                  <p style={{ color:'#94a3b8', margin:0, fontSize:'0.875rem' }}>{g.frequency === 'monthly' ? 'شهري' : 'أسبوعي'} • {g.amount} ج</p>
                </div>
                <span style={{ background:'#16a34a20', color:'#16a34a', padding:'0.25rem 0.75rem', borderRadius:'20px', fontSize:'0.8rem', height:'fit-content' }}>نشط</span>
              </div>
              {g.members?.map((m: any) => (
                <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem', borderRadius:'8px', background:'#0f172a', marginBottom:'0.5rem' }}>
                  <div>
                    <span style={{ color:'white' }}>دور {m.round_number} — {m.name}</span>
                    {m.phone && <p style={{ color:'#94a3b8', margin:0, fontSize:'0.8rem' }}>{m.phone}</p>}
                  </div>
                  {m.is_paid ?
                    <span style={{ color:'#16a34a', fontSize:'0.875rem' }}>✅ دفع</span> :
                    <button onClick={() => handlePay(m.id)} style={{ background:'#16a34a20', color:'#16a34a', border:'1px solid #16a34a', padding:'0.3rem 0.6rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>تم الدفع</button>
                  }
                </div>
              ))}
            </div>
          ))
        }
      </div>

      {/* Modal إضافة جمعية */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'#00000080', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#1e293b', borderRadius:'16px 16px 0 0', padding:'1.5rem', width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
            <h3 style={{ color:'white', marginTop:0 }}>جمعية جديدة</h3>
            <input placeholder="اسم الجمعية" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
            <input placeholder="المبلغ" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={inputStyle} />
            <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} style={inputStyle} />
            <h4 style={{ color:'#94a3b8' }}>الأعضاء</h4>
            {form.members.map((m, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
                <input placeholder={`عضو ${i+1}`} value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} style={{...inputStyle, marginBottom:0}} />
                <input placeholder="موبايل" value={m.phone} onChange={e => updateMember(i, 'phone', e.target.value)} style={{...inputStyle, marginBottom:0}} />
              </div>
            ))}
            <button onClick={addMember} style={{ width:'100%', padding:'0.5rem', borderRadius:'8px', background:'transparent', border:'1px dashed #334155', color:'#94a3b8', cursor:'pointer', marginBottom:'1rem' }}>+ أضف عضو</button>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding:'0.75rem', borderRadius:'8px', background:'#ef444420', color:'#ef4444', border:'none', cursor:'pointer' }}>إلغاء</button>
              <button onClick={handleCreate} style={{ padding:'0.75rem', borderRadius:'8px', background:'#38bdf8', color:'#0f172a', border:'none', fontWeight:'bold', cursor:'pointer' }}>إنشاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#1e293b', display:'flex', borderTop:'1px solid #334155' }}>
        {[['🏠','الرئيسية','home'],['➕','دين جديد','add'],['👥','جمعيات','groups']].map(([icon, label, page]) => (
          <button key={page} onClick={() => setPage(page)}
            style={{ flex:1, padding:'0.75rem', background:'transparent', border:'none', color: page === 'groups' ? '#38bdf8' : '#94a3b8', cursor:'pointer', fontSize:'0.8rem' }}>
            <div style={{ fontSize:'1.2rem' }}>{icon}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
