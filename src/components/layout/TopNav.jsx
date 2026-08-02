import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ShoppingCart,
  MapPin,
  ChevronDown,
  Search,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setFirstName((u?.full_name || 'there').split(' ')[0]))
      .catch(() => setFirstName('there'));
  }, []);

  const areaDisplay = location?.area ?? 'your area';

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65] shadow-[0_2px_16px_rgba(0,0,0,0.12)]">
      <div className="max-w-md mx-auto w-full px-4 pt-4 pb-3">
        {/* Greeting + right actions */}
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
            <button className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform">
              <Bell className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-white/15 active:scale-90 transition-transform"
            >
              <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ff4d4d] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Location selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-white text-sm font-medium mt-3 -ml-1 px-1 py-0.5 rounded-lg active:scale-95 transition-transform no-tap-highlight">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="flex flex-col items-start leading-tight">
                <span className="truncate max-w-[180px]">{areaDisplay}, Lagos</span>
                {location?.line2 && (
                  <span className="text-[10px] text-white/80 font-normal">{location.line2}</span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-[#2E9E44] font-semibold">
              Lagos Island · 35–90 mins
            </DropdownMenuLabel>
            {LAGOS_AREAS.island.map((area) => (
              <DropdownMenuItem
                key={area}
                onClick={() => setManual(area)}
                className={location?.area === area ? 'bg-[#2E9E44]/10 font-semibold' : ''}
              >
                {area}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[#2E9E44] font-semibold">
              Lagos Mainland · Same Day
            </DropdownMenuLabel>
            {LAGOS_AREAS.mainland.map((area) => (
              <DropdownMenuItem
                key={area}
                onClick={() => setManual(area)}
                className={location?.area === area ? 'bg-[#2E9E44]/10 font-semibold' : ''}
              >
                {area}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
    </header>
  );
}