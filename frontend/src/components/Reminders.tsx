import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Reminders() {
  const [reminders, setReminders] = useState<any>({ urgent: [], upcoming: [] });

  useEffect(() => {
    loadReminders();
    // طلب إذن التنبيهات
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const loadReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/reminders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReminders(data.reminders);

      // بعت browser notification للديون العاجلة
      if ('Notification' in window && Notification.permission === 'granted') {
        data.reminders.urgent.forEach((d: any) => {
          new Notification('⚠️ سلفني - دين عاجل!', {
            body: `${d.person_name} - ${d.amount} جنيه - باقي ${d.days_remaining} يوم`,
            icon: '/vite.svg'
          });
        });
      }
    } catch {}
  };

  if (reminders.urgent.length === 0 && reminders.upcoming.length === 0) return null;

  return (
    <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
      {reminders.urgent.map((d: any) => (
        <div key={d.id} style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 0.25rem' }}>🚨 عاجل — {d.person_name}</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>باقي {d.days_remaining} يوم — {d.amount} جنيه</p>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`مرحبا ${d.person_name}، تذكير بدين ${d.amount} جنيه`)}`} target="_blank"
            style={{ background: '#25d36620', color: '#25d366', border: '1px solid #25d366', padding: '0.4rem 0.6rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem' }}>
            📤 واتساب
          </a>
        </div>
      ))}
      {reminders.upcoming.map((d: any) => (
        <div key={d.id} style={{ background: '#f59e0b20', border: '1px solid #f59e0b', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#f59e0b', fontWeight: 'bold', margin: '0 0 0.25rem' }}>⏰ قريب — {d.person_name}</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>باقي {d.days_remaining} يوم — {d.amount} جنيه</p>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`مرحبا ${d.person_name}، تذكير بدين ${d.amount} جنيه`)}`} target="_blank"
            style={{ background: '#25d36620', color: '#25d366', border: '1px solid #25d366', padding: '0.4rem 0.6rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem' }}>
            📤 واتساب
          </a>
        </div>
      ))}
    </div>
  );
}
