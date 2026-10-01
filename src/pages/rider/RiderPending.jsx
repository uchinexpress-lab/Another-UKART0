import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Clock, CheckCircle2 } from 'lucide-react';

export default function RiderPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Clock className="w-10 h-10 text-amber-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Registration Received</h1>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
        Your rider application is being reviewed by the Ukart admin team. You'll be able to
        start delivering once your account is approved.
      </p>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 w-full space-y-2.5 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">Application submitted</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-gray-700">Awaiting admin approval</span>
        </div>
      </div>
      <button
        onClick={() => navigate('/rider/login')}
        className="w-full h-12 rounded-xl bg-[#2E7D32] text-white font-bold text-sm active:scale-[0.98] transition-transform"
      >
        Back to Login
      </button>
    </div>
  );
}