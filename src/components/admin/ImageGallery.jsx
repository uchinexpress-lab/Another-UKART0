import React, { useState, useRef } from 'react';
import { Upload, Trash2, Star, Loader2, ImageIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';

export default function ImageGallery({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const uploadFiles = async (files) => {
    setUploading(true);
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        urls.push(file_url);
      }
      onChange([...images, ...urls]);
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragEnd = (res) => {
    if (!res.destination) return;
    const next = Array.from(images);
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    onChange(next);
  };

  const setPrimary = (i) => {
    const next = Array.from(images);
    const [img] = next.splice(i, 1);
    next.unshift(img);
    onChange(next);
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-6 rounded-xl border-2 border-dashed border-[#2E7D32]/40 text-[#2E7D32] text-sm font-semibold flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {uploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="w-5 h-5" /> Upload images (tap to select multiple)</>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
      />

      {images.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="gallery">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <Draggable key={url + i} draggableId={url + i} index={i}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-[#2E7D32] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-white" /> Primary
                          </span>
                        )}
                        <div className="absolute top-1 right-1 flex gap-1">
                          {i !== 0 && (
                            <button type="button" onClick={() => setPrimary(i)} className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center" title="Set as primary">
                              <Star className="w-3 h-3 text-[#2E7D32]" />
                            </button>
                          )}
                          <button type="button" onClick={() => remove(i)} className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center" title="Delete">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
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

      {images.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
          <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
          <span className="text-xs">No images yet</span>
        </div>
      )}
    </div>
  );
}