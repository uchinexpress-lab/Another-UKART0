import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Check, X } from 'lucide-react';

/**
 * Image editor for banners.
 * Allows zoom, pan, fit/fill, and reset before saving.
 * Stores zoom (1-3), position (0-100% x/y), and fit_mode (contain/cover).
 * The original image URL is preserved by the parent — only settings are saved.
 */
export default function BannerImageEditor({ imageUrl, aspectRatio, initialSettings, onSave, onCancel }) {
  const [zoom, setZoom] = useState(initialSettings?.zoom ?? 1);
  const [posX, setPosX] = useState(initialSettings?.pos_x ?? 50);
  const [posY, setPosY] = useState(initialSettings?.pos_y ?? 50);
  const [fitMode, setFitMode] = useState(initialSettings?.fit_mode ?? 'cover');
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 50, posY: 50 });
  const containerRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX, posY };
  }, [posX, posY]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Convert pixel delta to background-position percentage.
    // overflow = containerSize * (zoom - 1) when background-size > 100%.
    const overflowX = rect.width * (zoom - 1);
    const overflowY = rect.height * (zoom - 1);

    if (overflowX > 0) {
      const deltaPosX = -(dx / overflowX) * 100;
      setPosX(Math.max(0, Math.min(100, dragStart.current.posX + deltaPosX)));
    }
    if (overflowY > 0) {
      const deltaPosY = -(dy / overflowY) * 100;
      setPosY(Math.max(0, Math.min(100, dragStart.current.posY + deltaPosY)));
    }
  }, [dragging, zoom]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const handleFit = () => {
    setFitMode('contain');
    setZoom(1);
    setPosX(50);
    setPosY(50);
  };

  const handleFill = () => {
    setFitMode('cover');
    setZoom(1);
    setPosX(50);
    setPosY(50);
  };

  const handleReset = () => {
    setZoom(1);
    setPosX(50);
    setPosY(50);
    setFitMode('cover');
  };

  const bgSize = zoom > 1
    ? `${zoom * 100}%`
    : fitMode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Image Editor</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Preview frame — exact banner aspect ratio */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-2">
            Drag to reposition · Use zoom slider to adjust size · This is exactly how the banner will appear
          </p>
          <div
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-xl bg-gray-100 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ aspectRatio }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: bgSize,
                backgroundPosition: `${posX}% ${posY}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            {/* Grid overlay for alignment */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-400" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-400" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-400" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-400" />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" /> Zoom
              </label>
              <span className="text-xs font-bold text-[#2E7D32]">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#2E7D32]"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </div>

          {/* Mode buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleFit}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                fitMode === 'contain' && zoom === 1
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" /> Fit
            </button>
            <button
              onClick={handleFill}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                fitMode === 'cover' && zoom === 1
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fill
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Position readout */}
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span>Position: {Math.round(posX)}% × {Math.round(posY)}%</span>
            <span>Mode: {fitMode}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ zoom, pos_x: Math.round(posX), pos_y: Math.round(posY), fit_mode: fitMode })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors"
          >
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}