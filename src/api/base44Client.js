import { supabase } from './supabaseClient';

// ---------- query translation ----------
// Base44 used mongo-style operators; translate to PostgREST filters.

function applyFilters(query, filters = {}) {
  let q = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      q = q.is(key, null);
    } else if (Array.isArray(value)) {
      q = q.in(key, value);
    } else if (typeof value === 'object') {
      for (const [op, v] of Object.entries(value)) {
        switch (op) {
          case '$gte': q = q.gte(key, v); break;
          case '$lte': q = q.lte(key, v); break;
          case '$gt': q = q.gt(key, v); break;
          case '$lt': q = q.lt(key, v); break;
          case '$ne': q = q.neq(key, v); break;
          case '$in': q = q.in(key, v); break;
          case '$nin': q = q.not(key, 'in', `(${v.join(',')})`); break;
          case '$contains': q = q.contains(key, v); break;
          default: q = q.eq(key, v);
        }
      }
    } else {
      q = q.eq(key, value);
    }
  }
  return q;
}

function applyOptions(q, options = {}) {
  if (options.sort) {
    let field = options.sort;
    let ascending = true;
    if (field.startsWith('-')) { field = field.slice(1); ascending = false; }
    q = q.order(field || 'created_date', { ascending, nullsFirst: false });
  }
  if (options.limit) q = q.limit(options.limit);
  if (options.page && options.limit) {
    q = q.range((options.page - 1) * options.limit, options.page * options.limit - 1);
  }
  return q;
}

const err = (error) => {
  const e = new Error(error?.message || 'Database request failed');
  e.status = error?.code === 'PGRST301' || error?.code === '42501' ? 403 : 400;
  e.data = error;
  throw e;
};

// ---------- entity adapter ----------
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeEntity(tableName) {
  return {
    async list(sort = '-created_date', limit) {
      let field = sort;
      let ascending = true;
      if (field.startsWith('-')) { field = field.slice(1); ascending = false; }
      let q = supabase.from(tableName).select('*').order(field || 'created_date', { ascending, nullsFirst: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) err(error);
      return data || [];
    },

    async get(id) {
      let q = supabase.from(tableName).select('*');
      q = (typeof id === 'string' && uuidPattern.test(id))
        ? q.eq('id', id)
        : q.or(id.includes('@') ? `email.eq.${id}` : `id.eq.${id}`);
      const { data, error } = await q.maybeSingle();
      if (error) err(error);
      if (!data) { const e = new Error('Not found'); e.status = 404; throw e; }
      return data;
    },

    async filter(filters = {}, options = {}) {
      const q = applyOptions(applyFilters(supabase.from(tableName).select('*'), filters), options);
      const { data, error } = await q;
      if (error) err(error);
      return { items: data || [], count: data?.length || 0, total: data?.length || 0 };
    },

    async count(filters = {}) {
      const q = applyFilters(supabase.from(tableName).select('*', { count: 'exact', head: true }), filters);
      const { count, error } = await q;
      if (error) err(error);
      return count || 0;
    },

    async create(payload) {
      const { data, error } = await supabase.from(tableName).insert(payload).select().single();
      if (error) err(error);
      return data;
    },

    async update(id, patch) {
      const { data, error } = await supabase.from(tableName).update(patch).eq('id', id).select().single();
      if (error) err(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) err(error);
      return { success: true };
    },

    // Live updates: re-fire a callback when any row in the table changes.
    subscribe(callback) {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
          const type = payload.eventType?.replace('INSERT', 'create').replace('UPDATE', 'update').replace('DELETE', 'delete') || 'update';
          callback({ type, data: payload.new || payload.old || null });
          callback({ type: 'sync', data: payload.new || payload.old || null });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },

    async aggregate({ query = {}, sum, count, avg, min, max, dateBucket, limit = 100 }) {
      // Translate a simple group-by aggregate into a PostgREST select expression.
      const aggregates = [];
      if (sum) aggregates.push(`${sum}.sum()`);
      if (avg) aggregates.push(`${avg}.avg()`);
      if (min) aggregates.push(`${min}.min()`);
      if (max) aggregates.push(`${max}.max()`);
      if (count) aggregates.push(`${count}.count()`);

      let selectFields = '*';
      if (dateBucket?.field) {
        const unit = dateBucket.unit || 'day';
        // Truncate the timestamp to the requested bucket as an ISO string.
        const truncMap = { day: 'day', week: 'week', month: 'month', year: 'year', hour: 'hour' };
        const trunc = truncMap[unit] || 'day';
        selectFields = `${dateBucket.field}::date as bucket_date, ${aggregates.join(', ')}`;
        void trunc;
      }

      let q = supabase.from(tableName).select(selectFields);
      q = applyFilters(q, query);
      if (limit) q = q.limit(limit);

      const { data, error } = await q;
      if (error) err(error);

      // Group and reduce in JS — the dataset here is bounded (e.g. 31 days of orders).
      const groups = new Map();
      for (const row of data || []) {
        const key = dateBucket?.field
          ? (row[dateBucket.field] || '').split('T')[0]
          : 'all';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }

      const rows = [];
      for (const [key, groupRows] of groups) {
        const r = {};
        if (dateBucket?.field) {
          r[dateBucket.field] = key;
          r.bucket_date = key;
        }
        if (sum) r[`${sum}_sum`] = groupRows.reduce((a, x) => a + (Number(x[sum]) || 0), 0);
        if (count) r[`${count}_count`] = groupRows.length;
        if (avg) r[`${avg}_avg`] = groupRows.reduce((a, x) => a + (Number(x[avg]) || 0), 0) / groupRows.length;
        if (min) r[`${min}_min`] = Math.min(...groupRows.map((x) => Number(x[min]) || 0));
        if (max) r[`${max}_max`] = Math.max(...groupRows.map((x) => Number(x[max]) || 0));
        rows.push(r);
      }

      return { rows };
    },
  };
}

// ---------- auth adapter ----------
// Maps Base44 auth calls onto Supabase Auth. Returns the profile row from
// public.users (auto-created by the on_auth_user_created DB trigger).

const mapAuthUser = (sessionUser, profile) => ({
  id: sessionUser.id,
  email: sessionUser.email,
  role: profile?.role || 'user',
  staff_role: profile?.staff_role || null,
  staffRole: profile?.staff_role || null,
  admin_approval_status: profile?.admin_approval_status || null,
  full_name: profile?.full_name || sessionUser.user_metadata?.full_name || '',
  phone: profile?.phone || sessionUser.phone || '',
  date_of_birth: profile?.date_of_birth || '',
  avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
  saved_addresses: profile?.saved_addresses || [],
  saved_cards: profile?.saved_cards || [],
  notification_preferences: profile?.notification_preferences || {},
  language: profile?.language || 'en',
  deletion_requested: profile?.deletion_requested || false,
  created_date: profile?.created_date || sessionUser.created_at,
  updated_date: profile?.updated_date || sessionUser.updated_at,
  email_confirmed: !!sessionUser.email_confirmed_at,
  is_auth__email_verified: !!sessionUser.email_confirmed_at,
});

async function fetchProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) return null;
  return data;
}

async function currentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const profile = await fetchProfile(session.user.id);
  return mapAuthUser(session.user, profile);
}

const auth = {
  async me() { return currentUser(); },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  },

  async updateMe(patch) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    const allowed = { full_name: 1, phone: 1, date_of_birth: 1, avatar_url: 1, saved_addresses: 1, saved_cards: 1, notification_preferences: 1, language: 1 };
    const profilePatch = Object.fromEntries(Object.entries(patch || {}).filter(([k]) => allowed[k]));
    if (Object.keys(profilePatch).length) {
      const { data, error } = await supabase.from('users').update(profilePatch).eq('id', session.user.id).select().single();
      if (error) err(error);
      return mapAuthUser(session.user, data);
    }
    return currentUser();
  },

  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: full_name || '' } },
    });
    if (error) throw error;
    // The DB trigger auto-creates the profile row.
    if (data.session?.user) {
      const profile = await fetchProfile(data.session.user.id);
      return { user: mapAuthUser(data.session.user, profile), needsVerification: !data.session };
    }
    // Email confirmation is off in this project; a session should exist. If it
    // does not (e.g. the provider required confirmation), report that.
    return { user: data.user ? mapAuthUser(data.user, null) : null, needsVerification: !data.session };
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await fetchProfile(data.user.id);
    return mapAuthUser(data.user, profile);
  },

  async loginWithProvider(provider, returnTo) {
    const redirectTo = `${window.location.origin}/auth/callback${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
  },

  async setToken() {
    // Supabase JS manages tokens itself; kept for call-site compatibility.
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  },

  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  },

  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
    if (error) throw error;
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      return { user: mapAuthUser(data.user, profile), access_token: data.session?.access_token };
    }
    return { user: null };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ email, type: 'signup' });
    if (error) throw error;
    return { success: true };
  },

  // Fired by the SDK before; Supabase handles redirects natively.
  async redirectToLogin(returnTo) {
    window.location.href = `/login${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''}`;
  },

  _supabase: supabase,
};

// ---------- functions adapter ----------
const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function invokeEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const response = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!response.ok) {
    const e = new Error(json?.error || `Edge function ${name} failed (${response.status})`);
    e.status = response.status;
    e.data = json;
    throw e;
  }
  return json;
}

// ---------- uploads ----------
async function uploadToBucket(file, opts = {}) {
  const bucket = 'app-media';
  const ext = file.name?.split('.').pop() || 'bin';
  const path = `${opts.folder || 'uploads'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const integrations = {
  Core: {
    async UploadFile({ file }) {
      return { file_url: await uploadToBucket(file, { folder: 'private' }) };
    },
    async UploadPublicFile({ file }) {
      return { file_url: await uploadToBucket(file, { folder: 'public' }) };
    },
  },
};

// ---------- exports ----------
const entityTables = {
  User: 'users',
  Category: 'categories',
  Product: 'products',
  Package: 'packages',
  Banner: 'banners',
  Review: 'reviews',
  DealAlert: 'deal_alerts',
  HomepageSection: 'homepage_sections',
  DeliverySetting: 'delivery_settings',
  PromotionSetting: 'promotion_settings',
  NotificationSetting: 'notification_settings',
  Order: 'orders',
  Payment: 'payments',
  Voucher: 'vouchers',
  Rider: 'riders',
  Delivery: 'deliveries',
  DeliveryAuditLog: 'delivery_audit_logs',
  DeliveryOtp: 'delivery_otps',
  DeliveryReview: 'delivery_reviews',
  Referral: 'referrals',
  BirthdayReward: 'birthday_rewards',
  CustomerDOB: 'customer_dobs',
  Ticket: 'tickets',
  TicketMessage: 'ticket_messages',
  StaffAuditLog: 'staff_audit_logs',
  PageContent: 'page_contents',
};

const entities = Object.fromEntries(
  Object.entries(entityTables).map(([name, table]) => [name, makeEntity(table)])
);

export const base44 = {
  entities,
  auth,
  functions: { invoke: invokeEdgeFunction },
  integrations,
};

export default base44;
