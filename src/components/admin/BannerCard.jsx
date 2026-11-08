import React from 'react';
import { GripVertical, Pencil, Trash2, Copy, Eye, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { BANNER_LOCATIONS } from '@/lib/bannerConfig';

/**
 * Admin banner card with thumbnail, info, and action buttons.
 * Includes a drag handle for reordering via @hello-pangea/dnd.
 */
export default function BannerCard({
  banner, index, onEdit, onDelete, onDuplicate, onReplace, onToggleActive, onPreview,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown, isFirst,
}) {
  const config = BANNER_LOCATIONS[banner.location] || BANNER_LOCATIONS.home;
  const bgSize = banner.zoom > 1
    ? `${banner.zoom * 100}%`
    : banner.fit_mode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 hover:shadow-md transition-shadow">
      {/* Drag handle */}
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Order number */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div
        className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-100 border border-border relative"
      >
        {banner.image ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${banner.image})`,
              backgroundSize: bgSize,
              backgroundPosition: `${banner.pos_x || 50}% ${banner.pos_y || 50}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        {!banner.active && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">HIDDEN</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground truncate">{banner.name}</h3>
          {isFirst && (
            <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2E7D32] text-white">
              FIRST
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {config?.label || banner.location}
          </span>
          {banner.link && (
            <span className="text-[10px] text-muted-foreground truncate">→ {banner.link}</span>
          )}
        </div>
      </div>

      {/* Active toggle */}
      <button
        onClick={() => onToggleActive(banner)}
        className={`flex-shrink-0 w-9 h-5 rounded-full transition-colors relative ${banner.active ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
        title={banner.active ? 'Active' : 'Inactive'}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${banner.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          title="Show earlier"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          title="Show later"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPreview(banner)}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(banner)}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReplace(banner)}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors"
          title="Replace image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDuplicate(banner)}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-[#2E7D32] transition-colors"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(banner)}
          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}