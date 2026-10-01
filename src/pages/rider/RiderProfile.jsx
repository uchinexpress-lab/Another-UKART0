import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  User, Phone, Bike, MapPin, Star, LogOut, Camera, Upload,
  Loader2, Power, TrendingUp,
} from 'lucide-react';

export default function RiderProfile() {
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
        if (riders.items?.length) setRider(riders.items[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const updated = await base44.entities.Rider.update(rider.id, {
        is_online: !rider.is_online,
        is_available: !rider.is_online,
      });
      setRider(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      navigate('/rider/login');
    } catch {
      navigate('/rider/login');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-gray-500">Rider profile not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
            {rider.photo ? (
              <img src={rider.photo} alt={rider.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">{rider.name}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {rider.phone}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                {rider.approval_status}
              </span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {rider.rating?.toFixed(1) || '5.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Online toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className={`w-5 h-5 ${rider.is_online ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-bold text-gray-900">{rider.is_online ? 'Online' : 'Offline'}</p>
              <p className="text-xs text-gray-500">{rider.is_online ? 'Available for deliveries' : 'Go online to receive deliveries'}</p>
            </div>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`relative w-14 h-8 rounded-full transition-colors ${rider.is_online ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${rider.is_online ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{rider.completed_deliveries || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Bike className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{rider.cancelled_deliveries || 0}</p>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Vehicle Information</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Type</span>
          <span className="font-medium text-gray-900 capitalize">{rider.vehicle_type}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Number</span>
          <span className="font-medium text-gray-900">{rider.vehicle_number}</span>
        </div>
        {rider.emergency_contact && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Emergency Contact</span>
            <span className="font-medium text-gray-900">{rider.emergency_contact}</span>
          </div>
        )}
        {rider.address && (
          <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{rider.address}</span>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full h-12 rounded-2xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </div>
  );
}