import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import SheetSelect from '@/components/SheetSelect';
import {
  ArrowLeft,
  Plus,
  Send,
  MessageCircle,
  Headset,
  Loader2,
  CheckCircle2,
  XCircle,
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

export default function SupportTickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [me, setMe] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('open');
  const view = searchParams.get('view') || 'list';
  const activeTicketId = searchParams.get('ticket');
  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [newMessage, setNewMessage] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setMe(u))
      .catch(() => {});
  }, []);

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
      ticket_owner_id: me?.id || activeTicket.created_by_id,
      sender: 'user',
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
        ticket_owner_id: me?.id || activeTicket.created_by_id,
        sender: 'user',
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
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? { ...t, last_message_at: now, status: 'open' }
            : t
        )
      );
      try {
        await base44.functions.invoke('notifyTicketReply', {
          ticket_id: activeTicket.id,
          sender: 'user',
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

  const createTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSending(true);
    try {
      const ticket = await base44.entities.Ticket.create({
        subject: newSubject.trim(),
        category: newCategory,
        status: 'open',
        user_email: me?.email || '',
        user_name: me?.full_name || me?.email || '',
        last_message_at: new Date().toISOString(),
        closed_reason: 'manual',
      });
      await base44.entities.TicketMessage.create({
        ticket_id: ticket.id,
        ticket_owner_id: me?.id || ticket.created_by_id,
        sender: 'user',
        body: newMessage.trim(),
      });
      try {
        await base44.functions.invoke('notifyTicketReply', {
          ticket_id: ticket.id,
          sender: 'user',
          body: newMessage.trim(),
        });
      } catch (e) {
        console.error(e);
      }
      setNewSubject('');
      setNewCategory('other');
      setNewMessage('');
      await loadTickets();
      setSearchParams({ view: 'chat', ticket: ticket.id });
    } catch {
      alert('Could not create ticket. Please try again.');
    }
    setSending(false);
  };

  const visibleTickets = tickets.filter((t) =>
    tab === 'open' ? t.status === 'open' : t.status === 'closed'
  );

  const inputClass =
    'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]';

  // ---- New ticket view ----
  if (view === 'new') {
    return (
      <div className="p-4 pb-10">
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setSearchParams({})}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">New Support Ticket</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Subject
            </label>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Category
            </label>
            <SheetSelect
              value={newCategory}
              onChange={setNewCategory}
              options={CATEGORIES}
              placeholder="Select category"
              title="Choose category"
              triggerClassName="w-full flex items-center justify-between text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Message
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </div>
          <button
            onClick={createTicket}
            disabled={!newSubject.trim() || !newMessage.trim() || sending}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Starting chat...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Start Chat
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

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
              {CATEGORIES.find((c) => c.value === activeTicket.category)?.label ||
                'Other'}
            </p>
          </div>
          {closed ? (
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Closed
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Open
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m) => {
            const mine = m.sender === 'user';
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
            <p className="text-xs text-gray-500 mb-2">
              This ticket is closed. Start a new one to continue.
            </p>
            <button
              onClick={() => setSearchParams({ view: 'new' })}
              className="text-sm font-semibold text-[#2E7D32]"
            >
              + New Ticket
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Support</h1>
        <button
          onClick={() => setSearchParams({ view: 'new' })}
          className="flex items-center gap-1 text-sm font-semibold text-[#2E7D32]"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

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
          <p className="text-sm font-semibold text-gray-900 mb-1">
            No {tab} tickets
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {tab === 'open'
              ? 'Need help? Start a chat with our support team.'
              : 'Closed tickets will appear here.'}
          </p>
          {tab === 'open' && (
            <button
              onClick={() => setSearchParams({ view: 'new' })}
              className="bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Start a Ticket
            </button>
          )}
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    {CATEGORIES.find((c) => c.value === t.category)?.label ||
                      'Other'}
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