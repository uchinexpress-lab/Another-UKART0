import { base44 } from '@/api/base44Client';

// All privileged staff writes go through the staffWrite backend function, which
// checks the caller's Ukart staffRole server-side before touching the record.
// The entity RLS rules can only see the Base44 role ("admin" for every staff
// member), so the browser must not write these entities directly.
export async function staffWrite(entity, action, id, data) {
  const res = await base44.functions.invoke('staffWrite', { entity, action, id, data });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data?.record;
}