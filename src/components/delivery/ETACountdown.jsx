import React, { useState, useEffect } from 'react';

// Server-synchronized ETA countdown.
// Uses estimatedDeliveryAt (ISO string from backend) as the source of truth,
// not the client's clock alone. Ticks every second but derives remaining time
// from Date.now() vs the server-set timestamp.
export default function ETACountdown({ estimatedDeliveryAt, estimatedMinutes, status, lastEtaUpdate }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'delivered') {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-green-600">DELIVERED</p>
        <p className="text-xs text-gray-400 mt-1">Order completed</p>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-red-500">CANCELLED</p>
      </div>
    );
  }

  if (!estimatedDeliveryAt) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-400">—</p>
        <p className="text-xs text-gray-400 mt-1">Calculating ETA...</p>
      </div>
    );
  }

  const target = new Date(estimatedDeliveryAt).getTime();
  const remainingMs = target - now;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  // ETA has passed — show "ARRIVING SOON" instead of negative values
  if (remainingMs <= 0) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-orange-500 animate-pulse">ARRIVING SOON</p>
        <p className="text-xs text-gray-400 mt-1">Rider is almost there</p>
      </div>
    );
  }

  // Less than 5 minutes — show "ARRIVING NOW" style
  if (remainingMin < 1) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-orange-500 animate-pulse">
          {String(remainingSec).padStart(2, '0')}s
        </p>
        <p className="text-xs text-gray-400 mt-1">Arriving now</p>
      </div>
    );
  }

  // Format as MM:SS or HH:MM:SS
  const hours = Math.floor(remainingMin / 60);
  const mins = remainingMin % 60;
  const secs = remainingSec;

  const timeDisplay = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(remainingMin).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Arriving In</p>
      <p className="text-4xl font-bold text-[#2E7D32] tabular-nums tracking-tight">{timeDisplay}</p>
      <p className="text-xs text-gray-400 mt-1">
        {remainingMin} min{remainingMin !== 1 ? 's' : ''} remaining
      </p>
    </div>
  );
}