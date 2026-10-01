import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, RefreshCw, Loader2, Mail, Phone } from 'lucide-react';

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.all([
        base44.entities.Order.aggregate({
          groupBy: 'customer_email',
          sum: 'total',
          count: true,
          sort: '-count',
          limit: 1000,
        }),
        base44.entities.Order.filter(
          {},
          { sort: '-created_date', limit: 200, fields: ['customer_email', 'customer_name', 'customer_phone', 'created_date'] }
        ),
      ]);

      const infoMap = {};
      (recentRes.items || []).forEach((o) => {
        if (o.customer_email && !infoMap[o.customer_email]) {
          infoMap[o.customer_email] = {
            name: o.customer_name,
            phone: o.customer_phone,
            lastOrder: o.created_date,
          };
        }
      });

      const list = (statsRes.rows || [])
        .filter((r) => r.customer_email)
        .map((r) => ({
          email: r.customer_email,
          name: infoMap[r.customer_email]?.name || r.customer_email,
          phone: infoMap[r.customer_email]?.phone || '',
          orderCount: r.count,
          totalSpent: r.sum_total || 0,
          lastOrder: infoMap[r.customer_email]?.lastOrder,
        }));

      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{filtered.length} customers</p>
        </div>
        <button onClick={loadCustomers} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Orders</th>
                  <th className="text-left px-4 py-3 font-semibold">Total Spent</th>
                  <th className="text-left px-4 py-3 font-semibold">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                      {c.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium text-[#2E7D32]">
                      ₦{c.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-NG') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}