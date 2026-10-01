import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isSuperAdmin } from '@/lib/staffRoles';
import {
  Gift,
  Search,
  Loader2,
  FlaskConical,
  X,
} from 'lucide-react';

const STATUS_BADGE = {
  created: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  redeemed: 'bg-purple-100 text-purple-700',
  expired: 'bg-gray-100 text-gray-500',
};

export default function StaffBirthdayRewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.BirthdayReward.filter(
        {},
        { sort: '-created_date', limit: 200 }
      );
      setRewards(res.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const runTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke('testBirthdayReward', {
        customerEmail: testEmail.trim(),
      });
      setTestResult(res.data);
      if (res.data?.success) {
        loadRewards();
      }
    } catch (e) {
      setTestResult({ error: e.message || 'Test failed' });
    }
    setTesting(false);
  };

  // Apply filters
  const now = new Date();
  const filtered = rewards.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.customer_email?.toLowerCase().includes(q) &&
        !r.customer_name?.toLowerCase().includes(q) &&
        !r.voucher_code?.toLowerCase().includes(q)
      )
        return false;
    }
    if (filter === 'today') {
      const dob = new Date(r.date_of_birth);
      return (
        dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()
      );
    }
    if (filter === 'this_month') {
      const dob = new Date(r.date_of_birth);
      return dob.getMonth() === now.getMonth();
    }
    if (filter === 'available') {
      return (
        r.status !== 'redeemed' &&
        r.status !== 'expired' &&
        new Date(r.expiry_date) >= now
      );
    }
    if (filter === 'redeemed') return r.status === 'redeemed';
    if (filter === 'expired') {
      return r.status === 'expired' || new Date(r.expiry_date) < now;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Birthday Rewards</h1>
          <p className="text-sm text-gray-500">
            {rewards.length} total · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={loadRewards}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Gift className="w-4 h-4" />
        </button>
      </div>

      {/* Super Admin Test Panel */}
      {isSuperAdmin(user) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">
              Test Birthday Reward (Super Admin)
            </h3>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Simulate a birthday reward for any customer. Test rewards are marked
            and won't affect real birthday processing.
          </p>
          <div className="flex gap-2">
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="customer@email.com"
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400"
            />
            <button
              onClick={runTest}
              disabled={testing || !testEmail.trim()}
              className="h-9 px-4 rounded-lg bg-amber-600 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FlaskConical className="w-3.5 h-3.5" />
              )}
              Run Test
            </button>
          </div>
          {testResult && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 text-sm relative">
              {testResult.error ? (
                <p className="text-red-600">❌ {testResult.error}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-green-700 font-semibold">
                    ✅ Test reward created!
                  </p>
                  <p className="text-gray-600">
                    Customer: {testResult.customerName || testResult.customer}
                  </p>
                  <p className="text-gray-600">
                    Voucher: <span className="font-mono font-bold">{testResult.voucherCode}</span>
                  </p>
                  <p className="text-gray-600">
                    Amount: ₦{testResult.voucherAmount?.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Email sent: {testResult.emailSent ? '✅ Yes' : '❌ No'}
                    {testResult.emailError ? ` (${testResult.emailError})` : ''}
                  </p>
                </div>
              )}
              <button
                onClick={() => setTestResult(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, email, or voucher code..."
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-[#2E7D32]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-[#2E7D32]"
        >
          <option value="all">All rewards</option>
          <option value="today">Today's birthdays</option>
          <option value="this_month">This month's birthdays</option>
          <option value="available">Voucher available</option>
          <option value="redeemed">Voucher redeemed</option>
          <option value="expired">Voucher expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No birthday rewards found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Birthday</th>
                  <th className="text-left px-4 py-3 font-semibold">Voucher Code</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Issued</th>
                  <th className="text-left px-4 py-3 font-semibold">Expires</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Redeemed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const dob = r.date_of_birth
                    ? new Date(r.date_of_birth).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—';
                  const issued = r.sent_at
                    ? new Date(r.sent_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  const expires = r.expiry_date
                    ? new Date(r.expiry_date).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';
                  const redeemed = r.redeemed_at
                    ? new Date(r.redeemed_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  const isExpired =
                    r.status === 'expired' ||
                    new Date(r.expiry_date) < now;
                  const status = isExpired && r.status !== 'redeemed' ? 'expired' : r.status;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {r.customer_name || '—'}
                          {r.is_test && (
                            <span className="ml-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              TEST
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{r.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{dob}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {r.voucher_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ₦{(r.voucher_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{issued}</td>
                      <td className="px-4 py-3 text-gray-600">{expires}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_BADGE[status] || 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{redeemed}</td>
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