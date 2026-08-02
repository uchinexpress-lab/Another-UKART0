import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const LABELS = ["Home", "Work", "Other"];

export default function AddressForm({ initial, onSave, onCancel, saving }) {
  const [label, setLabel] = useState(initial?.label || "Home");
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [landmark, setLandmark] = useState(initial?.landmark || "");

  const submit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) return;
    onSave({ label, full_name: fullName.trim(), phone: phone.trim(), address: address.trim(), landmark: landmark.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <div className="flex gap-2">
          {LABELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => setLabel(l)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                label === l
                  ? "bg-[#2E7D32] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-name">Recipient Name</Label>
        <Input
          id="addr-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Adaeze Okafor"
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-phone">Phone Number</Label>
        <Input
          id="addr-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0803 123 4567"
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-street">House Address</Label>
        <Input
          id="addr-street"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House/flat number, street name, area"
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-landmark">Landmark (optional)</Label>
        <Input
          id="addr-landmark"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="e.g. opposite Total filling station"
          className="h-11 rounded-xl"
        />
      </div>
      <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Address
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
    </form>
  );
}