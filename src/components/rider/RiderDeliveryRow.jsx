import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function RiderDeliveryRow({ delivery }) {
  return <Link to={`/rider/delivery/${delivery.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
    <div className="min-w-0"><p className="text-sm font-bold">#{delivery.order_number}</p><p className="text-xs text-muted-foreground capitalize mt-1">{delivery.status.replaceAll('_', ' ')}</p><p className="text-xs truncate mt-1">{delivery.customer_address}</p>{delivery.delivered_at && <p className="text-xs text-muted-foreground mt-1">{new Date(delivery.delivered_at).toLocaleString()}</p>}</div><ChevronRight className="h-4 w-4 shrink-0" />
  </Link>;
}