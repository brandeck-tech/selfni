import { useState, useEffect } from 'react';

const NAV = [
  ['🏠','الرئيسية','home'],
  ['➕','دين جديد','add'],
  ['👥','العملاء','clients'],
  ['📊','إحصائيات','dashboard'],
  ['⚙️','إعدادات','settings']
];

interface Client {
  id: number;
  name: string;
  phone?: string;
  total: number;
  paid: number;
  transactions: number;
  lastPaymentDate?: string;
}

export default function Clients({ setPage }: { setPage: (p: string) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all'|'good'|'bad'>('all');

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(BASE + '/clients', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setClients(data.clients || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // حساب تقييم العميل
  const calculateRiskScore = (client: Client) => {
    const { total, paid, transactions } = client;
    const paymentRatio = total === 0 ? 1 : paid / total; // 0-1
    const transactionScore = transactions > 0 ? Math.min(transactions / 10, 1) : 0.5;
    const score = Math.round(40*paymentRatio + 30*transactionScore + 20*1 + 10*1);
    return Math.min(score, 100);
  };

  const getRiskLevel = (score: number) => {
    if(score >= 85) return { color: 'green', label: '🟢 ممتاز' };
    if(score >= 70) return { color: 'blue', label: '🔵 جيد' };
    if(score >= 50) return { color: 'yellow', label: '🟡 متوسط' };
    return { color: 'red', label: '🔴 مخاطرة' };
  };

  const filteredClients = clients
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      if(filterRisk === 'all') return true;
      const score = calculateRiskScore(c);
      return filterRisk === 'good' ? score >= 70 : score < 70;
    });

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">👥 العملاء والمدينين</h2>

      {/* البحث والفلتر */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="🔍 ابحث..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <select className="p-2 border rounded" value={filterRisk} onChange={e => setFilterRisk(e.target.value as any)}>
          <option value="all">الكل</option>
          <option value="good">ملتزمين</option>
          <option value="bad">مخاطرة</option>
        </select>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <p>لا يوجد عملاء لعرضهم</p>
          ) : filteredClients.map(client => {
            const score = calculateRiskScore(client);
            const risk = getRiskLevel(score);
            const remaining = client.total - client.paid;
            const paymentPercent = client.total === 0 ? 100 : Math.round((client.paid / client.total) * 100);

            return (
              <div key={client.id} className="p-3 border rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition">
                
                <div className="flex-1">
                  <h3 className="font-bold">{client.name}</h3>
                  {client.phone && <p>📞 {client.phone}</p>}
                  <p>الإجمالي: {client.total} ج</p>
                  <p>مدفوع: {client.paid} ج</p>
                  <p>متبقي: {remaining} ج</p>
                  <p style={{ color: risk.color, fontWeight: 600 }}>{risk.label} ({score}/100)</p>

                  {/* شريط تقدم ديناميكي */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div
                      className={`h-3 rounded-full ${paymentPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${paymentPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1">نسبة السداد: {paymentPercent}%</p>

                  {/* أيقونات معاملات */}
                  <div className="flex gap-1 mt-1">
                    {[...Array(client.transactions)].map((_, idx) => (
                      <span key={idx} className="text-yellow-500">⭐</span>
                    ))}
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 flex gap-2">
                  <button className="bg-green-500 text-white px-3 py-1 rounded">💬 واتساب</button>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded">📞 اتصال</button>
                  <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => alert(JSON.stringify(client, null, 2))}>🔍 تفاصيل</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
