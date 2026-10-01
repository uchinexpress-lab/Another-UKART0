import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const fields = [['name', 'Name'], ['phone', 'Phone'], ['vehicle_number', 'Vehicle Number'], ['emergency_contact', 'Emergency Contact'], ['address', 'Address']];
export default function RiderSettings() {
  const { rider } = useOutletContext();
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, rider[key] || ''])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function save(e) {
    e.preventDefault(); setSaving(true); setMessage('');
    try { await base44.functions.invoke('updateRiderAccount', { action: 'profile', profile: form }); setMessage('Settings saved'); }
    catch (error) { setMessage(error.message || 'Unable to save settings'); }
    finally { setSaving(false); }
  }
  return <div className="space-y-4 p-4"><h1 className="text-lg font-bold">Rider Settings</h1><form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-4">
    {fields.map(([key, label]) => <div key={key}><label htmlFor={`rider-${key}`} className="mb-1 block text-sm">{label}</label><Input id={`rider-${key}`} required={key === 'name' || key === 'phone'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}
    <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save Settings'}</Button>{message && <p role="status" className="text-sm">{message}</p>}
  </form></div>;
}