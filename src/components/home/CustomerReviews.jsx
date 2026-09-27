import React from 'react';
import { Star } from 'lucide-react';

export default function CustomerReviews({ reviews }) {
  if (!reviews?.length) return null;

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Customer Reviews</h2>
      <div className="space-y-2.5">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #76C237, #2E7D32)' }}
              >
                {r.customer_name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">{r.customer_name}</div>
                <div className="text-xs text-gray-500">{r.location}</div>
              </div>
            </div>
            <div className="flex gap-0.5 mb-1.5">
              {[...Array(r.rating || 5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-600">&ldquo;{r.text}&rdquo;</p>
          </div>
        ))}
      </div>
    </section>
  );
}