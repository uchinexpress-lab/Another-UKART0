import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Crop, Check, X, ZoomIn } from 'lucide-react';

const ASPECT_PRESETS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: null },
];

const MAX_OUTPUT = 1200;

export default function ImageCropModal({ file, onConfirm, onCancel }) {
  const [aspect, setAspect] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef(null);
  const imgEl = useRef(new Image());
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgEl.current = img;
      setImgLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback((ox, oy, z) => {
    const frame = imgRef.current;
    if (!frame) return { x: ox, y: oy };
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const iw = fw * z;
    const ih = fh * z;
    const maxX = Math.max(0, (iw - fw) / 2);
    const maxY = Math.max(0, (ih - fh) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  const onPointerDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const next = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom);
    setOffset(next);
  };

  const onPointerUp = () => setDragging(false);

  const handleZoom = (z) => {
    setZoom(z);
    setOffset((o) => clampOffset(o.x, o.y, z));
  };

  const handleConfirm = () => {
    const frame = imgRef.current;
    const img = imgEl.current;
    if (!frame || !img) return onConfirm(file);

    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    // Crop region in image natural pixels.
    const scale = naturalSize.w / (fw * zoom);
    const cropWpx = fw * scale;
    const cropHpx = fh * scale;
    const sx = (naturalSize.w - cropWpx) / 2 - offset.x * scale * zoom;
    const sy = (naturalSize.h - cropHpx) / 2 - offset.y * scale * zoom;

    let outW = cropWpx;
    let outH = cropHpx;
    if (outW > MAX_OUTPUT || outH > MAX_OUTPUT) {
      const r = MAX_OUTPUT / Math.max(outW, outH);
      outW = Math.round(outW * r);
      outH = Math.round(outH * r);
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      sx, sy, cropWpx, cropHpx,
      0, 0, outW, outH,
    );

    canvas.toBlob((blob) => {
      if (!blob) return onConfirm(file);
      const cropped = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      onConfirm(cropped);
    }, 'image/jpeg', 0.9);
  };

  const frameStyle = aspect
    ? { aspectRatio: String(aspect) }
    : { width: '100%', paddingBottom: '60%' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Crop className="w-4 h-4 text-[#2E7D32]" /> Crop & Resize
          </h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAspect(p.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  aspect === p.value
                    ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative bg-muted rounded-xl overflow-hidden select-none" style={frameStyle}>
            <div
              ref={imgRef}
              className="absolute inset-0"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            >
              {imgLoaded && (
                <img
                  src={imgEl.current.src}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: `${zoom * 100}%`,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    userSelect: 'none',
                  }}
                />
              )}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                Loading image…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="w-full accent-[#2E7D32]"
            />
            <span className="text-xs text-muted-foreground w-9 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 h-10 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Crop & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
