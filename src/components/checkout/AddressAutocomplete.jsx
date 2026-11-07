import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Loader2, Check } from 'lucide-react';

// Uber-style address search: type a street or area, pick the matching
// suggestion, and the field is filled with the verified Google address.
export default function AddressAutocomplete({ value, onChange, onResolved, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [verified, setVerified] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (text) => {
    clearTimeout(timer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await base44.functions.invoke('lookupAddress', { input: text });
        setSuggestions(res.data?.suggestions || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleChange = (e) => {
    setVerified(false);
    onChange(e.target.value);
    search(e.target.value);
  };

  const pick = async (s) => {
    setOpen(false);
    setSuggestions([]);
    setResolving(true);
    try {
      const res = await base44.functions.invoke('lookupAddress', { placeId: s.placeId });
      const address = res.data?.address || s.main;
      onChange(address);
      setVerified(true);
      onResolved?.(res.data || {});
    } catch {
      onChange(s.main);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={className}
        />
        {(searching || resolving) && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {verified && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-retail mt-1.5">
          <Check className="w-3 h-3" /> Address verified
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-border last:border-0 active:bg-muted/60"
            >
              <MapPin className="w-4 h-4 text-retail shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground truncate">{s.main}</span>
                {s.secondary && (
                  <span className="block text-[11px] text-muted-foreground truncate">{s.secondary}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}