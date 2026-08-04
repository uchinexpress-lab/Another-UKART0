import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TAB_ROOTS = ['/packages', '/offers', '/wishlist', '/profile'];

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
    <header className="relative overflow-hidden rounded-b-3xl shadow-lg">
      {/* Ukart green gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65]" />

      {/* Subtle grocery-themed pattern (leaves, apple, grapes) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="ukart-grocery" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M20 50 C20 30 40 25 55 40 C45 55 30 60 20 50 Z" fill="white" />
            <path d="M25 48 L48 42" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="150" cy="45" r="16" fill="white" />
            <path d="M150 29 C150 22 156 18 162 22" stroke="white" strokeWidth="2" fill="none" />
            <path d="M162 22 C168 18 174 22 170 30 C164 30 160 26 162 22 Z" fill="white" />
            <circle cx="35" cy="150" r="6" fill="white" />
            <circle cx="48" cy="155" r="6" fill="white" />
            <circle cx="42" cy="165" r="6" fill="white" />
            <circle cx="30" cy="162" r="6" fill="white" />
            <path d="M150 150 C150 135 168 132 178 145 C170 158 158 160 150 150 Z" fill="white" />
            <path d="M155 152 L172 146" stroke="white" strokeWidth="1.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ukart-grocery)" />
      </svg>

      {/* Controls */}
      <div
        className={`relative flex items-center gap-3 px-4 pb-6 max-w-md mx-auto w-full ${isTabRoot ? 'justify-center' : ''}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 44px)' }}
      >
        {!isTabRoot && (
          <button
            onClick={goBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h1 className="text-white font-bold text-lg tracking-tight">{title}</h1>
      </div>
    </header>
  );
}