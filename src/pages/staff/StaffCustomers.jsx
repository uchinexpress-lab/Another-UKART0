
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Search,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Users,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';

const formatNaira = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG')}`;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-NG') : '—';

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    customersWithOrders: 0,
    registeredOnly: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await base44.functions.invoke('listCustomers', {});

      if (!result?.success) {
        throw new Error(result?.error || 'Unable to load customers.');
      }

      const list = Array.isArray(result.customers)
        ? result.customers
        : [];

      setCustomers(list);

      setSummary({
        totalCustomers: Number(result.summary?.totalCustomers ?? list.length),
        customersWithOrders: Number(result.summary?.customersWithOrders ?? 0),
        registeredOnly: Number(result.summary?.registeredOnly ?? 0),
      });
    } catch (err) {
      console.error('Customer loading error:', err);
      setError(err.message || 'Could not load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter((customer) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      String(customer.name || customer.full_name || '')
        .toLowerCase().includes(query) ||
      String(customer.email || '').toLowerCase().includes(query) ||
      String(customer.phone || '').toLowerCase().includes(query)
    );
  });

  const statCards = [
    {
      title: 'Total Customers',
      value: summary.totalCustomers,
      icon: Users,
      description: 'All registered customers',
    },
    {
      title: 'Customers Who Ordered',
      value: summary.customersWithOrders,
      icon: ShoppingBag,
      description: 'Have placed at least one order',
    },
    {
      title: 'Registered Only',
      value: summary.registeredOnly,
      icon: UserPlus,
      description: 'Registered but have not ordered',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">
            Manage and monitor your Ukart customers
          </p>
        </div>

        <button
          onClick={loadCustomers}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          title="Refresh customers"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#2E7D32]" />
                </div>
              </div>

              <p className="text-3xl font-bold text-gray-900 mt-3">
                {loading ? '—' : stat.value.toLocaleString('en-NG')}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone"
            className="w-full pl-9 pr-3 h-10 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={loadCustomers}
            className="ml-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Customer Directory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Showing {filtered.length.toLocaleString('en-NG')} of {customers.length.toLocaleString('en-NG')} customers
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32] mx-auto" />
            <p className="text-sm text-gray-500 mt-3">
              Loading customer records...
            </p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Customer records could not be loaded.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            {search ? 'No customers match your search.' : 'No customers found.'}
          </div>
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
                {filtered.map((customer, index) => {
                  const name =
                    customer.name ||
                    customer.full_name ||
                    'Customer';

                  const email = customer.email || '';
                  const phone = customer.phone || '';
                  const orderCount = Number(customer.orderCount || 0);
                  const totalSpent = Number(customer.totalSpent || 0);

                  return (
                    <tr
                      key={customer.id || customer.email || index}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {name}
                        {orderCount === 0 && (
                          <span className="block text-xs text-gray-400 font-normal mt-1">
                            Registered only
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {email && (
                          <p className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            {email}
                          </p>
                        )}

                        {phone && (
                          <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <Phone className="w-3 h-3" />
                            {phone}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {orderCount}
                      </td>

                      <td className="px-4 py-3 font-medium text-[#2E7D32]">
                        {formatNaira(totalSpent)}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(customer.lastOrder)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}