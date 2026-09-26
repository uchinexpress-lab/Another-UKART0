import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Trash2, Loader2, ChevronUp, ChevronDown, Eye, EyeOff, Save, Upload,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminNav from '@/components/admin/AdminNav';

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#2E7D32] bg-card';

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Category.list();
      list.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
      setCats(list);
    } catch { toast({ title: 'Failed to load categories', variant: 'destructive' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCat = async () => {
    if (!newName.trim()) return;
    try {
      await base44.entities.Category.create({
        name: newName.trim(),
        slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        display_order: cats.length,
      });
      setNewName('');
      toast({ title: 'Category created' });
      load();
    } catch { toast({ title: 'Failed to create', variant: 'destructive' }); }
  };

  const updateCat = async (id, patch) => {
    setSavingId(id);
    try {
      await base44.entities.Category.update(id, patch);
      setCats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    } catch { toast({ title: 'Failed to update', variant: 'destructive' }); }
    setSavingId(null);
  };

  const removeCat = async (c) => {
    if (!confirm(`Delete "${c.name}"? Products will keep their category reference but it will no longer appear as a category.`)) return;
    try { await base44.entities.Category.delete(c.id); load(); toast({ title: 'Category deleted' }); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[i], next[j]] = [next[j], next[i]];
    setCats(next);
    await Promise.all([
      updateCat(next[i].id, { display_order: i }),
      updateCat(next[j].id, { display_order: j }),
    ]);
  };

  const uploadImage = async (c, file) => {
    if (!file) return;
    setSavingId(c.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await updateCat(c.id, { image: file_url });
    } catch { toast({ title: 'Upload failed', variant: 'destructive' }); }
    setSavingId(null);
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-foreground mb-1">Categories</h1>
      <p className="text-xs text-muted-foreground mb-3">Create, rename, reorder & hide categories</p>

      <AdminNav />

      {/* Create */}
      <div className="flex gap-2 mb-4">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" className={inputCls} />
        <button onClick={createCat} className="px-4 rounded-xl bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>
      ) : (
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                  {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Upload className="w-4 h-4 text-muted-foreground/40" /></div>}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center"
                  >
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(c, e.target.files?.[0])} />
                  </button>
                </div>
                <input
                  value={c.name}
                  onChange={(e) => setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                  onBlur={(e) => updateCat(c.id, { name: e.target.value })}
                  className={`${inputCls} flex-1`}
                />
                {savingId === c.id && <Loader2 className="w-4 h-4 animate-spin text-[#2E7D32] shrink-0" />}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCat(c.id, { is_hidden: !c.is_hidden })}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${c.is_hidden ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {c.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {c.is_hidden ? 'Hidden' : 'Visible'}
                  </button>
                  <button onClick={() => removeCat(c)} className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}