import { useState, useEffect } from 'react';
import { debts, downloadPDF } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NAV = [['🏠','الرئيسية','home'],['➕','دين جديد','add'],['👥','العملاء','clients'],['📊','إحصائيات','dashboard'],['⚙️','إعدادات','settings']];

export default function Home({ setPage }: { setPage: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [debtList, setDebtList] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_lend: 0, total_borrow: 0, net: 0 });
  const [filter, setFilter] = useState<'all' | 'lend' | 'borrow'>('all');
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => { loadDebts(); loadReminders(); }, []);

  const loadDebts = async () => {
    try {
      const res = await debts.getAll();
      setDebtList(res.data.debts || []);
      setSummary(res.data.summary || { total_lend: 0, total_borrow: 0, net: 0 });
    } catch {} finally { setLoading(false); }
  };

  const loadReminders = async () => {
    try {const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';const res = await fetch(BASE + '/reminders', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setReminders(data.reminders || []);
      if ((data.reminders || []).length > 0) setShowReminders(true);
    } catch {}
  };

  const handlePay = async (id: number) => { await debts.markPaid(id); loadDebts(); };
  const handleDelete = async (id: number) => { if (!confirm('تأكيد الحذف؟')) return; await debts.delete(id); loadDebts(); };
  const handleShare = async (id: number) => { try { const res = await debts.share(id); window.open(res.data.whatsapp, '_blank'); } catch {} };

  const activeDebts = debtList.filter(d => !d.is_paid);
  const paidDebts = debtList.filter(d => d.is_paid);
  const filtered = activeDebts.filter(d => filter === 'all' || d.type === filter);
  const today = new Date();
  const overdue = filtered.filter(d => d.due_date && new Date(d.due_date) < today);
  const upcoming = filtered.filter(d => { if (!d.due_date || new Date(d.due_date) < today) return false; return (new Date(d.due_date).getTime() - today.getTime()) / 86400000 <= 3; });
  const normal = filtered.filter(d => { if (!d.due_date) return true; return (new Date(d.due_date).getTime() - today.getTime()) / 86400000 > 3; });

  const DebtCard = ({ d }: { d: any }) => {
    const isLend = d.type === 'lend';
    const color = isLend ? '#10b981' : '#ef4444';
    const colorLight = isLend ? '#f0fdf4' : '#fef2f2';
    const colorBorder = isLend ? '#bbf7d0' : '#fecaca';
    const daysLeft = d.due_date ? Math.ceil((new Date(d.due_date).getTime() - today.getTime()) / 86400000) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px #00000010', border: `1px solid ${isOverdue ? '#fecaca' : isUrgent ? '#fef08a' : '#f1f5f9'}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: color }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${isLend ? '#059669' : '#dc2626'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, boxShadow: `0 4px 10px ${color}40` }}>
            {d.person_name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#0f172a', fontWeight: 700, margin: 0, fontSize: '1rem' }}>{d.person_name}</p>
              <p style={{ color, fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{parseFloat(d.amount).toFixed(0)} ج</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' as any }}>
              <span style={{ background: colorLight, color, fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '8px', fontWeight: 600, border: `1px solid ${colorBorder}` }}>
                {isLend ? '✋ سلّفته' : '🤲 استلفت'}
              </span>
              {d.description && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>• {d.description}</span>}
            </div>
          </div>
        </div>

        {daysLeft !== null && (
          <div style={{ background: isOverdue ? '#fef2f2' : isUrgent ? '#fefce8' : '#f8fafc', borderRadius: '8px', padding: '0.4rem 0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1px solid ${isOverdue ? '#fecaca' : isUrgent ? '#fef08a' : '#e2e8f0'}` }}>
            <span style={{ fontSize: '0.85rem' }}>{isOverdue ? '🚨' : isUrgent ? '⚡' : '📅'}</span>
            <span style={{ color: isOverdue ? '#ef4444' : isUrgent ? '#ca8a04' : '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
              {isOverdue ? `متأخر ${Math.abs(daysLeft)} يوم` : daysLeft === 0 ? 'اليوم!' : `باقي ${daysLeft} يوم`}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: 'auto' }}>{new Date(d.due_date).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => setPage('debt:' + d.id)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>🔍 تفاصيل</button>
          <button onClick={() => handleShare(d.id)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>📤 واتساب</button>
          <button onClick={() => handlePay(d.id)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✅ سداد</button>
          <button onClick={() => debts.downloadReceipt(d.id)} style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.85rem' }}>📄</button>
          <button onClick={() => handleDelete(d.id)} style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '0.85rem' }}>🗑</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial', direction: 'rtl', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px #00000010' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
              {user?.username?.[0] || '؟'}
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>أهلاً 👋</p>
              <p style={{ color: '#0f172a', fontWeight: 800, margin: 0, fontSize: '1rem' }}>{user?.username}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={downloadPDF} style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '0.5rem 0.75rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>📄 تقرير</button>
            <button onClick={logout} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.5rem 0.75rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>خروج</button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', boxShadow: '0 2px 8px #10b98130' }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{summary.total_lend.toFixed(0)}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', margin: '0.2rem 0 0' }}>ليك ج</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', boxShadow: '0 2px 8px #ef444430' }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{summary.total_borrow.toFixed(0)}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', margin: '0.2rem 0 0' }}>عليك ج</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', boxShadow: '0 2px 8px #6366f130' }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{summary.net.toFixed(0)}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', margin: '0.2rem 0 0' }}>الصافي ج</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0.75rem 1rem' }}>
        {/* Reminders Banner */}
        {showReminders && (
          <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px #f59e0b15' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🔔</span>
              <span style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 700 }}>{reminders.length} دين قريب الموعد!</span>
            </div>
            <button onClick={() => setShowReminders(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          {[['all','الكل'],['lend','✋ سلفت'],['borrow','🤲 استلفت']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val as any)} style={{ padding: '0.4rem 0.875rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: filter === val ? '#6366f1' : 'white', color: filter === val ? 'white' : '#64748b', border: `1px solid ${filter === val ? '#6366f1' : '#e2e8f0'}`, boxShadow: filter === val ? '0 2px 8px #6366f130' : 'none' }}>
              {label}
            </button>
          ))}
          <button onClick={() => setPage('add')} style={{ marginRight: 'auto', padding: '0.4rem 0.875rem', borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px #10b98130' }}>
            ➕ دين
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', color: '#6366f1', padding: '2rem' }}>جاري التحميل...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <p style={{ fontSize: '3rem' }}>💸</p>
            <p style={{ fontWeight: 600 }}>مفيش ديون حالياً</p>
            <button onClick={() => setPage('add')} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px #6366f130' }}>+ إضافة دين</button>
          </div>
        )}

        {overdue.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem' }}>
              <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '20px', border: '1px solid #fecaca' }}>🚨 متأخرة ({overdue.length})</span>
            </div>
            {overdue.map(d => <DebtCard key={d.id} d={d} />)}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0 0.5rem' }}>
              <span style={{ background: '#fefce8', color: '#ca8a04', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '20px', border: '1px solid #fef08a' }}>⚡ قريبة ({upcoming.length})</span>
            </div>
            {upcoming.map(d => <DebtCard key={d.id} d={d} />)}
          </>
        )}

        {normal.length > 0 && (
          <>
            {(overdue.length > 0 || upcoming.length > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0 0.5rem' }}>
                <span style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>📋 باقي الديون</span>
              </div>
            )}
            {normal.map(d => <DebtCard key={d.id} d={d} />)}
          </>
        )}

        {paidDebts.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem' }}>
              <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '20px', border: '1px solid #bbf7d0' }}>✅ مدفوعة ({paidDebts.length})</span>
            </div>
            {paidDebts.map(d => (
              <div key={d.id} style={{ background: 'white', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.65 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a' }}>✅</span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{d.person_name}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700 }}>{parseFloat(d.amount).toFixed(0)} ج</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px #00000010' }}>
        {NAV.map(([icon, label, p]) => (
          <button key={p} onClick={() => setPage(p)} style={{ flex: 1, padding: '0.6rem 0', background: 'transparent', border: 'none', color: p === 'home' ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontSize: '0.62rem', borderTop: p === 'home' ? '2px solid #6366f1' : '2px solid transparent' }}>
            <div style={{ fontSize: '1.1rem' }}>{icon}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
