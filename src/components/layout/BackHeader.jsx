import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/55 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto w-full flex items-center px-4 h-16">
        <button
          onClick={goBack}
          aria-label="Back"
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </header>
  );
}