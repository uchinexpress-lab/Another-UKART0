import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Pencil, Copy, Trash2, Eye, GripVertical, UtensilsCrossed } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import { useToast } from '@/components/ui/use-toast';
import MealKitPreview from '@/components/admin/MealKitPreview';

export default function AdminMealKits() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewKit, setPreviewKit] = useState(null);

  const loadKits = useCallback(async () => {
    const all = await base44.entities.Package.list();
    const mealKits = all
      .filter(p => p.group === 'meal_kits')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setKits(mealKits);
    setLoading(false);
  }, []);

  useEffect(() => { loadKits(); }, [loadKits]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const next = [...kits];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setKits(next);
    await base44.entities.Package.bulkUpdate(
      next.map((k, i) => ({ id: k.id, display_order: i }))
    );
  };

  const toggleActive = async (kit) => {
    await base44.entities.Package.update(kit.id, { active: !kit.active });
    loadKits();
  };

  const duplicate = async (kit) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = kit;
    await base44.entities.Package.create({
      ...rest,
      name: `${kit.name} (Copy)`,
      active: false,
      display_order: kits.length,
    });
    toast({ title: 'Meal kit duplicated' });
    loadKits();
  };

  const remove = async (kit) => {
    if (!confirm(`Delete "${kit.name}"?`)) return;
    await base44.entities.Package.delete(kit.id);
    loadKits();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" /></div>;

  return (
    <div className="px-4 pt-2 pb-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Meal Kits</h1>
          <p className="text-xs text-muted-foreground">Manage meal kit packages</p>
        </div>
        <button onClick={() => navigate('/admin/meal-kits/new')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold active:scale-95">
          <Plus className="w-4 h-4" /> Add Meal Kit
        </button>
      </div>

      {kits.length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No meal kits yet. Click "Add Meal Kit" to create one.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="meal-kits">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {kits.map((kit, idx) => (
                  <Draggable key={kit.id} draggableId={kit.id} index={idx}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                        <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="w-7 h-7 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {kit.image && <img src={kit.image} alt="" className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{kit.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#2E7D32] font-bold">₦{kit.total_price?.toLocaleString() || 0}</span>
                            {kit.serves && <span className="text-[10px] text-muted-foreground">· {kit.serves}</span>}
                            {!kit.active && <span className="text-[10px] text-red-500 font-semibold">· Disabled</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setPreviewKit(kit)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32]"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => toggleActive(kit)} className={`w-9 h-5 rounded-full transition-colors relative ${kit.active ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${kit.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <button onClick={() => navigate(`/admin/meal-kits/${kit.id}`)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32]"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => duplicate(kit)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32]"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => remove(kit)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {previewKit && <MealKitPreview kit={previewKit} onClose={() => setPreviewKit(null)} />}
    </div>
  );
}