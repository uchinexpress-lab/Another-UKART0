import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Upload, Loader2, Search, Trash2, Check, ImagePlus, Link2,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import SheetSelect from '@/components/SheetSelect';

const inputCls = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#2E7D32] bg-card';

const slug = (s) => (s || '').toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();

export default function AdminBulkImages() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploads, setUploads] = useState([]); // { url, filename, productId, categoryId }
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list('-created_date', 500),
      base44.entities.Category.list(),
    ]).then(([ps, cats]) => { setProducts(ps); setCategories(cats); }).catch(() => {});
  }, []);

  const suggestProduct = (filename) => {
    const base = slug(filename);
    if (!base) return '';
    const match = products.find((p) => p.name?.toLowerCase().includes(base) || base.includes(p.name?.toLowerCase()));
    return match?.id || '';
  };

  const handleFiles = async (files) => {
    setBusy(true);
    const items = [];
    for (const file of Array.from(files)) {
      try {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        items.push({ url: file_url, filename: file.name, productId: suggestProduct(file.name), categoryId: '' });
      } catch (e) { console.error(e); }
    }
    setUploads((prev) => [...items, ...prev]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    toast({ title: `${items.length} images uploaded` });
  };

  const updateRow = (i, patch) => setUploads((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  const toggleSelect = (i) => setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  const bulkAssignProduct = (pid) => {
    setUploads((prev) => prev.map((r, i) => (selected.includes(i) ? { ...r, productId: pid } : r)));
    setSelected([]);
  };

  const applyAssignments = async () => {
    const toApply = uploads.filter((u) => u.productId);
    if (!toApply.length) { toast({ title: 'Assign a product to each image first', variant: 'destructive' }); return; }
    setBusy(true);
    let count = 0;
    const byProduct = {};
    toApply.forEach((u) => { (byProduct[u.productId] ||= []).push(u.url); });
    for (const pid of Object.keys(byProduct)) {
      try {
        const p = await base44.entities.Product.get(pid);
        const existing = p.images || (p.image ? [p.image] : []);
        const merged = [...existing, ...byProduct[pid]];
        await base44.entities.Product.update(pid, {
          images: merged,
          image: merged[0],
        });
        count += byProduct[pid].length;
      } catch (e) { console.error(e); }
    }
    setBusy(false);
    toast({ title: `${count} images assigned to products` });
    setUploads((prev) => prev.filter((u) => !u.productId));
  };

  const filtered = uploads.filter((u) => !search || slug(u.filename).includes(search.toLowerCase()));

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-foreground mb-1">Photography Gallery</h1>
      <p className="text-xs text-muted-foreground mb-3">Upload many photos, then assign each to a product</p>

      <AdminNav />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full py-8 rounded-2xl border-2 border-dashed border-[#2E7D32]/40 text-[#2E7D32] text-sm font-semibold flex flex-col items-center justify-center gap-2 mb-4 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
        {busy ? 'Uploading…' : 'Upload 20, 50, 100+ images at once'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />

      {uploads.length > 0 && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by filename…" className={`${inputCls} pl-8`} />
            </div>
            {selected.length > 0 && (
              <SheetSelect onChange={(v) => v && bulkAssignProduct(v)} placeholder="Bulk assign…" title="Bulk assign product" triggerClassName={`${inputCls} w-40`} options={products.map((p) => ({ value: p.id, label: p.name }))} />
            )}
            <button onClick={applyAssignments} disabled={busy} className="px-3 rounded-lg bg-[#2E7D32] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50">
              <Link2 className="w-3.5 h-3.5" /> Apply
            </button>
          </div>

          <div className="space-y-2">
            {filtered.map((u, idx) => {
              const realIndex = uploads.indexOf(u);
              const isSel = selected.includes(realIndex);
              return (
                <div key={realIndex} className={`flex items-center gap-3 bg-card rounded-xl border p-2.5 ${isSel ? 'border-[#2E7D32]' : 'border-border'}`}>
                  <button onClick={() => toggleSelect(realIndex)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? 'bg-[#2E7D32] border-[#2E7D32]' : 'border-gray-300'}`}>
                    {isSel && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={u.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs font-semibold text-foreground truncate">{u.filename}</div>
                    <SheetSelect value={u.productId || ''} onChange={(v) => updateRow(realIndex, { productId: v })} placeholder="Assign to product…" title="Assign product" triggerClassName={inputCls} options={products.map((p) => ({ value: p.id, label: p.name }))} />
                    <SheetSelect value={u.categoryId || ''} onChange={(v) => updateRow(realIndex, { categoryId: v })} placeholder="Category (optional)…" title="Category" triggerClassName={inputCls} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                  </div>
                  <button onClick={() => removeRow(realIndex)} className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {uploads.length === 0 && !busy && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <ImagePlus className="w-10 h-10 opacity-40 mb-2" />
          <span className="text-sm">No uploads yet — select images above</span>
        </div>
      )}
    </div>
  );
}