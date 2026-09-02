import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Loader2 } from 'lucide-react';

export default function RateDeliveryCard({ order }) {
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.DeliveryReview
      .filter({ order_id: order.id })
      .then((r) => alive && setExisting(r[0] || null))
      .catch(() => {})
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [order.id]);

  if (checking) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  const submitted = existing || done;
  const shownRating = existing?.rating || rating;

  if (submitted) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#2E7D32] font-medium">
        <Star className="w-4 h-4 fill-[#FFB300] text-[#FFB300]" />
        <span>Thanks for your feedback!</span>
        <span className="text-amber-500">{'★'.repeat(shownRating)}</span>
      </div>
    );
  }

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await base44.entities.DeliveryReview.create({
        order_id: order.id,
        order_number: order.order_number,
        rating,
        comment: comment.trim(),
        customer_name: order.customer_name,
      });
      setDone(true);
    } catch {
      alert('Could not submit rating. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-600 mb-1.5">How was your delivery?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="active:scale-90 transition-transform"
            aria-label={`${s} star`}
          >
            <Star
              className={`w-6 h-6 ${
                (hover || rating) >= s
                  ? 'fill-[#FFB300] text-[#FFB300]'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your order…"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#2E7D32] resize-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-2 text-xs font-semibold bg-[#2E7D32] text-white px-4 py-2 rounded-full disabled:opacity-50 active:scale-95 transition-transform"
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      )}
    </div>
  );
}