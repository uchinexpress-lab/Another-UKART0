import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, Loader2 } from 'lucide-react';

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

const BAR_COLORS = ['#2E7D32', '#5FCF65', '#1B7F3A', '#4CAF50', '#81C784', '#66BB6A', '#43A047', '#388E3C'];

function formatNaira(n) {
  return '₦' + Math.round(n).toLocaleString();
}

export default function SalesAnalytics() {
  const [range, setRange] = useState(7);
  const [dailyData, setDailyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, avgOrder: 0 });

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setDate(start.getDate() - (range - 1));
      start.setHours(0, 0, 0, 0);
      const startStr = start.toISOString();

      // Daily revenue & order volume via aggregate with dateBucket
      const aggRes = await base44.entities.Order.aggregate({
        query: { created_date: { $gte: startStr } },
        dateBucket: { field: 'created_date', unit: 'day' },
        sum: 'total',
        limit: 31,
      });

      const rows = aggRes.rows || [];
      const dayMap = {};
      rows.forEach((r) => {
        const key = (r.created_date || '').split('T')[0];
        if (key) dayMap[key] = r;
      });

      const daily = [];
      let totalRev = 0;
      let totalOrd = 0;
      for (let i = 0; i < range; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        const row = dayMap[key];
        const rev = row?.sum_total || 0;
        const cnt = row?.count || 0;
        totalRev += rev;
        totalOrd += cnt;
        daily.push({
          date: key,
          label: d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
          revenue: rev,
          orders: cnt,
        });
      }

      setDailyData(daily);
      setTotals({
        revenue: totalRev,
        orders: totalOrd,
        avgOrder: totalOrd > 0 ? totalRev / totalOrd : 0,
      });

      // Top-selling items — fetch orders and aggregate in JS (nested array, no server-side unwind)
      const ordersRes = await base44.entities.Order.filter(
        { created_date: { $gte: startStr } },
        { fields: ['items'], limit: 500 }
      );

      const itemMap = {};
      (ordersRes.items || []).forEach((order) => {
        (order.items || []).forEach((item) => {
          const name = item.name?.trim();
          if (!name) return;
          if (!itemMap[name]) itemMap[name] = { name, quantity: 0, revenue: 0 };
          itemMap[name].quantity += item.quantity || 1;
          itemMap[name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      });

      const top = Object.values(itemMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
      setTopItems(top);
    } catch (e) {
      console.error('Sales analytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="text-sm text-gray-500">Revenue, order volume & top items</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                range === r.days
                  ? 'bg-white text-[#2E7D32] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(totals.revenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.orders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-500">Avg Order Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(totals.avgOrder)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Daily Sales Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatNaira(v), 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Daily Order Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [v, 'Orders']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="orders" fill="#5FCF65" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top-Selling Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Top-Selling Items</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sales data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(250, topItems.length * 40)}>
            <BarChart data={topItems} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
              <Tooltip
                formatter={(v) => [`${v} sold`, 'Quantity']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                {topItems.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}