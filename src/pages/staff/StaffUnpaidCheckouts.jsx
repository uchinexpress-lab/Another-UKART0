import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { canAccessPage } from '@/lib/staffRoles';
import { useAuth } from '@/lib/AuthContext';
import {
  Search, RefreshCw, Loader2, Clock, AlertCircle, CheckCircle2,
  Mail, Phone, MapPin, ShoppingCart,
} from 'lucide-react';
import SheetSelect from '@/components/SheetSelect';

const STATUS_LABELS = {
  initialized: 'Initialized',
  pending: 'Pending',
  failed: 'Failed',
  abandoned: 'Abandoned',
  verified: 'Verified',
};

const STATUS_COLORS = {
  initialized: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  abandoned: 'bg-gray-100 text-gray-600',
  verified: 'bg-green-100 text-green-700',
};

export default function StaffUnpaidCheckouts() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const canManage = canAccessPage(user, 'unpaid-checkouts');

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_unpaid_checkouts');
      if (error) throw error;
      setAttempts(data || []);
    } catch (e) {
      console.error('Failed to load unpaid checkouts:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const cd = a.checkout_data || {};
      const hay = `${cd.customer_name || ''} ${cd.customer_email || ''} ${cd.customer_phone || ''} ${a.reference || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unpaid Checkouts</h1>
          <p className="text-sm text-gray-500">{filtered.length} checkout attempts</p>
        </div>
        <button onClick={loadAttempts} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          These are checkout attempts where payment was not completed. Orders are only created after successful payment.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, email, or reference"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <SheetSelect
          value={statusFilter}
          onChange={setStatusFilter}
          title="Attempt status"
          triggerClassName="h-9 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'initialized', label: 'Initialized' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
            { value: 'abandoned', label: 'Abandoned' },
          ]}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No unpaid checkouts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Reference</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => {
                  const cd = a.checkout_data || {};
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 text-xs font-mono">
                          {a.reference}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{cd.customer_name || '—'}</p>
                          <p className="text-xs text-gray-500">{cd.customer_email || ''}</p>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ₦{((a.amount_kobo || 0) / 100).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(a.created_at).toLocaleDateString('en-NG')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                            className="p-1 rounded hover:bg-gray-100 text-xs font-medium text-[#2E7D32]"
                          >
                            {expandedId === a.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === a.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5 text-xs">
                                <p className="font-semibold text-gray-700 mb-1">Customer Info</p>
                                <p className="flex items-center gap-1.5 text-gray-600">
                                  <Mail className="w-3 h-3" /> {cd.customer_email || '—'}
                                </p>
                                <p className="flex items-center gap-1.5 text-gray-600">
                                  <Phone className="w-3 h-3" /> {cd.customer_phone || '—'}
                                </p>
                                <p className="flex items-start gap-1.5 text-gray-600">
                                  <MapPin className="w-3 h-3 mt-0.5" /> {cd.customer_address || '—'}
                                  {cd.landmark ? ` — ${cd.landmark}` : ''}
                                </p>
                                <p className="text-gray-500 mt-1.5">
                                  Delivery zone: {cd.delivery_zone || '—'}
                                </p>
                                {a.order_id && (
                                  <p className="text-gray-500">
                                    Linked order: {a.order_id}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs">
                                <p className="font-semibold text-gray-700 mb-1">
                                  Items ({cd.items?.length || 0})
                                </p>
                                <div className="space-y-0.5">
                                  {(cd.items || []).map((it, i) => (
                                    <p key={i} className="text-gray-600">
                                      {it.quantity}× {it.name} — ₦
                                      {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-0.5">
                                  <p className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₦{(cd.subtotal || 0).toLocaleString()}</span>
                                  </p>
                                  <p className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span>₦{(cd.delivery_fee || 0).toLocaleString()}</span>
                                  </p>
                                  <p className="flex justify-between text-gray-600">
                                    <span>Service fee</span>
                                    <span>₦{(cd.service_fee || 0).toLocaleString()}</span>
                                  </p>
                                  {(cd.discount || 0) > 0 && (
                                    <p className="flex justify-between text-green-600">
                                      <span>Discount</span>
                                      <span>−₦{(cd.discount || 0).toLocaleString()}</span>
                                    </p>
                                  )}
                                  <p className="flex justify-between font-bold text-gray-900 pt-0.5">
                                    <span>Total</span>
                                    <span>₦{((a.amount_kobo || 0) / 100).toLocaleString()}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
