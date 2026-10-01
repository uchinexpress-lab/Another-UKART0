import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bike, Loader2, Camera, Upload } from 'lucide-react';

export default function RiderRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = account, 2 = profile
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    vehicleType: 'motorcycle',
    vehicleNumber: '',
    emergencyContact: '',
    address: '',
    photo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      set('photo', file_uri);
    } catch {
      setError('Photo upload failed. Please try again.');
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setStep(2);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Register the user account
      await base44.auth.register({ email: form.email, password: form.password });
      // Create rider profile (pending approval)
      const user = await base44.auth.me();
      await base44.entities.Rider.create({
        user_id: user.id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        photo: form.photo,
        vehicle_type: form.vehicleType,
        vehicle_number: form.vehicleNumber,
        emergency_contact: form.emergencyContact,
        address: form.address,
        approval_status: 'pending',
        is_online: false,
        is_available: false,
        completed_deliveries: 0,
        cancelled_deliveries: 0,
        rating: 5,
        registered_at: new Date().toISOString(),
      });
      navigate('/rider/pending');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <div className="bg-[#1B4332] px-6 pt-10 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Bike className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold text-white">Ukart Rider Registration</h1>
        </div>
        <p className="text-sm text-green-200/70">
          {step === 1 ? 'Step 1 of 2 — Create your account' : 'Step 2 of 2 — Rider profile details'}
        </p>
        <div className="flex gap-1.5 mt-4">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-green-400' : 'bg-white/20'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-green-400' : 'bg-white/20'}`} />
        </div>
      </div>

      <div className="px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#2E7D32] text-white font-bold text-sm active:scale-[0.98] transition-transform"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center mb-2">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                {form.photo ? (
                  <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="mt-2 text-xs font-semibold text-[#2E7D32] flex items-center gap-1 cursor-pointer">
                <Upload className="w-3 h-3" /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="0801 234 5678"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Vehicle Type</label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => set('vehicleType', e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32] bg-white"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Vehicle Number</label>
                <input
                  required
                  value={form.vehicleNumber}
                  onChange={(e) => set('vehicleNumber', e.target.value)}
                  placeholder="Plate number"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Emergency Contact (Optional)</label>
              <input
                type="tel"
                value={form.emergencyContact}
                onChange={(e) => set('emergencyContact', e.target.value)}
                placeholder="0801 234 5678"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Home Address</label>
              <textarea
                required
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/rider/login')} className="text-[#2E7D32] font-semibold">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}