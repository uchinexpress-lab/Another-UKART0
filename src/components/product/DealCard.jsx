import React from 'react';
import ProductCard from '@/components/product/ProductCard';

export default function DealCard({ product }) {
  return <ProductCard product={product} respectComingSoon={false} animated={false} />;
}