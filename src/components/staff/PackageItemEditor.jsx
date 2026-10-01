import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Upload, X, GripVertical, ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PackageItemEditor({ items, onChange, products }) {
  const add = () => {
    onChange([
      ...items,
      { name: '', quantity: '', unit: '', notes: '', image: '', product_id: '', active: true, optional: false },
    ]);
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  const update = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const uploadImage = async (idx, file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update(idx, 'image', file_url);
  };

  const linkProduct = (idx, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const next = [...items];
      next[idx] = {
        ...next[idx],
        product_id: productId,
        name: next[idx].name || product.name,
      };
      onChange(next);
    } else {
      update(idx, 'product_id', '');
    }
  };

  const applyProductImage = (idx) => {
    const item = items[idx];
    const product = products.find((p) => p.id === item.product_id);
    if (product?.image) update(idx, 'image', product.image);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="package-items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((item, idx) => (
                <Draggable key={`item-${idx}`} draggableId={`item-${idx}`} index={idx}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-3 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="flex items-start gap-2">
                        <div {...provided.dragHandleProps} className="pt-1 cursor-grab flex-shrink-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {/* Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {item.image ? (
                            <div className="relative w-full h-full">
                              <img src={item.image} alt="" className="w-full h-full object-contain" />
                              <button
                                onClick={() => update(idx, 'image', '')}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="w-full h-full flex items-center justify-center cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(idx, f); }}
                              />
                            </label>
                          )}
                        </div>
                        {/* Fields */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name || ''}
                              onChange={(e) => update(idx, 'name', e.target.value)}
                              placeholder="Item name"
                              className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                            />
                            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.quantity || ''}
                              onChange={(e) => update(idx, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="w-16 px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                            />
                            <input
                              type="text"
                              value={item.unit || ''}
                              onChange={(e) => update(idx, 'unit', e.target.value)}
                              placeholder="Unit"
                              className="w-20 px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                            />
                            <select
                              value={item.product_id || ''}
                              onChange={(e) => linkProduct(idx, e.target.value)}
                              className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                            >
                              <option value="">Link to product (optional)</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => update(idx, 'notes', e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.active !== false}
                                onChange={(e) => update(idx, 'active', e.target.checked)}
                                className="accent-[#2E7D32]"
                              />
                              Included
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.optional === true}
                                onChange={(e) => update(idx, 'optional', e.target.checked)}
                                className="accent-[#2E7D32]"
                              />
                              Optional
                            </label>
                            {item.product_id && (
                              <button
                                onClick={() => applyProductImage(idx)}
                                className="text-xs text-[#2E7D32] font-semibold flex items-center gap-1 ml-auto"
                              >
                                <ImageIcon className="w-3 h-3" /> Use Product Image
                              </button>
                            )}
                          </div>
                        </div>
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
      <button
        onClick={add}
        className="w-full py-2 rounded-xl border-2 border-dashed border-border hover:border-[#2E7D32]/40 hover:bg-[#2E7D32]/5 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Item
      </button>
    </div>
  );
}