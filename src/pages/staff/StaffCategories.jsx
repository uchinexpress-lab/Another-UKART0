import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { staffWrite } from '@/lib/staffWrite';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import { RefreshCw, Loader2, Plus, Edit, Trash2, Upload } from 'lucide-react';

export default function StaffCategories() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'categories');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Category.filter(
        { is_hidden: { $ne: true } },
        { sort: 'display_order', limit: 100 }
      );
      setCategories(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadCategoryImage = async (file, targetId = 'new') => {
    if (!file) return null;
    setUploadingId(targetId);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (err) {
      alert('Image upload failed: ' + (err?.message || 'Unknown error'));
      return null;
    } finally {
      setUploadingId(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await staffWrite('Category', 'create', null, {
        name: newName.trim(),
        subtitle: newSubtitle.trim(),
        icon: newIcon.trim() || '🛒',
        image_url: newImageUrl.trim() || null,
        display_order: categories.length + 1,
      });
      setNewName('');
      setNewSubtitle('');
      setNewIcon('');
      setNewImageUrl('');
      loadCategories();
    } catch (e) {
      alert('Failed to create category: ' + (e?.message || ''));
    }
  };

  const handleUpdate = async (cat) => {
    try {
      await staffWrite('Category', 'update', cat.id, {
        name: cat.name,
        subtitle: cat.subtitle || '',
        icon: cat.icon || '🛒',
        image_url: cat.image_url || null,
        display_order: Number(cat.display_order) || 1,
      });
      setEditing(null);
      loadCategories();
    } catch (e) {
      alert('Failed to update category: ' + (e?.message || ''));
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await staffWrite('Category', 'delete', cat.id);
      loadCategories();
    } catch (e) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories (synced with Homepage)</p>
        </div>
        <button onClick={loadCategories} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {canManage && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Fresh Produce)"
            className="flex-1 min-w-[160px] h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <input
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            placeholder="Subtitle (e.g. Vegetables & fruits)"
            className="flex-1 min-w-[160px] h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="Emoji"
            className="w-16 h-9 px-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <label className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
            {uploadingId === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {newImageUrl ? 'Photo Ready' : 'Upload Photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const url = await uploadCategoryImage(e.target.files?.[0], 'new');
                if (url) setNewImageUrl(url);
              }}
            />
          </label>
          <button type="submit" className="h-9 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Photo / Icon</th>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Subtitle</th>
                  <th className="text-left px-4 py-3 font-semibold">Order</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <span className="text-xl w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                            {c.icon || '🛒'}
                          </span>
                        )}
                        {editing === c.id && (
                          <label className="px-2 py-1 rounded border border-gray-200 text-xs cursor-pointer hover:bg-gray-100 flex items-center gap-1">
                            {uploadingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const url = await uploadCategoryImage(e.target.files?.[0], c.id);
                                if (url) {
                                  setCategories((prev) =>
                                    prev.map((x) => (x.id === c.id ? { ...x, image_url: url } : x))
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editing === c.id ? (
                        <input
                          value={c.name}
                          onChange={(e) =>
                            setCategories((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x))
                            )
                          }
                          className="h-8 px-2 text-sm rounded border border-gray-200 outline-none focus:border-[#2E7D32]"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{c.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === c.id ? (
                        <input
                          value={c.subtitle || ''}
                          onChange={(e) =>
                            setCategories((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, subtitle: e.target.value } : x))
                            )
                          }
                          placeholder="Short description"
                          className="h-8 px-2 text-sm rounded border border-gray-200 outline-none focus:border-[#2E7D32]"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">{c.subtitle || '—'}</span>
                      )}
</td>
