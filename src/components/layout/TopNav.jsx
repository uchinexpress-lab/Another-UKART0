import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Headset,
  MapPin,
  ChevronDown,
  Search,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const LAGOS_AREAS = {
  island: [
    'Ajah',
    'Lekki Phase 1',
    'Victoria Island',
    'Ikoyi',
    'Chevron',
    'VGC',
    'Sangotedo',
    'Abraham Adesanya',
    'Ikate',
    'Oniru',
  ],
  mainland: [
    'Yaba',
    'Surulere',
    'Ikeja',
    'Maryland',
    'Gbagada',
    'Ikorodu',
    'Festac',
    'Isolo',
    'Egbeda',
    'Agege',
    'Oshodi',
    'Mushin',
    'Ketu',
    'Ogudu',
    'Magodo',
  ],
};

export default function TopNav() {
  const { location, status, setManual } = useDeliveryLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [firstName, setFirstName] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const greetingRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setFirstName((u?.full_name || 'there').split(' ')[0]))
      .catch(() => setFirstName('there'));
  }, []);

  useEffect(() => {
    const el = greetingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const areaDisplay = location?.area ?? 'your area';

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {/* Greeting — scrolls away */}
      <div ref={greetingRef} className="bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65]">
        <div className="max-w-md mx-auto w-full px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <div className="flex items-start justify-between">
          <div className="text-white">
            <p className="text-lg font-bold leading-tight">
              Hello, {firstName} 👋
            </p>
            <p className="text-xs text-white/85 leading-tight mt-0.5">
              What would you like today?
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to="/notifications"
              className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={2} />
            </Link>
            <Link
              to="/tickets"
              className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform"
              aria-label="Customer care"
            >
              <Headset className="w-5 h-5 text-white" strokeWidth={2} />
            </Link>
          </div>
          </div>
        </div>
      </div>
      {/* Location + search — sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65] shadow-[0_2px_16px_rgba(0,0,0,0.12)]">
      <div className="max-w-md mx-auto w-full px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}>
        <div className="flex items-center justify-between mt-3">
        {/* Location selector */}
        <Drawer open={areaOpen} onOpenChange={setAreaOpen}>
          <DrawerTrigger asChild>
            <button className="flex items-center gap-1 text-white text-sm font-medium -ml-1 px-1 py-0.5 rounded-lg active:scale-95 transition-transform no-tap-highlight">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="flex flex-col items-start leading-tight">
                <span className="truncate max-w-[180px]">{areaDisplay}, Lagos</span>
                {location?.line2 && (
                  <span className="text-[11px] text-white/80 font-normal">{location.line2}</span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Choose delivery area</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#2E9E44] uppercase mb-2">Lagos Island · 35–90 mins</p>
                <div className="grid grid-cols-2 gap-2">
                  {LAGOS_AREAS.island.map((area) => (
                    <button
                      key={area}
                      onClick={() => { setManual(area); setAreaOpen(false); }}
                      className={`text-left text-sm px-3 py-2.5 rounded-xl border ${location?.area === area ? 'bg-[#2E9E44]/10 border-[#2E9E44] font-semibold text-[#1B7F3A]' : 'border-gray-100 text-gray-700 active:bg-gray-50'}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2E9E44] uppercase mb-2">Lagos Mainland · Same Day</p>
                <div className="grid grid-cols-2 gap-2">
                  {LAGOS_AREAS.mainland.map((area) => (
                    <button
                      key={area}
                      onClick={() => { setManual(area); setAreaOpen(false); }}
                      className={`text-left text-sm px-3 py-2.5 rounded-xl border ${location?.area === area ? 'bg-[#2E9E44]/10 border-[#2E9E44] font-semibold text-[#1B7F3A]' : 'border-gray-100 text-gray-700 active:bg-gray-50'}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        {scrolled && (
          <div className="flex items-center gap-1.5">
            <Link
              to="/notifications"
              className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={2} />
            </Link>
            <Link
              to="/tickets"
              className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform"
              aria-label="Customer care"
            >
              <Headset className="w-5 h-5 text-white" strokeWidth={2} />
            </Link>
          </div>
        )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for groceries, packages, meal kits…"
            className="w-full pl-4 pr-12 h-12 rounded-full bg-white text-sm font-medium text-gray-900 placeholder:text-[#6e8f5c] shadow-sm focus:ring-2 focus:ring-white/60 focus:scale-[1.01] outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#2E9E44] flex items-center justify-center active:scale-90 transition-transform"
          >
            <Search className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </form>
      </div>
      </div>
    </>
  );
}