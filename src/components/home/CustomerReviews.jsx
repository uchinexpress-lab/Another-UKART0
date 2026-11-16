import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Plus, Camera, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function CustomerReviews({ reviews: initialReviews = [] }) {
  const [liveReviews, setLiveReviews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('Lekki, Lagos');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLiveReviews = async () => {
    const { data } = await supabase
      .from('customer_reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (Array.isArray(data)) setLiveReviews(data);
  };

  useEffect(() => {
    loadLiveReviews();
  }, []);

  const allReviews = [...liveReviews, ...(initialReviews || [])];

  useEffect(() => {
    if (allReviews.length <= 1 || paused || showModal) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allReviews.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [allReviews.length, paused, showModal]);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `reviews/review-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      if (data?.publicUrl) setPhotoUrl(data.publicUrl);
    } catch (err) {
      alert('Photo upload failed: ' + (err?.message || 'Try again'));
    } finally {
      setUploading(false);
    }
  };
      const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || !contact.trim()) return;
    setSubmitting(true);
    try {
      const raw = contact.trim();
      const digits = raw.replace(/\D/g, '').slice(-10);
      const isEmail = raw.includes('@');

      if (!isEmail && digits.length < 10) {
        alert('Please enter the exact email address or 10/11-digit phone number used on your paid order.');
        setSubmitting(false);
        return;
      }

      let query = supabase
        .from('orders')
        .select('id, order_number, customer_email, customer_phone, payment_status')
        .eq('payment_status', 'paid')
        .limit(1);

      if (isEmail) {
        query = query.ilike('customer_email', raw);
      } else {
        query = query.ilike('customer_phone', `%${digits}`);
      }

      const { data: matchedOrders, error: orderErr } = await query;

      if (orderErr) throw orderErr;
      if (!matchedOrders || matchedOrders.length === 0) {
        alert('Only verified customers with a paid order can submit feedback.');
        setSubmitting(false);
        return;
      }

            const verifiedOrder = matchedOrders[0];
      const { error } = await supabase.from('customer_reviews').insert({
        customer_name: name.trim(),
        customer_contact: raw,
        order_number: verifiedOrder?.order_number || null,
        location: location.trim() || 'Lagos',
        rating,
        text: text.trim(),
        photo_url: photoUrl || null,
        is_approved: false,
      });
      if (error) throw error;

      setName('');
      setContact('');
      setText('');
      setPhotoUrl('');
      setRating(5);
      setShowModal(false);
      setSubmittedNotice(true);
      setTimeout(() => setSubmittedNotice(false), 6000);
    } catch (err) {
      alert('Could not post review: ' + (err?.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!allReviews.length) return null;
  const current = allReviews[activeIndex % allReviews.length];

  return (
    <section
      className="px-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1.5 rounded-full flex items-center gap-1 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Add Review
        </button>
      </div>

      {submittedNotice && (
        <div className="mb-2.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs text-[#2E7D32] font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Thank you! Your review has been submitted and will appear once approved by our team.
        </div>
      )}

      {/* Single Auto-Rotating Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #76C237, #2E7D32)' }}
            >
              {(current.customer_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {current.customer_name}
                </span>
                {current.order_number && (
                  <span className="text-[10px] font-semibold text-[#2E7D32] bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
                    Verified Buyer
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{current.location}</div>
            </div>
          </div>

          <div className="flex gap-0.5 shrink-0">
            {[...Array(Math.min(5, Math.max(1, current.rating || 5)))].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{current.text}&rdquo;</p>

        {current.photo_url && (
          <img
            src={current.photo_url}
            alt={`Review by ${current.customer_name}`}
            className="mt-2.5 w-full max-h-44 object-cover rounded-xl border border-gray-100"
          />
        )}

        {/* Carousel Controls & Dots */}
        {allReviews.length > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              {allReviews.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Review ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeIndex % allReviews.length
                      ? 'w-4 bg-[#2E7D32]'
                      : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + allReviews.length) % allReviews.length)
                }
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % allReviews.length)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Verified Buyer Review + Photo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Share Your Feedback</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Rating</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600">Your Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chidinma A."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mt-1 outline-none focus:border-[#2E7D32]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Area</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lekki, Lagos"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mt-1 outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Checkout Email or Phone Number (Verified Buyers Only) *
              </label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter email or phone used on your order"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mt-1 outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Your Review *</label>
              <textarea
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell others about your delivery or items..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mt-1 outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32] border border-[#2E7D32]/30 bg-[#E8F5E9]/50 px-3 py-2 rounded-xl cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {photoUrl ? 'Change Photo' : 'Add Delivery Photo (Optional)'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                />
              </label>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="mt-2 w-full max-h-28 object-cover rounded-xl border border-gray-200"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full h-11 rounded-xl bg-[#2E7D32] text-white font-bold text-sm disabled:opacity-50"
            >
              {submitting ? 'Verifying Order & Posting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
