import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { clearPageContentCache, setPageContentCache } from '@/lib/usePageContent';
import {
  Loader2, RefreshCw, Save, Plus, Trash2, Eye, EyeOff,
  FileText, Image as ImageIcon, Type, ToggleLeft, ToggleRight, AlertCircle, Check, Upload,
} from 'lucide-react';

const PAGE_ICONS = {
  home: '🏠', about: 'ℹ️', login: '🔑', register: '📝', cart: '🛒',
  checkout: '💳', offers: '🏷️', categories: '📂', search: '🔍',
  wishlist: '❤️', orders: '📦', profile: '👤', support: '🎧',
  notifications: '🔔', track: '📍', packages: '📦', shop: '🏪',
  budget: '💰', 'payment-methods': '💳', settings: '⚙️',
  splash: '🚀',
};

export default function StaffPageContent() {
  const [pages, setPages] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [contentDraft, setContentDraft] = useState({});
  const [sectionsDraft, setSectionsDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newSectionKey, setNewSectionKey] = useState('');
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

const handleImageUpload = async (key, file) => {
  if (!file) return;
  setUploadingField(key);
  try {
    const ext = file.name.split('.').pop() || 'webp';
    const path = `cms/${selectedKey || 'general'}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    if (data?.publicUrl) updateField(key, data.publicUrl);
  } catch (err) {
    alert('Image upload failed: ' + (err?.message || 'Unknown error'));
  } finally {
    setUploadingField(null);
  }
};

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PageContent.list(
        {},
        { sort: 'page_label', limit: 100 }
      );
      const items = list.items || list || [];
      setPages(items);
      if (items.length > 0 && !selectedKey) {
        selectPage(items[0]);
      }
    } catch (err) {
      console.error('Failed to load page contents:', err);
      setSaveMsg({ type: 'error', text: 'Failed to load page contents.' });
    } finally {
      setLoading(false);
    }
  };

  const selectPage = (page) => {
    setSelectedKey(page.page_key);
    setPageData(page);
    setContentDraft(page.content || {});
    setSectionsDraft(page.sections || {});
    setSaveMsg(null);
    setShowFieldForm(false);
    setShowSectionForm(false);
  };

  const refreshPage = async () => {
    if (!selectedKey) return;
    setLoadingPage(true);
    try {
      const list = await base44.entities.PageContent.filter({ page_key: selectedKey });
      const items = list.items || list || [];
      if (items.length > 0) {
        selectPage(items[0]);
      }
    } catch (err) {
      console.error('Failed to refresh page:', err);
    } finally {
      setLoadingPage(false);
    }
  };

  const updateField = (key, value) => {
    setContentDraft((prev) => ({ ...prev, [key]: value }));
  };

  const deleteField = (key) => {
    setContentDraft((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const addField = () => {
    if (!newFieldKey.trim()) return;
    setContentDraft((prev) => ({ ...prev, [newFieldKey.trim()]: newFieldValue }));
    setNewFieldKey('');
    setNewFieldValue('');
    setShowFieldForm(false);
  };

  const toggleSection = (key) => {
    setSectionsDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addSection = () => {
    if (!newSectionKey.trim()) return;
    setSectionsDraft((prev) => ({ ...prev, [newSectionKey.trim()]: true }));
    setNewSectionKey('');
    setShowSectionForm(false);
  };

  const deleteSection = (key) => {
    setSectionsDraft((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSave = async () => {
    if (!pageData) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await base44.entities.PageContent.update(pageData.id, {
        content: contentDraft,
        sections: sectionsDraft,
      });
      setPageContentCache(selectedKey, contentDraft, sectionsDraft);
      setSaveMsg({ type: 'success', text: 'Page content saved. Changes are now live.' });
      // Update local pages list
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageData.id
            ? { ...p, content: contentDraft, sections: sectionsDraft }
            : p
        )
      );
      setPageData((prev) => ({ ...prev, content: contentDraft, sections: sectionsDraft }));
    } catch (err) {
      const msg = err?.message || err?.details || 'Failed to save page content.';
      setSaveMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const isImageUrl = useCallback((val) => {
    return typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'));
  }, []);

  const renderFieldInput = (key, value) => {
    const isLong = typeof value === 'string' && value.length > 60;
    const isImage = isImageUrl(value) && (key.includes('image') || key.includes('logo') || key.includes('banner') || key.includes('photo'));

       if (isImage) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(key, e.target.value)}
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
              placeholder="Image URL"
            />
            <label className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 flex-shrink-0">
              {uploadingField === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(key, e.target.files && e.target.files[0])}
              />
            </label>
          </div>
          {value && (
            <img
              src={value}
              alt={key}
              className="w-full max-w-[200px] h-28 object-cover rounded-lg border border-gray-200"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      );
    }
    if (isLong) {
      return (
        <textarea
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32] resize-y"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => updateField(key, e.target.value)}
        className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const contentEntries = Object.entries(contentDraft);
  const sectionEntries = Object.entries(sectionsDraft);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Page Content / CMS Editor</h1>
        <p className="text-sm text-gray-500">
          Edit text, headings, images, and section visibility for any page. Changes go live instantly.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Page selector sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Pages</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {pages.map((page) => (
                <button
                  key={page.page_key}
                  onClick={() => selectPage(page)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm transition-colors border-l-2 ${
                    selectedKey === page.page_key
                      ? 'bg-green-50 text-[#2E7D32] font-bold border-[#2E7D32]'
                      : 'text-gray-600 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <span className="text-base">{PAGE_ICONS[page.page_key] || <FileText className="w-4 h-4" />}</span>
                  <span className="truncate">{page.page_label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          {pageData ? (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2E7D32]" />
                    {pageData.page_label}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Key: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{pageData.page_key}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshPage}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    title="Reload from database"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPage ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold hover:bg-[#1B5E20] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Save message */}
              {saveMsg && (
                <div
                  className={`mx-4 mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    saveMsg.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {saveMsg.type === 'success'
                    ? <Check className="w-4 h-4 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {saveMsg.text}
                </div>
              )}

              <div className="p-4 space-y-6">
                {/* Section Visibility Toggles */}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <ToggleLeft className="w-4 h-4 text-gray-600" />
                    Section Visibility
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Toggle sections on or off for this page. Hidden sections won't appear on the live site.
                  </p>
                  {sectionEntries.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No sections defined for this page.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sectionEntries.map(([key, visible]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {visible
                              ? <Eye className="w-4 h-4 text-green-600" />
                              : <EyeOff className="w-4 h-4 text-gray-400" />}
                            <span className="text-sm font-medium text-gray-700">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                            <code className="text-[10px] text-gray-400 bg-white px-1 py-0.5 rounded">{key}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSection(key)}
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                visible
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {visible ? 'Visible' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => deleteSection(key)}
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add section */}
                  {showSectionForm ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newSectionKey}
                        onChange={(e) => setNewSectionKey(e.target.value)}
                        placeholder="section_key (e.g. promo_banner)"
                        className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                        onKeyDown={(e) => e.key === 'Enter' && addSection()}
                        autoFocus
                      />
                      <button
                        onClick={addSection}
                        className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowSectionForm(false)}
                        className="h-9 px-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSectionForm(true)}
                      className="mt-2 flex items-center gap-1.5 text-sm text-[#2E7D32] font-medium hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add Section
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  {/* Content Fields */}
                  <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-600" />
                    Content Fields
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Edit the text, headings, and image URLs shown on this page. Image fields show a preview.
                  </p>

                  {contentEntries.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No content fields defined for this page.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {contentEntries.map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg border border-gray-100">
                          <div className="sm:w-48 flex-shrink-0">
                            <label className="text-xs font-semibold text-gray-600 block">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </label>
                            <code className="text-[10px] text-gray-400">{key}</code>
                          </div>
                          <div className="flex-1 min-w-0">
                            {renderFieldInput(key, value)}
                          </div>
                          <button
                            onClick={() => deleteField(key)}
                            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add field */}
                  {showFieldForm ? (
                    <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newFieldKey}
                          onChange={(e) => setNewFieldKey(e.target.value)}
                          placeholder="field_key (e.g. hero_title)"
                          className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                          autoFocus
                        />
                      </div>
                      <textarea
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Field value (text or image URL)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32] resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={addField}
                          className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold"
                        >
                          Add Field
                        </button>
                        <button
                          onClick={() => { setShowFieldForm(false); setNewFieldKey(''); setNewFieldValue(''); }}
                          className="h-9 px-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowFieldForm(true)}
                      className="mt-3 flex items-center gap-1.5 text-sm text-[#2E7D32] font-medium hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add Content Field
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a page from the left to edit its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
