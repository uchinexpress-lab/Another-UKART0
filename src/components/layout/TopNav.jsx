import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Menu as MenuIcon,
  ChevronDown,
  Truck,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import SearchBar from '@/components/search/SearchBar';
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

  const areaDisplay = location?.area ?? 'your area';
  const line2 = location
    ? location.line2
    : status === 'requesting'
    ? 'Detecting your location…'
    : 'Tap to select your area';

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto w-full px-4 py-2.5 flex items-center justify-between">
        {/* Location selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-start text-left max-w-[62%] -ml-1 px-1 rounded-lg active:scale-95 transition-transform no-tap-highlight">
              <span className="flex items-center gap-1 font-bold text-gray-900 text-[15px] leading-tight">
                <span className="truncate">📍 Delivering to {areaDisplay}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </span>
              <span className="text-xs text-gray-500 leading-tight mt-0.5 truncate w-full">
                {line2}
              </span>
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

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-black/5 active:scale-90 transition-transform">
                <MenuIcon className="w-5 h-5 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Truck className="w-4 h-4 mr-2" /> Track Order</DropdownMenuItem>
              <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
              <DropdownMenuItem><HelpCircle className="w-4 h-4 mr-2" /> Help &amp; Support</DropdownMenuItem>
              <DropdownMenuItem><Info className="w-4 h-4 mr-2" /> About Ukart</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/profile" className="p-2 rounded-full hover:bg-black/5 active:scale-90 transition-transform">
            <User className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-md mx-auto w-full px-4 pb-2.5">
        <SearchBar />
      </div>
    </header>
  );
}