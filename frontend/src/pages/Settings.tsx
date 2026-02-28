import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [['🏠','الرئيسية','home'],['➕','دين جديد','add'],['👥','العملاء','clients'],['📊','إحصائيات','dashboard'],['⚙️','إعدادات','settings']];

const exportBackup = async () => {
  const token = localStorage.getItem('token');
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const res = await fetch(BASE + '/backup/export', { headers: { Authorization: 'Bearer ' + token } });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'selfni-backup.json'; a.click();
  URL.revokeObjectURL(url);
};

export default function Settings({ setPage }: { setPage: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [settings, setSettings] = useState({ business_name: '', phone: '', whatsapp: '', address: '', logo_url: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('selfni_settings');
    if (s) setSettings(JSON.parse(s));
  }, []);

  const save = () => {
    localStorage.setItem('selfni_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogo = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSettings({ ...settings, logo_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const SectionRow = ({ icon, label, section }: any) => (
    <button onClick={() => setActiveSection(activeSection === section ? null : section)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ color: '#0f172a', fontSize: '0.9rem' }}>{label}</span>
      </div>
      <span style={{ color: '#cbd5e1', fontSize: '1rem' }}>{activeSection === section ? '▲' : '›'}</span>
    </button>
  );

  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as any, textAlign: 'right' as any, marginBottom: '0.75rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial', direction: 'rtl', paddingBottom: '5rem' }}>
      <div style={{ background: 'white', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px #00000010' }}>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>⚙️ الإعدادات</h2>
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>

        {/* Profile Card */}
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 20px #6366f140' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0, border: '2px solid rgba(255,255,255,0.4)' }}>
            {user?.username?.[0] || 'م'}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '1rem' }}>{user?.username}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{user?.email}</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, padding: '0.75rem 1rem 0.5rem', margin: 0, borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الحساب</p>

          <SectionRow icon="🏪" label="بيانات المتجر" section="store" />
          {activeSection === 'store' && (
            <div style={{ padding: '1rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
              {settings.logo_url && <img src={settings.logo_url} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', marginBottom: '0.75rem', border: '2px solid #e2e8f0' }} />}
              <label style={{ display: 'block', padding: '0.6rem', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', textAlign: 'center', cursor: 'pointer', marginBottom: '0.75rem', border: '1px dashed #93c5fd', fontSize: '0.85rem' }}>
                📷 {settings.logo_url ? 'تغيير الشعار' : 'رفع شعار'}
                <input type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
              </label>
              <input placeholder="اسم المتجر" value={settings.business_name} onChange={e => setSettings({ ...settings, business_name: e.target.value })} style={inputStyle} />
              <input placeholder="رقم التليفون" type="tel" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} style={inputStyle} />
              <input placeholder="رقم الواتساب" type="tel" value={settings.whatsapp} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} style={inputStyle} />
              <input placeholder="العنوان" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
          )}

          <SectionRow icon="🔔" label="الإشعارات" section="notifications" />
          {activeSection === 'notifications' && (
            <div style={{ padding: '1rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
              {[['تذكير الديون المتأخرة', true], ['تنبيه مواعيد السداد', true], ['ملخص أسبوعي', false]].map(([label, on]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem' }}>{label as string}</span>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#6366f1' : '#e2e8f0', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: 3, right: on ? 3 : 'auto', left: on ? 'auto' : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px #00000020' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <SectionRow icon="🔒" label="الأمان والخصوصية" section="security" />
          {activeSection === 'security' && (
            <div style={{ padding: '1rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>البريد الإلكتروني: {user?.email}</p>
              <button style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.85rem' }}>🔑 تغيير كلمة المرور (قريباً)</button>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 2px 8px #00000008', border: '1px solid #f1f5f9' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, padding: '0.75rem 1rem 0.5rem', margin: 0, borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>المزيد</p>

          <SectionRow icon="💾" label="نسخة احتياطية" section="backup" />
          {activeSection === 'backup' && (
            <div style={{ padding: '1rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>تصدير جميع بياناتك كملف JSON</p>
              <button onClick={exportBackup} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontWeight: 600 }}>
                📥 تصدير البيانات
              </button>
            </div>
          )}

          <SectionRow icon="ℹ️" label="عن التطبيق" section="about" />
          {activeSection === 'about' && (
            <div style={{ padding: '1rem', background: '#fafafa' }}>
              {[['التطبيق', 'سلفني 💰'], ['الإصدار', '1.0.0'], ['المطور', 'حسام نسيم']].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{k as string}</span>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{v as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeSection === 'store' && (
          <button onClick={save} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', marginBottom: '0.75rem', fontSize: '0.95rem', boxShadow: saved ? '0 4px 12px #10b98140' : '0 4px 12px #6366f140' }}>
            {saved ? '✅ تم الحفظ!' : '💾 حفظ الإعدادات'}
          </button>
        )}

        <button onClick={logout} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
          🚪 تسجيل الخروج
        </button>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px #00000010' }}>
        {NAV.map(([icon, label, p]) => (
          <button key={p} onClick={() => setPage(p)} style={{ flex: 1, padding: '0.6rem 0', background: 'transparent', border: 'none', color: p === 'settings' ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontSize: '0.62rem', borderTop: p === 'settings' ? '2px solid #6366f1' : '2px solid transparent' }}>
            <div style={{ fontSize: '1.1rem' }}>{icon}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
