import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Headset,
  MapPin,
  ChevronDown,
  Search,
  Bike,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import AdminEntry from '@/components/staff/AdminEntry';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [greeting, setGreeting] = useState(null);

  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0]?.split(/[._]/)[0];

  // One-time welcome greeting in the search bar, once per browser session.
  // Waits for the splash screen to finish before starting.
  useEffect(() => {
    if (!firstName) return;
    if (sessionStorage.getItem('ukart_greeting_shown') === '1') return;
    sessionStorage.setItem('ukart_greeting_shown', '1');

    let t1, t2, poll;
    let started = false;

    const beginGreeting = () => {
      if (started) return;
      started = true;
      setGreeting(`Welcome back, ${firstName} 👋`);
      t1 = setTimeout(() => setGreeting('What would you like today?'), 1500);
      t2 = setTimeout(() => setGreeting(null), 3000);
    };

    const splash = document.querySelector('[class*="z-[200]"]');
    if (splash) {
      poll = setInterval(() => {
        if (!document.body.contains(splash)) {
          clearInterval(poll);
          beginGreeting();
        }
      }, 200);
    } else {
      beginGreeting();
    }

    return () => {
      clearInterval(poll);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [firstName]);

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (greeting) setGreeting(null);
            }}
            onFocus={() => { if (greeting) setGreeting(null); }}
            placeholder={greeting ? '' : 'Search for groceries, packages, meal kits…'}
            className="w-full pl-11 pr-14 h-12 rounded-full bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
          <AnimatePresence mode="wait">
            {greeting && !query && (
              <motion.div
                key={greeting}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute left-11 right-14 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-medium text-foreground truncate"
              >
                {greeting}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </button>
        </form>
        <AdminEntry compact />
      </div>
    </div>
  );
}