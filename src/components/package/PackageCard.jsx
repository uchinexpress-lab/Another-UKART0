import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';

const badgeColors = {
  'Budget Friendly': 'bg-blue-100 text-blue-700',
  'Time Saver': 'bg-amber-100 text-amber-700',
  'Best Value': 'bg-[#2E7D32] text-white'
};

export default function PackageCard({ pkg, className }) {
  const navigate = useNavigate();
  const widthClass = className || 'w-72 flex-shrink-0';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${widthClass} bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm`}>
      
      <div className="relative h-40 bg-gray-50">
        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover opacity-100" />
        {pkg.badge &&
        <span
          className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
          badgeColors[pkg.badge] || 'bg-gray-100 text-gray-700'}`
          }>
          
            {pkg.badge}
          </span>
        }
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{pkg.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pkg.description}</p>
        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
          <Package className="w-3.5 h-3.5" />
          <span>{pkg.item_count} items included</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 block">Starting from</span>
            <div className="text-lg font-bold text-[#2E7D32]">
              ₦{pkg.starting_price.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => navigate(`/package/${pkg.id}`)}
            className="flex items-center gap-1 bg-[#2E7D32] text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-[#1B5E20] transition-all active:scale-95">
            
            View Package <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>);

}