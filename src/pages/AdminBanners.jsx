import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BANNER_LOCATIONS } from '@/lib/bannerConfig';
import AdminNav from '@/components/admin/AdminNav';
import BannerCard from '@/components/admin/BannerCard';
import BannerFormModal from '@/components/admin/BannerFormModal';
import BannerImageEditor from '@/components/admin/BannerImageEditor';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [replaceBanner, setReplaceBanner] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBanners = useCallback(() => {
    setLoading(true);
    base44.entities.Banner.list()
      .then((all) => {
        const sorted = all.sort((a, b) => {
          if (a.location !== b.location) return a.location.localeCompare(b.location);
          return (a.order || 0) - (b.order || 0);
        });
        setBanners(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const filtered = filter === 'all'
    ? banners
    : banners.filter((b) => b.location === filter);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(filtered);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Assign new order values within the same location
    const locationBanners = reordered.map((b, i) => ({ ...b, order: i }));
    const newAll = banners.map((b) => {
      const updated = locationBanners.find((lb) => lb.id === b.id);
      return updated || b;
    });
    setBanners(newAll);

    // Persist order to database
    try {
      await base44.entities.Banner.bulkUpdate(
        locationBanners.map((b) => ({ id: b.id, order: b.order }))
      );
    } catch (err) {
      // Reload on failure
      loadBanners();
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingBanner) {
        await base44.entities.Banner.update(editingBanner.id, {
          ...data,
          order: editingBanner.order ?? 0,
        });
      } else {
        // New banner: set order to end of its location
        const locationCount = banners.filter((b) => b.location === data.location).length;
        await base44.entities.Banner.create({
          ...data,
          order: locationCount,
        });
      }
      setShowForm(false);
      setEditingBanner(null);
      loadBanners();
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner) => {
    if (!confirm(`Delete "${banner.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.Banner.delete(banner.id);
      loadBanners();
    } catch (err) {
      // handled silently
    }
  };

  const handleDuplicate = async (banner) => {
    try {
      const locationCount = banners.filter((b) => b.location === banner.location).length;
      await base44.entities.Banner.create({
        ...banner,
        name: `${banner.name} (Copy)`,
        order: locationCount,
        active: false,
      });
      delete banner.id;
      loadBanners();
    } catch (err) {
      // handled silently
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await base44.entities.Banner.update(banner.id, { active: !banner.active });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b))
      );
    } catch (err) {
      // handled silently
    }
  };

  const handleReplaceSave = async (settings) => {
    if (!replaceBanner) return;
    try {
      await base44.entities.Banner.update(replaceBanner.id, settings);
      setBanners((prev) =>
        prev.map((b) => (b.id === replaceBanner.id ? { ...b, ...settings } : b))
      );
      setReplaceBanner(null);
    } catch (err) {
      // handled silently
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    ...Object.entries(BANNER_LOCATIONS).map(([key, cfg]) => ({ key, label: cfg.label })),
  ];

  return (
    <div className="p-4 pb-20">
      <AdminNav />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Banner Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage promotional banners across the app
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {/* Location filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-[#2E7D32] text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1 opacity-70">
                {banners.filter((b) => b.location === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Banner list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#2E7D32] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No banners yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Banner" to create your first banner
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`banners-${filter}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {filtered.map((banner, index) => (
                  <Draggable key={banner.id} draggableId={banner.id} index={index}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                      >
                        <BannerCard
                          banner={banner}
                          index={index}
                          {...prov.dragHandleProps}
                          onEdit={(b) => {
                            setEditingBanner(b);
                            setShowForm(true);
                          }}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          onReplace={(b) => setReplaceBanner(b)}
                          onToggleActive={handleToggleActive}
                          onPreview={(b) => setPreviewBanner(b)}
                        />
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

      {/* Form modal */}
      {showForm && (
        <BannerFormModal
          banner={editingBanner}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBanner(null);
          }}
        />
      )}

      {/* Replace image editor */}
      {replaceBanner && (
        <BannerImageEditor
          imageUrl={replaceBanner.image}
          aspectRatio={BANNER_LOCATIONS[replaceBanner.location]?.aspectRatio || 16 / 7}
          initialSettings={{
            zoom: replaceBanner.zoom,
            pos_x: replaceBanner.pos_x,
            pos_y: replaceBanner.pos_y,
            fit_mode: replaceBanner.fit_mode,
          }}
          onSave={handleReplaceSave}
          onCancel={() => setReplaceBanner(null)}
        />
      )}

      {/* Preview modal */}
      {previewBanner && (
        <PreviewModal banner={previewBanner} onClose={() => setPreviewBanner(null)} />
      )}
    </div>
  );
}

/** Simple preview modal showing the banner at its exact display dimensions. */
function PreviewModal({ banner, onClose }) {
  const config = BANNER_LOCATIONS[banner.location] || BANNER_LOCATIONS.home;
  const bgSize = banner.zoom > 1
    ? `${banner.zoom * 100}%`
    : banner.fit_mode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Preview: {banner.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-2">
            {config.label} · {banner.active ? 'Active' : 'Inactive'}
          </p>
          <div
            className="relative w-full overflow-hidden rounded-xl bg-gray-100"
            style={{ aspectRatio: config.aspectRatio }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${banner.image})`,
                backgroundSize: bgSize,
                backgroundPosition: `${banner.pos_x || 50}% ${banner.pos_y || 50}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span>Zoom: {banner.zoom || 1}x</span>
            <span>Position: {banner.pos_x || 50}% × {banner.pos_y || 50}%</span>
            <span>Mode: {banner.fit_mode || 'cover'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}