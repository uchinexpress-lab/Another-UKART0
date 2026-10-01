import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffAudit';
import {
  ArrowLeft, Loader2, Mail, Phone, Send, StickyNote, User,
  Package, Clock,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting for Customer' },
  { value: 'waiting_internal', label: 'Waiting for Internal Action' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function StaffTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [linkedOrder, setLinkedOrder] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const t = await base44.entities.Ticket.get(id);
      setTicket(t);
      const msgRes = await base44.entities.TicketMessage.filter(
        { ticket_id: id },
        { sort: 'created_date', limit: 200 }
      );
      setMessages(msgRes.items || []);
      if (t.order_id) {
        try {
          const order = await base44.entities.Order.get(t.order_id);
          setLinkedOrder(order);
        } catch (e) {}
      }
      if (t.user_email) {
        try {
          const ordRes = await base44.entities.Order.filter(
            { customer_email: t.user_email },
            { sort: '-created_date', limit: 5 }
          );
          setCustomerOrders(ordRes.items || []);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await base44.entities.TicketMessage.create({
        ticket_id: id,
        ticket_owner_id: ticket.created_by_id,
        sender: 'staff',
        sender_name: user?.full_name || user?.email,
        body: reply.trim(),
        internal: false,
      });
      setMessages((prev) => [...prev, msg]);
      await base44.entities.Ticket.update(id, {
        last_message_at: new Date().toISOString(),
        status: ticket.status === 'new' ? 'open' : ticket.status,
      });
      setTicket((prev) => ({ ...prev, status: prev.status === 'new' ? 'open' : prev.status }));
      await logStaffAction('ticket_replied', {
        entity_type: 'Ticket', record_id: id, record_name: ticket.subject,
      });
      setReply('');
    } catch (e) {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const addInternalNote = async () => {
    if (!internalNote.trim()) return;
    setSending(true);
    try {
      const msg = await base44.entities.TicketMessage.create({
        ticket_id: id,
        ticket_owner_id: ticket.created_by_id,
        sender: 'staff',
        sender_name: user?.full_name || user?.email,
        body: internalNote.trim(),
        internal: true,
      });
      setMessages((prev) => [...prev, msg]);
      await logStaffAction('ticket_internal_note', {
        entity_type: 'Ticket', record_id: id, record_name: ticket.subject,
      });
      setInternalNote('');
    } catch (e) {
      alert('Failed to add note');
    } finally {
      setSending(false);
    }
  };

  const updateField = async (field, value) => {
    setUpdating(true);
    const prevValue = ticket[field];
    try {
      const updates = { [field]: value };
      if (field === 'status' && value === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      await base44.entities.Ticket.update(id, updates);
      setTicket((prev) => ({ ...prev, ...updates }));
      await logStaffAction(`ticket_${field}_changed`, {
        entity_type: 'Ticket', record_id: id, record_name: ticket.subject,
        previous_value: String(prevValue), new_value: String(value),
      });
    } catch (e) {
      alert('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-400">Ticket not found.</p>
        <Link to="/admin/tickets" className="text-[#2E7D32] text-sm font-medium mt-2 inline-block">
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ticket.user_name || ticket.user_email} · {new Date(ticket.created_date).toLocaleString('en-NG')}
            </p>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[500px] overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No messages yet</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                      m.internal
                        ? 'bg-amber-50 border border-amber-200 text-amber-900'
                        : m.sender === 'user'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-[#2E7D32] text-white'
                    }`}
                  >
                    {m.internal && (
                      <p className="text-[10px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> INTERNAL NOTE
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.internal ? 'text-amber-600' : m.sender === 'user' ? 'text-gray-400' : 'text-white/60'}`}>
                      {m.sender_name || (m.sender === 'user' ? 'Customer' : 'Staff')} ·{' '}
                      {new Date(m.created_date).toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Reply */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Reply to Customer</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Type your response..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="mt-2 h-9 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Reply
              </button>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <label className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                <StickyNote className="w-3 h-3" /> Internal Note (not visible to customer)
              </label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={2}
                placeholder="Add an internal note..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 bg-amber-50/30 outline-none focus:border-amber-400"
              />
              <button
                onClick={addInternalNote}
                disabled={sending || !internalNote.trim()}
                className="mt-2 h-9 px-4 rounded-lg bg-amber-100 text-amber-800 text-sm font-bold disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info + Actions */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-900 font-medium">
                <User className="w-4 h-4 text-gray-400" /> {ticket.user_name || '—'}
              </p>
              <p className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" /> {ticket.user_email || '—'}
              </p>
              {ticket.customer_phone && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {ticket.customer_phone}
                </p>
              )}
            </div>
            {customerOrders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Recent Orders</p>
                <div className="space-y-1">
                  {customerOrders.map((o) => (
                    <div key={o.id} className="text-xs text-gray-600 flex justify-between">
                      <span>{o.order_number}</span>
                      <span>₦{(o.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Linked Order */}
          {linkedOrder && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Linked Order</h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-gray-900">{linkedOrder.order_number}</p>
                <p className="text-xs text-gray-600">Status: {linkedOrder.status}</p>
                <p className="text-xs text-gray-600">Payment: {linkedOrder.payment_status}</p>
                <p className="text-xs text-gray-600">Total: ₦{(linkedOrder.total || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Items: {linkedOrder.items?.length || 0}</p>
              </div>
            </div>
          )}

          {/* Ticket Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Ticket Actions</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => updateField('status', e.target.value)}
                disabled={updating}
                className="w-full h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
              <select
                value={ticket.priority || 'medium'}
                onChange={(e) => updateField('priority', e.target.value)}
                disabled={updating}
                className="w-full h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
              >
                {PRIORITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Assigned Staff</label>
              <input
                value={ticket.assigned_staff_name || ''}
                onChange={(e) => updateField('assigned_staff_name', e.target.value)}
                disabled={updating}
                placeholder="Unassigned"
                className="w-full h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}