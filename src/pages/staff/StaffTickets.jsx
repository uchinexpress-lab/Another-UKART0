import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffAudit';
import { Search, RefreshCw, Loader2, Plus, AlertCircle } from 'lucide-react';

const TICKET_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting for Customer' },
  { value: 'waiting_internal', label: 'Waiting for Internal Action' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'damaged_item', label: 'Damaged Item' },
  { value: 'late_delivery', label: 'Late Delivery' },
  { value: 'delivery_problem', label: 'Delivery Problem' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'cancellation_request', label: 'Cancellation Request' },
  { value: 'product_issue', label: 'Product Issue' },
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'rider_issue', label: 'Rider Issue' },
  { value: 'general_question', label: 'General Question' },
  { value: 'other', label: 'Other' },
];

function StatusBadge({ status }) {
  const styles = {
    new: 'bg-blue-100 text-blue-700',
    open: 'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-amber-100 text-amber-700',
    waiting_customer: 'bg-orange-100 text-orange-700',
    waiting_internal: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  const label = TICKET_STATUSES.find((s) => s.value === status)?.label || status;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[priority] || styles.medium}`}>
      {(priority || 'medium').toUpperCase()}
    </span>
  );
}

export default function StaffTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Ticket.filter({}, { sort: '-created_date', limit: 100 });
      setTickets(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${t.subject || ''} ${t.user_name || ''} ${t.user_email || ''} ${t.order_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    open: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    urgent: tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500">{filtered.length} tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
          <button onClick={loadTickets} className="p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-900' },
          { label: 'New', value: counts.new, color: 'text-blue-600' },
          { label: 'Open/Active', value: counts.open, color: 'text-indigo-600' },
          { label: 'Urgent', value: counts.urgent, color: 'text-red-600' },
          { label: 'Resolved', value: counts.resolved, color: 'text-green-600' },
          { label: 'Closed', value: counts.closed, color: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, customer, email, order #"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]">
          {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]">
          {PRIORITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]">
          {CATEGORIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Assigned</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/staff/tickets/${t.id}`} className="font-medium text-[#2E7D32] hover:underline">
                        {t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved' && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 inline mr-1" />
                        )}
                        {t.subject}
                      </Link>
                      {t.order_number && (
                        <p className="text-xs text-gray-500">Order: {t.order_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{t.user_name || '—'}</p>
                      <p className="text-xs text-gray-500">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {t.assigned_staff_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(t.created_date).toLocaleDateString('en-NG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={loadTickets} />}
    </div>
  );
}

function CreateTicketModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: '', category: 'order_issue', priority: 'medium',
    user_email: '', user_name: '', customer_phone: '',
    order_number: '', body: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ticket = await base44.entities.Ticket.create({
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        status: 'new',
        user_email: form.user_email,
        user_name: form.user_name,
        customer_phone: form.customer_phone,
        order_number: form.order_number,
        assigned_staff_id: user?.id,
        assigned_staff_name: user?.full_name || user?.email,
        last_message_at: new Date().toISOString(),
      });
      if (form.body) {
        await base44.entities.TicketMessage.create({
          ticket_id: ticket.id,
          ticket_owner_id: ticket.created_by_id,
          sender: 'staff',
          sender_name: user?.full_name || user?.email,
          body: form.body,
          internal: false,
        });
      }
      await logStaffAction('ticket_created', {
        entity_type: 'Ticket', record_id: ticket.id, record_name: form.subject,
      });
      onCreated();
      onClose();
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input required placeholder="Subject" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Customer email" value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
            <input placeholder="Customer name" value={form.user_name}
              onChange={(e) => setForm({ ...form, user_name: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Customer phone" value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
            <input placeholder="Order # (optional)" value={form.order_number}
              onChange={(e) => setForm({ ...form, order_number: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]">
              {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <textarea required placeholder="Initial message / description" value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">Cancel</button>
            <button type="submit" disabled={saving}
              className="h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}