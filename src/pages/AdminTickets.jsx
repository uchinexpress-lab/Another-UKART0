import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Headset,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'order', label: 'Order Issue' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'payment', label: 'Payment' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
];

const timeFmt = (d) =>
  d
    ? new Date(d).toLocaleString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      })
    : '';

export default function AdminTickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('open');
  const view = searchParams.get('view') || 'list';
  const activeTicketId = searchParams.get('ticket');
  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const endRef = useRef(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const t = await base44.entities.Ticket.list('-last_message_at');
      setTickets(t);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Load messages when entering a chat
  useEffect(() => {
    if (view === 'chat' && activeTicketId) {
      base44.entities.TicketMessage
        .filter({ ticket_id: activeTicketId })
        .then((msgs) =>
          setMessages(
            msgs.sort(
              (a, b) => new Date(a.created_date) - new Date(b.created_date)
            )
          )
        )
        .catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [view, activeTicketId]);

  // Realtime subscription
  useEffect(() => {
    if (!activeTicketId) return;
    const unsub = base44.entities.TicketMessage.subscribe((event) => {
      if (event.data?.ticket_id !== activeTicketId) return;
      if (event.type === 'create') {
        setMessages((prev) =>
          prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]
        );
      } else if (event.type === 'update') {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.data.id ? event.data : m))
        );
      }
    });
    return unsub;
  }, [activeTicketId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || !activeTicket) return;
    const body = draft.trim();
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      ticket_id: activeTicket.id,
      ticket_owner_id: activeTicket.created_by_id,
      sender: 'admin',
      body,
      created_date: new Date().toISOString(),
      _pending: true,
    };
    setDraft('');
    setSending(true);
    setMessages((prev) => [...prev, optimistic]);
    try {
      const msg = await base44.entities.TicketMessage.create({
        ticket_id: activeTicket.id,
        ticket_owner_id: activeTicket.created_by_id,
        sender: 'admin',
        body,
      });
      setMessages((prev) => {
        let next = prev.filter((m) => m.id !== tempId);
        if (!next.some((m) => m.id === msg.id)) next = [...next, msg];
        else next = next.map((m) => (m.id === msg.id ? msg : m));
        return next;
      });
      const now = new Date().toISOString();
      await base44.entities.Ticket.update(activeTicket.id, {
        last_message_at: now,
        status: 'open',
        closed_reason: 'manual',
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? { ...t, last_message_at: now, status: 'open', closed_reason: 'manual' }
            : t
        )
      );
      try {
        await base44.functions.invoke('notifyTicketReply', {
          ticket_id: activeTicket.id,
          sender: 'admin',
          body,
        });
      } catch (e) {
        console.error(e);
      }
      loadTickets();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      alert('Could not send message. Please try again.');
    }
    setSending(false);
  };

  const closeTicket = async () => {
    if (!activeTicket) return;
    setClosing(true);
    try {
      await base44.entities.Ticket.update(activeTicket.id, {
        status: 'closed',
        closed_reason: 'manual',
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? { ...t, status: 'closed', closed_reason: 'manual' }
            : t
        )
      );
      loadTickets();
    } catch {
      alert('Could not close ticket.');
    }
    setClosing(false);
  };

  const visibleTickets = tickets.filter((t) =>
    tab === 'open' ? t.status === 'open' : t.status === 'closed'
  );

  // ---- Chat view ----
  if (view === 'chat' && activeTicket) {
    const closed = activeTicket.status === 'closed';
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button
            onClick={() => setSearchParams({})}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-gray-900 line-clamp-1">
              {activeTicket.subject}
            </h1>
            <p className="text-[11px] text-gray-500">
              {activeTicket.user_name || 'Customer'} · {activeTicket.user_email || ''}
            </p>
          </div>
          {!closed && (
            <button
              onClick={closeTicket}
              disabled={closing}
              className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-full flex items-center gap-1 disabled:opacity-50"
            >
              <Lock className="w-3 h-3" /> Close
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m) => {
            const mine = m.sender === 'admin';
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    mine
                      ? 'bg-[#2E7D32] text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                  } ${m._pending ? 'opacity-60' : ''}`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {m.body}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      mine ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {timeFmt(m.created_date)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {closed ? (
          <div className="p-4 border-t border-gray-100 bg-white text-center">
            <p className="text-xs text-gray-500">This ticket is closed.</p>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Reply to customer..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 text-sm border border-gray-200 rounded-2xl px-3.5 py-2.5 outline-none focus:border-[#2E7D32] resize-none max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- List view ----
  return (
    <div className="p-4 pb-10">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Support Tickets</h1>

      <div className="flex bg-gray-100 rounded-full p-1 mb-4">
        {['open', 'closed'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
              tab === t ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'open' ? 'Open' : 'Closed'}
            <span className="ml-1 text-gray-400">
              ({tickets.filter((x) => x.status === t).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
        </div>
      ) : visibleTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-3">
            <Headset className="w-8 h-8 text-[#2E7D32]" />
          </div>
          <p className="text-sm font-semibold text-gray-900">No {tab} tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ view: 'chat', ticket: t.id })}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#2E7D32]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                    {t.subject}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {t.user_name || 'Customer'}
                    {t.user_email ? ` · ${t.user_email}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {timeFmt(t.last_message_at || t.created_date)}
                  </p>
                </div>
                {t.status === 'open' ? (
                  <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    Open
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Closed
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}