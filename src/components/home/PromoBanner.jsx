import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BannerSlider from '@/components/banners/BannerSlider';

export default function PromoBanner() {
  const navigate = useNavigate();

  return (
    <BannerSlider location="home" rounded="rounded-3xl">
      <div className="relative rounded-3xl overflow-hidden h-44">
        <img src="https://images.pexels.com/photos/33624058/pexels-photo-33624058.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"

        alt="Fresh grocery shelf"
        className="absolute inset-0 w-full h-full object-cover" />
        
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
            'linear-gradient(135deg, rgba(27,94,32,0.55) 0%, rgba(46,125,50,0.30) 100%)'
          }} />
        
        <div className="relative p-5 h-full flex flex-col justify-center opacity-100">
          <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2 tracking-wide w-fit">
            Delivering Across Lagos
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight tracking-tight drop-shadow-md">
            NO MARKET WAHALA.
          </h2>
          <p className="text-xs text-white/95 mt-1 mb-3 max-w-[210px] font-medium drop-shadow-sm">
            Fresh groceries delivered across Lagos with fast, reliable delivery.
          </p>
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-1.5 bg-white text-[#2E7D32] text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-50 active:scale-95 transition-all w-fit shadow-md">
            
            Shop Now <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </BannerSlider>
  );
}