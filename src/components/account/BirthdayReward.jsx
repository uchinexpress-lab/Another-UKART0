import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Tag, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function BirthdayReward() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.BirthdayReward.filter(
          {},
          { sort: '-created_date', limit: 10 }
        );
        setRewards(res.items || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading || rewards.length === 0) return null;

  return (
    <div>
      <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
        Birthday Reward
      </h2>
      <div className="space-y-3">
        {rewards.map((reward) => {
          const isExpired = new Date(reward.expiry_date) < new Date();
          const isRedeemed = reward.status === 'redeemed';
          const isAvailable = !isExpired && !isRedeemed;
          const status = isRedeemed ? 'Used' : isExpired ? 'Expired' : 'Available';
          const statusColor = isRedeemed
            ? 'text-green-600'
            : isExpired
            ? 'text-muted-foreground'
            : 'text-primary';
          const StatusIcon = isRedeemed
            ? CheckCircle2
            : isExpired
            ? XCircle
            : Gift;

          return (
            <div key={reward.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    ₦{(reward.voucher_amount || 0).toLocaleString()} Birthday Voucher
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status}
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-bold text-foreground tracking-wider">
                  {reward.voucher_code}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                Expires:{' '}
                {new Date(reward.expiry_date).toLocaleString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {isAvailable && (
                <p className="text-[11px] text-primary mt-2 font-medium">
                  Use this code at checkout to get ₦
                  {(reward.voucher_amount || 0).toLocaleString()} off your order!
                </p>
              )}
              {reward.is_test && (
                <span className="inline-block mt-2 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                  TEST
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}