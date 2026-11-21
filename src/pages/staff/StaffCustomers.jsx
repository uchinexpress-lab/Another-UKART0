import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, RefreshCw, Loader2, Mail, Phone, Users, ShoppingBag, UserPlus } from 'lucide-react';

const naira = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function StatCard({ title, value, description, icon: Icon, tone = 'green' }) {
  const tones = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{Number(value || 0).toLocaleString('en-NG')}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalCustomers: 0, customersWithOrders: 0, registeredOnly: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await base44.functions.invoke('listCustomers', {});
      if (!result?.success || !Array.isArray(result.customers)) {
        throw new Error(result?.error || 'The customer list could not be loaded.');
      }
      setCustomers(result.customers);
      setSummary(result.summary || { totalCustomers: result.customers.length, customersWithOrders: 0, registeredOnly: result.customers.length });
    } catch (e) {
      console.error('Customer list error:', e);
      setError(e?.message || 'Unable to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !q || [customer.name, customer.email, customer.phone].some((v) => String(v || '').toLowerCase().includes(q));
      const matchesFilter = filter === 'all' || (filter === 'ordered' ? customer.orderCount > 0 : customer.orderCount === 0);
      return matchesSearch && matchesFilter;
    });
  }, [customers, search, filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">{filtered.length.toLocaleString('en-NG')} of {customers.length.toLocaleString('en-NG')} customers</p>
        </div>
        <button type="button" onClick={loadCustomers} disabled={loading} aria-label="Refresh customers" className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-600" /> : <RefreshCw className="h-4 w-4 text-gray-600" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Total customers" value={summary.totalCustomers} description="All registered customer accounts" icon={Users} tone="green" />
        <StatCard title="Customers who ordered" value={summary.customersWithOrders} description="At least one order placed" icon={ShoppingBag} tone="blue" />
        <StatCard title="Registered only" value={summary.registeredOnly} description="No orders placed yet" icon={UserPlus} tone="amber" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#2E7D32]" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#2E7D32]">
            <option value="all">All customers</option>
            <option value="ordered">Customers who ordered</option>
            <option value="registered">Registered only</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /><p className="mt-2 text-sm text-gray-500">Loading customers…</p></div>
        ) : error ? (
          <div className="p-8 text-center"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={loadCustomers} className="mt-3 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white">Try again</button></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">{customers.length ? 'No customers match your search.' : 'No registered customers found.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600"><tr>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Registered</th>
                <th className="px-4 py-3 text-left font-semibold">Orders</th>
                <th className="px-4 py-3 text-left font-semibold">Total spent</th>
                <th className="px-4 py-3 text-left font-semibold">Last order</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || 'Customer'}</td>
                  <td className="px-4 py-3"><p className="flex items-center gap-1.5 text-xs text-gray-600"><Mail className="h-3 w-3 shrink-0" />{c.email}</p>{c.phone && <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3 shrink-0" />{c.phone}</p>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{dateLabel(c.registeredAt)}</td>
                  <td className="px-4 py-3 font-medium">{Number(c.orderCount || 0).toLocaleString('en-NG')}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[#2E7D32]">{naira(c.totalSpent)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{dateLabel(c.lastOrder)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}