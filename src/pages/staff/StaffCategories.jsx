import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { staffWrite } from '@/lib/staffWrite';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import { RefreshCw, Loader2, Plus, Edit, Trash2 } from 'lucide-react';

export default function StaffCategories() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'categories');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await staffWrite('Category', 'create', null, {
        name: newName.trim(),
        icon: newIcon.trim() || '🛒',
        display_order: categories.length + 1,
      });
      setNewName('');
      setNewIcon('');
      loadCategories();
    } catch (e) {
      alert('Failed to create category');
    }
  };

  const handleUpdate = async (cat) => {
    try {
      await staffWrite('Category', 'update', cat.id, { name: cat.name, icon: cat.icon });
      setEditing(null);
      loadCategories();
    } catch (e) {
      alert('Failed to update category');
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
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button onClick={loadCategories} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {canManage && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="Icon (emoji)"
            className="w-24 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
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
                  <th className="text-left px-4 py-3 font-semibold">Icon</th>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Order</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xl">{c.icon || '🛒'}</td>
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
                    <td className="px-4 py-3 text-xs text-gray-500">{c.display_order || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editing === c.id ? (
                            <button
                              onClick={() => handleUpdate(c)}
                              className="text-xs font-bold text-green-600"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditing(c.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded hover:bg-gray-100 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}