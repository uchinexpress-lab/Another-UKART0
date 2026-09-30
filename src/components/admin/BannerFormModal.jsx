import React, { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, Link2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BANNER_LOCATIONS, SLIDE_DURATIONS, DEFAULT_BANNER_SETTINGS } from '@/lib/bannerConfig';
import BannerImageEditor from '@/components/admin/BannerImageEditor';

/**
 * Modal for creating or editing a banner.
 * Handles file upload, image editing, and all banner settings.
 * The original uploaded image URL is stored separately from display settings,
 * so the admin can re-edit the image later without losing the original.
 */
export default function BannerFormModal({ banner, onSave, onCancel }) {
  const isEdit = !!banner;
  const [name, setName] = useState(banner?.name || '');
  const [location, setLocation] = useState(banner?.location || 'home');
  const [image, setImage] = useState(banner?.image || '');
  const [link, setLink] = useState(banner?.link || '');
  const [heading, setHeading] = useState(banner?.heading || '');
  const [subheading, setSubheading] = useState(banner?.subheading || '');
  const [badgeText, setBadgeText] = useState(banner?.badge_text || '');
  const [ctaText, setCtaText] = useState(banner?.cta_text || '');
  const [showOverlay, setShowOverlay] = useState(banner?.show_overlay ?? false);
  const [active, setActive] = useState(banner?.active ?? true);
  const [autoSlide, setAutoSlide] = useState(banner?.auto_slide ?? true);
  const [slideDuration, setSlideDuration] = useState(banner?.slide_duration ?? 5);
  const [editorSettings, setEditorSettings] = useState({
    zoom: banner?.zoom ?? 1,
    pos_x: banner?.pos_x ?? 50,
    pos_y: banner?.pos_y ?? 50,
    fit_mode: banner?.fit_mode ?? 'cover',
  });
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const config = BANNER_LOCATIONS[location];

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setImage(file_url);
      // Reset editor settings for the new image
      setEditorSettings({ ...DEFAULT_BANNER_SETTINGS, active, auto_slide: autoSlide, slide_duration: slideDuration });
      setShowEditor(true);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditorSave = (settings) => {
    setEditorSettings(settings);
    setShowEditor(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Banner name is required');
      return;
    }
    if (!image) {
      setError('Please upload a banner image');
      return;
    }
    setSaving(true);
    setError('');
    onSave({
      name: name.trim(),
      location,
      image,
      link: link.trim() || null,
      active,
      auto_slide: autoSlide,
      slide_duration: slideDuration,
      heading: heading.trim() || null,
      subheading: subheading.trim() || null,
      badge_text: badgeText.trim() || null,
      cta_text: ctaText.trim() || null,
      show_overlay: showOverlay,
      ...editorSettings,
    });
  };

  const bgSize = editorSettings.zoom > 1
    ? `${editorSettings.zoom * 100}%`
    : editorSettings.fit_mode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">
            {isEdit ? 'Edit Banner' : 'Add New Banner'}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Banner name */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Banner Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale Banner"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Banner Location</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BANNER_LOCATIONS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setLocation(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    location === key
                      ? 'bg-[#2E7D32] text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{config?.description}</p>
          </div>

          {/* Image upload / preview */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              {isEdit ? 'Banner Image' : 'Upload Image'}
            </label>
            {image ? (
              <div className="space-y-2">
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-gray-100 border border-border"
                  style={{ aspectRatio: config?.aspectRatio || 16 / 7 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${image})`,
                      backgroundSize: bgSize,
                      backgroundPosition: `${editorSettings.pos_x}% ${editorSettings.pos_y}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Edit Image
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Replace
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-[#2E7D32]/40 hover:bg-[#2E7D32]/5 transition-colors flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-[#2E7D32] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload image'}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Link (optional) */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Link (optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/categories or /packages"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Where the banner navigates when clicked</p>
          </div>

          {/* Text Overlay (optional) */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/50">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              Text Overlay
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showOverlay ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showOverlay ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
            {showOverlay && (
              <div className="space-y-2.5">
                <p className="text-[10px] text-muted-foreground">
                  Adds a gradient overlay with text on top of the banner image.
                </p>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Badge Text</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. Delivering Across Lagos"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Heading</label>
                  <input
                    type="text"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    placeholder="e.g. NO MARKET WAHALA."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Subheading</label>
                  <input
                    type="text"
                    value={subheading}
                    onChange={(e) => setSubheading(e.target.value)}
                    placeholder="e.g. Fresh groceries delivered across Lagos"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auto-slide settings */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/50">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              Auto-slide
              <button
                onClick={() => setAutoSlide(!autoSlide)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoSlide ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSlide ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
            {autoSlide && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Duration:</span>
                {SLIDE_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSlideDuration(d)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      slideDuration === d
                        ? 'bg-[#2E7D32] text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <label className="text-xs font-semibold text-foreground">Active (visible to customers)</label>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !image}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Create'} Banner
          </button>
        </div>
      </div>

      {/* Image editor overlay */}
      {showEditor && image && (
        <BannerImageEditor
          imageUrl={image}
          aspectRatio={config?.aspectRatio || 16 / 7}
          initialSettings={editorSettings}
          onSave={handleEditorSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}