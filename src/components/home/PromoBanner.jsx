import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function PromoBanner() {
  const navigate = useNavigate();

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #76C237 100%)' }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop)",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative p-5">
        <span className="inline-block bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-2 tracking-wide">
          NEW IN LAGOS
        </span>
        <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
          NO MARKET WAHALA.
        </h2>
        <p className="text-xs text-white/85 mt-1 mb-3 max-w-[200px]">
          Fresh groceries delivered across Lagos with fast, reliable delivery.
        </p>
        <button
          onClick={() => navigate('/packages')}
          className="inline-flex items-center gap-1.5 bg-white text-[#2E7D32] text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          Shop Now <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}