import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import AddressAutocomplete from "@/components/checkout/AddressAutocomplete";
import AddressPickerMap from "@/components/delivery/AddressPickerMap";

const LABELS = ["Home", "Work", "Other"];

function classifyAddressZone(address) {
  const text = (address || '').toLowerCase();
  const islandAreas = [
    'ajah', 'lekki', 'victoria island', 'ikoyi', 'chevron', 'vgc',
    'victoria garden city', 'sangotedo', 'abraham adesanya',
    'ikate', 'oniru', 'eti-osa', 'etiosa'
  ];
  if (islandAreas.some((area) => text.includes(area))) return 'island';
  return 'mainland';
}

export default function AddressForm({ initial, onSave, onCancel, saving }) {
  const [label, setLabel] = useState(initial?.label || "Home");
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [landmark, setLandmark] = useState(initial?.landmark || "");
  const [lat, setLat] = useState(initial?.lat ?? null);
  const [lng, setLng] = useState(initial?.lng ?? null);
  const [zone, setZone] = useState(initial?.zone || null);

  const handleAddressChange = (next) => {
    setAddress(next);
    setLat(null);
    setLng(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) return;
    const finalZone = zone || classifyAddressZone(address);
    onSave({
      label,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      lat,
      lng,
      zone: finalZone,
    });
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
        <AddressAutocomplete
          value={address}
          onChange={handleAddressChange}
          onResolved={(d) => {
            if (d?.lat != null && d?.lng != null) {
              setLat(d.lat);
              setLng(d.lng);
            }
            const detectedZone = classifyAddressZone(d?.address);
            if (detectedZone) setZone(detectedZone);
          }}
          placeholder="Start typing your street or estate"
          className="h-11 rounded-xl"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Pick the suggestion so we find your exact street, then add your house or flat number.
        </p>
        <div className="mt-2">
          <AddressPickerMap
            onConfirmLocation={({ address: pickedAddress, lat: pLat, lng: pLng, zone: detectedZone }) => {
              if (pickedAddress) setAddress(pickedAddress);
              if (pLat != null && pLng != null) {
                setLat(pLat);
                setLng(pLng);
              }
              const addressZone = classifyAddressZone(pickedAddress);
              if (addressZone) setZone(addressZone);
              else if (detectedZone) setZone(detectedZone);
            }}
          />
        </div>
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
      {zone && (
        <p className="text-xs text-muted-foreground">
          Delivery zone: {zone === 'island' ? 'Lagos Island' : 'Mainland'}
        </p>
      )}
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
