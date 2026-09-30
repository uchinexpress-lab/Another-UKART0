import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Shuffle, Plus, Trash2, X, Search, GripVertical, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import { useToast } from '@/components/ui/use-toast';

const SECTION_CONFIG = {
  weekly_deals: { label: 'Weekly Deals' },
  more_to_explore: { label: 'More to Explore' },
};

export default function AdminHomepage() {
  const { toast } = useToast();
  const [sections, setSections] = useState({ weekly_deals: [], more_to_explore: [] });
  const [sectionIds, setSectionIds] = useState({ weekly_deals: null, more_to_explore: null });
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(null);
  const [pickerSection, setPickerSection] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    const [sectionRecs, products] = await Promise.all([
      base44.entities.HomepageSection.list(),
      base44.entities.Product.list(),
    ]);
    if (sectionRecs.length === 0) {
      const wdIds = products.filter(p => p.is_weekly_deal).map(p => p.id);
      const mteIds = products.filter(p => !p.is_hidden && p.status !== 'coming_soon').map(p => p.id);
      await base44.entities.HomepageSection.bulkCreate([
        { section: 'weekly_deals', product_ids: wdIds },
        { section: 'more_to_explore', product_ids: mteIds },
      ]);
      const fresh = await base44.entities.HomepageSection.list();
      const sMap = {}, idMap = {};
      fresh.forEach(s => { sMap[s.section] = s.product_ids || []; idMap[s.section] = s.id; });
      setSections(sMap);
      setSectionIds(idMap);
    } else {
      const sMap = {}, idMap = {};
      sectionRecs.forEach(s => { sMap[s.section] = s.product_ids || []; idMap[s.section] = s.id; });
      setSections(sMap);
      setSectionIds(idMap);
    }
    setAllProducts(products);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getEligible = () => allProducts.filter(p =>
    !p.is_hidden && p.status !== 'coming_soon' && p.stock_status !== 'out_of_stock' && p.image && p.price > 0
  );

  const saveSection = async (section, ids) => {
    if (sectionIds[section]) {
      await base44.entities.HomepageSection.update(sectionIds[section], { product_ids: ids });
    } else {
      const rec = await base44.entities.HomepageSection.create({ section, product_ids: ids });
      setSectionIds(prev => ({ ...prev, [section]: rec.id }));
    }
  };

  const handleShuffle = async (section) => {
    setShuffling(section);
    try {
      const eligible = getEligible();
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      const ids = shuffled.map(p => p.id);
      await saveSection(section, ids);
      setSections(prev => ({ ...prev, [section]: ids }));
      toast({ title: `${SECTION_CONFIG[section].label} shuffled successfully.` });
    } catch {
      toast({ title: 'Shuffle failed', variant: 'destructive' });
    }
    setShuffling(null);
  };

  const handleDragEnd = (section, result) => {
    if (!result.destination) return;
    const ids = [...sections[section]];
    const [moved] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, moved);
    setSections(prev => ({ ...prev, [section]: ids }));
    saveSection(section, ids);
  };

  const removeProduct = (section, idx) => {
    const ids = sections[section].filter((_, i) => i !== idx);
    setSections(prev => ({ ...prev, [section]: ids }));
    saveSection(section, ids);
  };

  const addProducts = (section, newIds) => {
    const existing = new Set(sections[section]);
    const toAdd = newIds.filter(id => !existing.has(id));
    const ids = [...sections[section], ...toAdd];
    setSections(prev => ({ ...prev, [section]: ids }));
    saveSection(section, ids);
    setPickerSection(null);
  };

  const getProduct = (id) => allProducts.find(p => p.id === id);

  if (loading) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" /></div>;

  const filteredProducts = pickerSection
    ? allProducts.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : [];

  return (
    <div className="px-4 pt-2 pb-8">
      <AdminNav />
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Homepage Content</h1>
        <p className="text-xs text-muted-foreground">Manage which products appear in homepage sections</p>
      </div>

      {Object.entries(SECTION_CONFIG).map(([key, config]) => (
        <div key={key} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">{config.label}</h2>
            <div className="flex gap-2">
              <button onClick={() => handleShuffle(key)} disabled={shuffling === key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold active:scale-95 disabled:opacity-50">
                <Shuffle className="w-3.5 h-3.5" /> {shuffling === key ? 'Shuffling...' : 'Shuffle'}
              </button>
              <button onClick={() => { setPickerSection(key); setSearch(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent">
                <Plus className="w-3.5 h-3.5" /> Add Products
              </button>
            </div>
          </div>

          {sections[key]?.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 rounded-xl bg-muted/50 text-center">No products. Click Shuffle or Add Products.</p>
          ) : (
            <DragDropContext onDragEnd={(r) => handleDragEnd(key, r)}>
              <Droppable droppableId={key}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                    {sections[key]?.map((id, idx) => {
                      const product = getProduct(id);
                      if (!product) return null;
                      return (
                        <Draggable key={id} draggableId={id} index={idx}>
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border">
                              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="w-6 h-6 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.image && <img src={product.image} alt="" className="w-full h-full object-contain" />}
                              </div>
                              <span className="flex-1 text-xs font-semibold text-foreground truncate">{product.name}</span>
                              <span className="text-xs text-[#2E7D32] font-bold flex-shrink-0">₦{product.price?.toLocaleString()}</span>
                              <button onClick={() => removeProduct(key, idx)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      ))}

      {pickerSection && (
        <ProductPicker
          section={pickerSection}
          products={filteredProducts}
          existingIds={new Set(sections[pickerSection])}
          search={search}
          onSearch={setSearch}
          onAdd={addProducts}
          onClose={() => setPickerSection(null)}
        />
      )}
    </div>
  );
}

function ProductPicker({ section, products, existingIds, search, onSearch, onAdd, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Add to {SECTION_CONFIG[section].label}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          {products.map(p => {
            const isExisting = existingIds.has(p.id);
            const isSelected = selected.has(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} disabled={isExisting} className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-colors ${isSelected ? 'border-[#2E7D32] bg-[#E8F5E9]/50' : 'border-border bg-card'} ${isExisting ? 'opacity-40' : ''}`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'}`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.image && <img src={p.image} alt="" className="w-full h-full object-contain" />}
                </div>
                <span className="flex-1 text-xs font-semibold text-foreground text-left truncate">{p.name}</span>
                <span className="text-xs text-[#2E7D32] font-bold">₦{p.price?.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={() => onAdd(section, Array.from(selected))} disabled={selected.size === 0} className="w-full py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold disabled:opacity-50">
            Add {selected.size > 0 ? `${selected.size} Product${selected.size > 1 ? 's' : ''}` : 'Products'}
          </button>
        </div>
      </div>
    </div>
  );
}