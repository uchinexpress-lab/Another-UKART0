import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TAB_ROOTS = ['/packages', '/order', '/wishlist', '/profile'];

export default function BrandedHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isTabRoot = TAB_ROOTS.includes(location.pathname);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="relative bg-card overflow-hidden border-b border-border">
      {/* subtle pale-green decoration */}
      <div className="absolute -top-10 -right-12 w-44 h-44 rounded-full bg-[#E8F5E9] opacity-60 blur-2xl pointer-events-none" />
      <div className="absolute top-1 right-14 w-24 h-24 rounded-full bg-[#D6F0DD] opacity-40 blur-xl pointer-events-none" />
      <div
        className={`relative flex items-center gap-3 px-4 pb-3 max-w-md mx-auto w-full ${
          isTabRoot ? 'justify-center' : ''
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        {!isTabRoot && (
          <button
            onClick={goBack}
            aria-label="Back"
            className="w-11 h-11 rounded-full bg-[#EEF8EE] flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#2E7D32]" />
          </button>
        )}
        <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}