import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Headset,
  MapPin,
  ChevronDown,
  Search,
  Bike,
} from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
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
  const { location, setManual } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);

  const areaDisplay = location?.area ?? 'your area';
  const deliveryShort = location?.zone === 'island' ? '35–90 mins' : 'Today';

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-[0_1px_8px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* subtle brand-green decoration */}
      <div className="absolute -top-10 -right-12 w-40 h-40 rounded-full bg-primary/10 opacity-60 blur-2xl pointer-events-none" />
      <div className="absolute top-1 right-14 w-20 h-20 rounded-full bg-primary/5 opacity-40 blur-xl pointer-events-none" />
      <div
        className="relative max-w-md mx-auto w-full px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
      >
        {/* Compact top bar: location + delivery + icons */}
        <div className="flex items-center gap-2 mt-2">
          <Drawer open={areaOpen} onOpenChange={setAreaOpen}>
            <DrawerTrigger asChild>
              <button className="flex-1 min-w-0 flex items-center justify-between bg-primary rounded-full pl-3.5 pr-4 py-2.5 active:scale-[0.98] transition-transform">
                <span className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-primary-foreground shrink-0" />
                  <span className="text-xs font-semibold text-primary-foreground truncate flex items-center gap-0.5">
                    {areaDisplay}, Lagos
                    <ChevronDown className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
                  </span>
                </span>
                <span className="w-px h-4 bg-primary-foreground/30 mx-1 shrink-0" />
                <span className="flex items-center gap-1.5 shrink-0">
                  <Bike className="w-4 h-4 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground">
                    {deliveryShort}
                  </span>
                </span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle>Choose delivery area</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-8 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#2E9E44] uppercase mb-2">
                    Lagos Island · 35–90 mins
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {LAGOS_AREAS.island.map((area) => (
                      <button
                        key={area}
                        onClick={() => {
                          setManual(area);
                          setAreaOpen(false);
                        }}
                        className={`text-left text-sm px-3 py-2.5 rounded-xl border ${
                          location?.area === area
                            ? 'bg-[#2E9E44]/10 border-[#2E9E44] font-semibold text-[#1B7F3A]'
                            : 'border-gray-100 text-gray-700 active:bg-gray-50'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2E9E44] uppercase mb-2">
                    Lagos Mainland · Same Day
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {LAGOS_AREAS.mainland.map((area) => (
                      <button
                        key={area}
                        onClick={() => {
                          setManual(area);
                          setAreaOpen(false);
                        }}
                        className={`text-left text-sm px-3 py-2.5 rounded-xl border ${
                          location?.area === area
                            ? 'bg-[#2E9E44]/10 border-[#2E9E44] font-semibold text-[#1B7F3A]'
                            : 'border-gray-100 text-gray-700 active:bg-gray-50'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/notifications"
              className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-primary" />
            </Link>
            <Link
              to="/tickets"
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Customer care"
            >
              <Headset className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mt-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for groceries, packages, meal kits…"
            className="w-full pl-11 pr-14 h-12 rounded-full bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}