import { useState, useEffect } from 'react';
import { debts } from '../services/api';

const NAV = [['🏠','الرئيسية','home'],['➕','دين جديد','add'],['👥','العملاء','clients'],['📊','إحصائيات','dashboard'],['⚙️','إعدادات','settings']];

export default function Dashboard({ setPage }: { setPage: (p: string) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await debts.getAll();
      setData(res.data.debts || []);
    } catch {} finally { setLoading(false); }
  };

  const active = data.filter(d => !d.is_paid);
  const paid = data.filter(d => d.is_paid);
  const totalLend = active.filter(d => d.type === 'lend').reduce((s, d) => s + parseFloat(d.amount), 0);
  const totalBorrow = active.filter(d => d.type === 'borrow').reduce((s, d) => s + parseFloat(d.amount), 0);
  const today = new Date();
  const overdue = active.filter(d => d.due_date && new Date(d.due_date) < today);
  const net = totalLend - totalBorrow;

  const months: Record<string, { lend: number; borrow: number }> = {};
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months[key] = { lend: 0, borrow: 0 };
  }
  data.forEach(d => {
    const date = new Date(d.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (months[key]) {
      if (d.type === 'lend') months[key].lend += parseFloat(d.amount);
      else months[key].borrow += parseFloat(d.amount);
    }
  });
  const chartData = Object.entries(months).map(([key, val]) => {
    const [, m] = key.split('-');
    return { label: monthNames[parseInt(m)].slice(0, 3), ...val };
  });
  const maxVal = Math.max(...chartData.map(d => Math.max(d.lend, d.borrow)), 1);
  const lendPct = totalLend + totalBorrow > 0 ? Math.round((totalLend / (totalLend + totalBorrow)) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial', direction: 'rtl', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px #00000010' }}>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📊 الإحصائيات</h2>
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>

        {/* Main Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 16px #10b98140' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>💰 إجمالي ليك</p>
            <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>{totalLend.toFixed(0)}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>جنيه مصري</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 16px #ef444440' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>💸 إجمالي عليك</p>
            <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>{totalBorrow.toFixed(0)}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>جنيه مصري</p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {[
            ['الصافي', net.toFixed(0), net >= 0 ? '#10b981' : '#ef4444', net >= 0 ? '#f0fdf4' : '#fef2f2', net >= 0 ? '#bbf7d0' : '#fecaca'],
            ['متأخرة', overdue.length, '#f59e0b', '#fefce8', '#fef08a'],
            ['مسددة', paid.length, '#6366f1', '#eff6ff', '#c7d2fe'],
          ].map(([label, val, color, bg, border]) => (
            <div key={label as string} style={{ background: bg as string, borderRadius: '12px', padding: '0.875rem', textAlign: 'center', border: `1px solid ${border}` }}>
              <p style={{ color: color as string, fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{val}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0.2rem 0 0' }}>{label as string}</p>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 1rem', fontSize: '0.9rem' }}>📈 الحركة الشهرية</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: 100 }}>
            {chartData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: 80 }}>
                  <div style={{ flex: 1, background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '4px 4px 0 0', height: `${(m.lend / maxVal) * 80}px`, minHeight: m.lend > 0 ? 4 : 0 }} />
                  <div style={{ flex: 1, background: 'linear-gradient(180deg, #f87171, #ef4444)', borderRadius: '4px 4px 0 0', height: `${(m.borrow / maxVal) * 80}px`, minHeight: m.borrow > 0 ? 4 : 0 }} />
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.6rem', margin: 0 }}>{m.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '3px', background: '#10b981' }} />
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>سلّفت</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '3px', background: '#ef4444' }} />
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>استلفت</span>
            </div>
          </div>
        </div>

        {/* Donut */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 1rem', fontSize: '0.9rem' }}>🍩 توزيع الديون</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="35" fill="none" stroke="#fecaca" strokeWidth="14" />
                <circle cx="45" cy="45" r="35" fill="none" stroke="url(#grad1)" strokeWidth="14"
                  strokeDasharray={`${lendPct * 2.199} ${(100 - lendPct) * 2.199}`}
                  strokeDashoffset="54.97" transform="rotate(-90 45 45)" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 800 }}>{lendPct}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>✋ سلّفت</span>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>{lendPct}%</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '4px', height: 7, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #10b981, #059669)', width: `${lendPct}%`, height: '100%', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>🤲 استلفت</span>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>{100 - lendPct}%</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '4px', height: 7, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #f87171, #ef4444)', width: `${100 - lendPct}%`, height: '100%', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Debtors */}
        {active.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
            <p style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 1rem', fontSize: '0.9rem' }}>🏆 أكبر الديون</p>
            {[...active].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5).map((d, i) => {
              const isLend = d.type === 'lend';
              const color = isLend ? '#10b981' : '#ef4444';
              const pct = Math.round((parseFloat(d.amount) / (totalLend + totalBorrow)) * 100);
              const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
              return (
                <div key={d.id} style={{ marginBottom: '0.875rem' }} onClick={() => setPage('debt:' + d.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>{medals[i]}</span>
                      <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{d.person_name}</span>
                      <span style={{ color, fontSize: '0.7rem', background: isLend ? '#f0fdf4' : '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>{isLend ? 'مديون' : 'دائن'}</span>
                    </div>
                    <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{parseFloat(d.amount).toFixed(0)} ج</span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: '4px', height: 5, overflow: 'hidden' }}>
                    <div style={{ background: `linear-gradient(90deg, ${color}, ${isLend ? '#059669' : '#dc2626'})`, width: `${pct}%`, height: '100%', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px #00000010' }}>
        {NAV.map(([icon, label, p]) => (
          <button key={p} onClick={() => setPage(p)} style={{ flex: 1, padding: '0.6rem 0', background: 'transparent', border: 'none', color: p === 'dashboard' ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontSize: '0.62rem', borderTop: p === 'dashboard' ? '2px solid #6366f1' : '2px solid transparent' }}>
            <div style={{ fontSize: '1.1rem' }}>{icon}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
