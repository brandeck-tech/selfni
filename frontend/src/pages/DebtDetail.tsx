import { useState, useEffect } from 'react';

const API = 'http://localhost:3003/api';

interface Debt {
  id: number; person_name: string; amount: number; type: string;
  description: string; due_date: string; is_paid: boolean;
  created_at: string; phone: string; paid_amount: number;
}
interface Payment { id: number; amount: number; note: string; created_at: string; }
interface Installment {
  id: number; installment_number: number; amount: number;
  due_date: string; status: string; paid_amount: number; paid_at: string;
}

interface Props { debtId: number; setPage: (p: string) => void; }

export default function DebtDetail({ debtId, setPage }: Props) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [instSummary, setInstSummary] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [instCount, setInstCount] = useState('3');
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'installments'>('payments');

  useEffect(() => { loadData(); }, [debtId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`${API}/debts/${debtId}`, { headers }),
        fetch(`${API}/debts/${debtId}/payments`, { headers })
      ]);
      const dData = await dRes.json();
      const pData = await pRes.json();
      if (dData.status === 'success') setDebt(dData.debt);
      if (pData.status === 'success') setPayments(pData.payments || []);
      const iRes = await fetch(`${API}/installments/debt/${debtId}`, { headers });
      const iData = await iRes.json();
      if (iData.status === 'success') {
        setInstallments(iData.installments || []);
        setInstSummary(iData.summary);
      }
    } catch (e) {}
    setLoading(false);
  };

  const addPayment = async () => {
    if (!payAmount) return;
    await fetch(`${API}/debts/${debtId}/payments`, {
      method: 'POST', headers,
      body: JSON.stringify({ amount: parseFloat(payAmount), note: payNote })
    });
    setShowPayModal(false); setPayAmount(''); setPayNote('');
    loadData();
  };

  const createInstallments = async () => {
    const res = await fetch(`${API}/installments/debt/${debtId}`, {
      method: 'POST', headers,
      body: JSON.stringify({ count: parseInt(instCount), start_date: instStartDate })
    });
    const data = await res.json();
    if (data.status === 'success') {
      setInstallments(data.installments);
      setShowInstModal(false);
      setActiveTab('installments');
    }
  };

  const payInstallment = async (instId: number) => {
    await fetch(`${API}/installments/${instId}/pay`, { method: 'PATCH', headers });
    loadData();
  };

  const markPaid = async () => {
    await fetch(`${API}/debts/${debtId}/pay`, { method: 'PATCH', headers });
    loadData();
  };

  const whatsapp = () => {
    if (!debt?.phone) return;
    const msg = `السلام عليكم ${debt.person_name}،
تذكير بـ ${debt.type === 'lend' ? 'دين' : 'سلفة'} بمبلغ ${debt.amount} دج${debt.due_date ? `
موعد السداد: ${new Date(debt.due_date).toLocaleDateString('ar')}` : ''}
شكراً`;
    window.open(`https://wa.me/${debt.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f8fafc' }}>
      <div style={{ fontSize:32 }}>⏳</div>
    </div>
  );

  if (!debt) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f8fafc' }}>
      <div style={{ fontSize:48 }}>😕</div>
      <p style={{ color:'#64748b' }}>الدين مش موجود</p>
      <button onClick={() => setPage('home')} style={{ marginTop:16, padding:'10px 24px', background:'#6366f1', color:'white', border:'none', borderRadius:12, cursor:'pointer' }}>رجوع</button>
    </div>
  );

  const isLend = debt.type === 'lend';
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount as any), 0);
  const remaining = parseFloat(debt.amount as any) - totalPaid;
  const progress = Math.min(100, (totalPaid / parseFloat(debt.amount as any)) * 100);
  const isOverdue = !debt.is_paid && debt.due_date && new Date(debt.due_date) < new Date();
  const instPaidCount = installments.filter(i => i.status === 'paid').length;
  const instProgress = installments.length > 0 ? (instPaidCount / installments.length) * 100 : 0;

  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh', direction:'rtl', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background: isLend ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#ef4444,#f97316)', padding:'20px 16px 60px' }}>
        <button onClick={() => setPage('home')} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, padding:'8px 14px', color:'white', cursor:'pointer', fontSize:14, marginBottom:16 }}>
          ← رجوع
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:56, height:56, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
            {isLend ? '💸' : '🤝'}
          </div>
          <div>
            <h1 style={{ color:'white', margin:0, fontSize:22, fontWeight:700 }}>{debt.person_name}</h1>
            <p style={{ color:'rgba(255,255,255,0.8)', margin:'4px 0 0', fontSize:14 }}>
              {isLend ? 'مدين لك' : 'أنت مدين'} • {new Date(debt.created_at).toLocaleDateString('ar')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ margin:'-40px 16px 0', background:'white', borderRadius:16, padding:20, boxShadow:'0 4px 20px #00000015', position:'relative', zIndex:10 }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:36, fontWeight:800, color: isLend ? '#6366f1' : '#ef4444' }}>
            {parseFloat(debt.amount as any).toLocaleString()} دج
          </div>
          {debt.is_paid ? (
            <span style={{ background:'#d1fae5', color:'#059669', padding:'4px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>✅ مسدد</span>
          ) : isOverdue ? (
            <span style={{ background:'#fee2e2', color:'#dc2626', padding:'4px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>⚠️ متأخر</span>
          ) : (
            <span style={{ background:'#fef3c7', color:'#d97706', padding:'4px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>⏳ معلق</span>
          )}
        </div>
        {!debt.is_paid && totalPaid > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
              <span>مدفوع: {totalPaid.toLocaleString()} دج</span>
              <span>متبقي: {remaining.toLocaleString()} دج</span>
            </div>
            <div style={{ background:'#f1f5f9', borderRadius:8, height:8, overflow:'hidden' }}>
              <div style={{ background:'linear-gradient(90deg,#10b981,#6366f1)', height:'100%', width:`${progress}%`, transition:'width 0.5s' }} />
            </div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
          {debt.due_date && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#94a3b8' }}>موعد السداد</div>
              <div style={{ fontSize:13, fontWeight:600, color: isOverdue ? '#dc2626' : '#1e293b' }}>
                {new Date(debt.due_date).toLocaleDateString('ar')}
              </div>
            </div>
          )}
          {debt.phone && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#94a3b8' }}>الهاتف</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{debt.phone}</div>
            </div>
          )}
        </div>
        {debt.description && (
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12, marginTop:10, fontSize:14, color:'#475569', textAlign:'center' }}>
            📝 {debt.description}
          </div>
        )}
      </div>

      {!debt.is_paid && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'16px 16px 0' }}>
          <button onClick={() => setShowPayModal(true)} style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:14, padding:'12px 8px', fontSize:13, fontWeight:600, cursor:'pointer' }}>💰 دفعة</button>
          <button onClick={() => setShowInstModal(true)} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:14, padding:'12px 8px', fontSize:13, fontWeight:600, cursor:'pointer' }}>📅 تقسيط</button>
          <button onClick={whatsapp} disabled={!debt.phone} style={{ background: debt.phone ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e2e8f0', color: debt.phone ? 'white' : '#94a3b8', border:'none', borderRadius:14, padding:'12px 8px', fontSize:13, fontWeight:600, cursor: debt.phone ? 'pointer' : 'not-allowed' }}>📱 واتساب</button>
        </div>
      )}

      {!debt.is_paid && remaining <= 0 && totalPaid > 0 && (
        <button onClick={markPaid} style={{ display:'block', width:'calc(100% - 32px)', margin:'12px 16px 0', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', border:'none', borderRadius:14, padding:14, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          ✅ تأكيد السداد الكامل
        </button>
      )}

      <div style={{ margin:'20px 16px 0', display:'flex', background:'white', borderRadius:14, padding:4, boxShadow:'0 2px 8px #00000010' }}>
        {[{key:'payments',label:`💰 الدفعات (${payments.length})`},{key:'installments',label:`📅 الأقساط (${installments.length})`}].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{ flex:1, padding:'10px 0', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
              background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#64748b' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'payments' && (
        <div style={{ margin:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {payments.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, background:'white', borderRadius:16, color:'#94a3b8' }}>
              <div style={{ fontSize:40 }}>💸</div><p>لا توجد دفعات بعد</p>
            </div>
          ) : payments.map(p => (
            <div key={p.id} style={{ background:'white', borderRadius:14, padding:14, boxShadow:'0 2px 8px #00000008', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, color:'#10b981', fontSize:16 }}>+{parseFloat(p.amount as any).toLocaleString()} دج</div>
                {p.note && <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{p.note}</div>}
              </div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>{new Date(p.created_at).toLocaleDateString('ar')}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'installments' && (
        <div style={{ margin:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {installments.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, background:'white', borderRadius:16, color:'#94a3b8' }}>
              <div style={{ fontSize:40 }}>📅</div><p>لا توجد أقساط — اضغط تقسيط لإنشاء خطة سداد</p>
            </div>
          ) : (
            <>
              <div style={{ background:'white', borderRadius:14, padding:14, boxShadow:'0 2px 8px #00000008' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'#10b981', fontWeight:600 }}>✅ {instPaidCount}/{installments.length} أقساط</span>
                  <span style={{ color:'#6366f1', fontWeight:600 }}>{instSummary?.pending?.toLocaleString()} دج متبقي</span>
                </div>
                <div style={{ background:'#f1f5f9', borderRadius:8, height:8, overflow:'hidden' }}>
                  <div style={{ background:'linear-gradient(90deg,#10b981,#6366f1)', height:'100%', width:`${instProgress}%`, transition:'width 0.5s' }} />
                </div>
              </div>
              {installments.map(inst => {
                const isInstOverdue = inst.status !== 'paid' && new Date(inst.due_date) < new Date();
                return (
                  <div key={inst.id} style={{ background:'white', borderRadius:14, padding:14, boxShadow:'0 2px 8px #00000008', display:'flex', justifyContent:'space-between', alignItems:'center', borderRight:`4px solid ${inst.status === 'paid' ? '#10b981' : isInstOverdue ? '#ef4444' : '#6366f1'}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, background: inst.status === 'paid' ? '#d1fae5' : isInstOverdue ? '#fee2e2' : '#ede9fe' }}>
                        {inst.status === 'paid' ? '✅' : isInstOverdue ? '⚠️' : '⏳'}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:15 }}>قسط {inst.installment_number}</div>
                        <div style={{ fontSize:12, color:'#94a3b8' }}>{new Date(inst.due_date).toLocaleDateString('ar')}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <div style={{ fontWeight:700, fontSize:15, color: inst.status === 'paid' ? '#10b981' : '#1e293b' }}>{parseFloat(inst.amount as any).toLocaleString()} دج</div>
                      {inst.status !== 'paid' && !debt.is_paid && (
                        <button onClick={() => payInstallment(inst.id)} style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:8, padding:'4px 12px', fontSize:12, cursor:'pointer' }}>دفع</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <div style={{ height:100 }} />

      {showPayModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:100 }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', padding:24, width:'100%', direction:'rtl' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700 }}>💰 إضافة دفعة</h3>
            <input type="number" placeholder="المبلغ (دج)" value={payAmount} onChange={e => setPayAmount(e.target.value)}
              style={{ width:'100%', padding:14, borderRadius:12, border:'2px solid #e2e8f0', fontSize:16, marginBottom:12, boxSizing:'border-box', textAlign:'right' }} />
            <input type="text" placeholder="ملاحظة (اختياري)" value={payNote} onChange={e => setPayNote(e.target.value)}
              style={{ width:'100%', padding:14, borderRadius:12, border:'2px solid #e2e8f0', fontSize:14, marginBottom:16, boxSizing:'border-box', textAlign:'right' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <button onClick={() => setShowPayModal(false)} style={{ padding:14, borderRadius:12, border:'2px solid #e2e8f0', background:'white', color:'#64748b', fontSize:15, cursor:'pointer' }}>إلغاء</button>
              <button onClick={addPayment} style={{ padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', fontSize:15, fontWeight:700, cursor:'pointer' }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {showInstModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:100 }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', padding:24, width:'100%', direction:'rtl' }}>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700 }}>📅 إنشاء خطة أقساط</h3>
            <p style={{ color:'#64748b', fontSize:13, margin:'0 0 20px' }}>
              المبلغ: {parseFloat(debt.amount as any).toLocaleString()} دج
              {parseInt(instCount) >= 2 && ` ÷ ${instCount} = ${(parseFloat(debt.amount as any) / parseInt(instCount)).toFixed(0)} دج/قسط`}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {['2','3','6','12'].map(n => (
                <button key={n} onClick={() => setInstCount(n)}
                  style={{ padding:'12px 0', borderRadius:12, border:`2px solid ${instCount===n ? '#6366f1' : '#e2e8f0'}`, background: instCount===n ? '#ede9fe' : 'white', color: instCount===n ? '#6366f1' : '#374151', fontWeight:700, fontSize:16, cursor:'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
            <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8, color:'#374151' }}>تاريخ البداية</label>
            <input type="date" value={instStartDate} onChange={e => setInstStartDate(e.target.value)}
              style={{ width:'100%', padding:14, borderRadius:12, border:'2px solid #e2e8f0', fontSize:14, marginBottom:16, boxSizing:'border-box' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <button onClick={() => setShowInstModal(false)} style={{ padding:14, borderRadius:12, border:'2px solid #e2e8f0', background:'white', color:'#64748b', fontSize:15, cursor:'pointer' }}>إلغاء</button>
              <button onClick={createInstallments} style={{ padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', fontSize:15, fontWeight:700, cursor:'pointer' }}>إنشاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
