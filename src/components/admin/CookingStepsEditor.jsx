import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CookingStepsEditor({ steps, onChange }) {
  const add = () => onChange([...steps, { step: steps.length + 1, title: '', text: '', image: '' }]);
  const remove = (idx) => onChange(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  const update = (idx, field, value) => {
    const next = [...steps];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((s, i) => ({ ...s, step: i + 1 })));
  };
  const uploadImage = async (idx, file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update(idx, 'image', file_url);
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step.step || idx + 1}</span>
            <input type="text" value={step.title || ''} onChange={(e) => update(idx, 'title', e.target.value)} placeholder="Step title (e.g. Prepare the ingredients)" className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs font-semibold" />
            <div className="flex gap-0.5">
              <button onClick={() => move(idx, -1)} className="text-muted-foreground hover:text-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(idx, 1)} className="text-muted-foreground hover:text-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <textarea value={step.text || ''} onChange={(e) => update(idx, 'text', e.target.value)} placeholder="Instruction text..." rows={2} className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {step.image ? (
                <div className="relative w-full h-full">
                  <img src={step.image} alt="" className="w-full h-full object-contain" />
                  <button onClick={() => update(idx, 'image', '')} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <label className="w-full h-full flex items-center justify-center cursor-pointer">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(idx, f); }} />
                </label>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Optional step image</span>
          </div>
        </div>
      ))}
      <button onClick={add} className="w-full py-2 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:bg-accent flex items-center justify-center gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Add Step
      </button>
    </div>
  );
}