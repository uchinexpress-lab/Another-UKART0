
import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Check } from 'lucide-react';

export default function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  placeholder,
  className
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [verified, setVerified] = useState(false);

  const timer = useRef(null);
  const controller = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, []);

  const formatAddress = (p) => {
    const parts = [
      p.housenumber,
      p.street || p.name,
      p.district,
      p.city || p.county,
      p.state,
      p.country
    ].filter(Boolean);

    return [...new Set(parts)].join(', ');
  };

  const search = (text) => {
    clearTimeout(timer.current);
    controller.current?.abort();

    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    timer.current = setTimeout(async () => {
      const abortController = new AbortController();
      controller.current = abortController;

      setSearching(true);

      try {
        const params = new URLSearchParams({
          q: text.trim(),
          limit: '6',
          lang: 'en',
          lat: '6.5244',
          lon: '3.3792'
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error('Address search failed');
        }

        const data = await response.json();

        const results = (data.features || [])
          .map((feature) => {
            const p = feature.properties || {};
            const address = formatAddress(p);
            const coordinates = feature.geometry?.coordinates;

            if (!address || !coordinates) return null;

            return {
              id: `${p.osm_type || ''}-${p.osm_id || address}`,
              main: p.name || p.street || p.city || address,
              secondary: address,
              address,
              lat: coordinates[1],
              lng: coordinates[0]
            };
          })
          .filter(Boolean);

        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearching(false);
        }
      }
    }, 400);
  };

  const handleChange = (e) => {
    const text = e.target.value;

    setVerified(false);
    onChange(text);
    search(text);
  };

  const pick = (suggestion) => {
    setOpen(false);
    setSuggestions([]);
    setVerified(true);

    onChange(suggestion.address);

    onResolved?.({
      address: suggestion.address,
      lat: suggestion.lat,
      lng: suggestion.lng
    });
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
          autoComplete="off"
        />

        {searching && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {verified && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-retail mt-1.5">
          <Check className="w-3 h-3" />
          Location selected
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-border last:border-0 active:bg-muted/60"
            >
              <MapPin className="w-4 h-4 text-retail shrink-0 mt-0.5" />

              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground truncate">
                  {s.main}
                </span>

                <span className="block text-[11px] text-muted-foreground truncate">
                  {s.secondary}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
