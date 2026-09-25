import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Loader2, Camera, X, ImagePlus } from 'lucide-react';
import { Image } from '@/components/ui/image';

const MAX_PHOTOS = 4;

export default function RateDeliveryCard({ order }) {
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // File objects
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

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
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  const submitted = existing || done;
  const shownRating = existing?.rating || rating;
  const shownPhotos = existing?.photos || [];

  if (submitted) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] font-medium">
          <Star className="w-4 h-4 fill-[#FFB300] text-[#FFB300]" />
          <span>Thanks for your feedback!</span>
          <span className="text-amber-500">{'★'.repeat(shownRating)}</span>
        </div>
        {shownPhotos.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {shownPhotos.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
                <Image src={url} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length) setPhotos((p) => [...p, ...toAdd]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      // Upload photos first
      const uploadedUrls = [];
      for (const file of photos) {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        if (res?.file_url) uploadedUrls.push(res.file_url);
      }

      await base44.entities.DeliveryReview.create({
        order_id: order.id,
        order_number: order.order_number,
        rating,
        comment: comment.trim(),
        customer_name: order.customer_name,
        photos: uploadedUrls,
      });
      setDone(true);
    } catch {
      alert('Could not submit rating. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-1.5">How was your delivery?</p>
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
                (hover || rating) >= s ? 'fill-[#FFB300] text-[#FFB300]' : 'text-muted-foreground/40'
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
            className="w-full text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-primary bg-card text-foreground placeholder:text-muted-foreground resize-none"
          />

          {/* Photo upload */}
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> Share photos of your groceries ({photos.length}/{MAX_PHOTOS})
            </p>
            <div className="flex gap-2 flex-wrap">
              {photos.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
                  <img src={URL.createObjectURL(file)} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center active:scale-90"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-3 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-full disabled:opacity-50 active:scale-95 transition-transform"
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      )}
    </div>
  );
}