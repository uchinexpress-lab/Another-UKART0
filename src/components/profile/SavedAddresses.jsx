import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Star, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import AddressForm from "@/components/profile/AddressForm";

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const u = await base44.auth.me();
      setAddresses(u?.saved_addresses || []);
    } catch {}
    setLoading(false);
  };

  const persist = async (list) => {
    setSaving(true);
    try {
      const u = await base44.auth.updateMe({ saved_addresses: list });
      setAddresses(u?.saved_addresses || list);
      setSheetOpen(false);
      setEditing(null);
      toast({ title: "Address saved" });
    } catch {
      toast({ title: "Could not save address", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSave = (values) => {
    if (editing?.id) {
      persist(addresses.map((a) => (a.id === editing.id ? { ...values, id: editing.id, is_default: a.is_default } : a)));
    } else {
      persist([...addresses, { ...values, id: crypto.randomUUID(), is_default: addresses.length === 0 }]);
    }
  };

  const handleDelete = (id) => {
    persist(addresses.filter((a) => a.id !== id));
  };

  const handleDefault = (id) => {
    persist(addresses.map((a) => ({ ...a, is_default: a.id === id })));
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-1 pt-2 pb-1">
      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved addresses yet. Add one to speed up checkout.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-full">
                    {a.label}
                  </span>
                  {a.is_default && (
                    <span className="text-xs font-medium text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!a.is_default && (
                    <button
                      onClick={() => handleDefault(a.id)}
                      className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-amber-500"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditing(a);
                      setSheetOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-[#2E7D32]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1.5">{a.full_name}</p>
              <p className="text-xs text-gray-500">{a.phone}</p>
              <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                {a.address}{a.landmark ? ` — ${a.landmark}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full mt-3 h-11 rounded-xl border-dashed border-[#2E7D32]/40 text-[#2E7D32] font-medium"
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      >
        <Plus className="w-4 h-4 mr-1" /> Add New Address
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Address" : "Add New Address"}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <AddressForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => {
                setSheetOpen(false);
                setEditing(null);
              }}
              saving={saving}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}