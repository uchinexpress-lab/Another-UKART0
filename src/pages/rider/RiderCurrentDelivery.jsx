import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RiderActiveDelivery from '@/pages/rider/RiderActiveDelivery';

export default function RiderCurrentDelivery() {
  const { rider } = useOutletContext();
  const { data, isLoading, error } = useQuery({ queryKey: ['rider-current-delivery', rider.id], queryFn: () => base44.entities.Delivery.filter({ rider_id: rider.id, status: { $nin: ['delivered', 'cancelled'] } }, { sort: '-created_date', limit: 1 }) });
  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading active delivery...</p>;
  if (error) return <p role="alert" className="p-4 text-sm text-destructive">{error.message}</p>;
  const delivery = data.items[0];
  if (delivery) return <RiderActiveDelivery key={delivery.id} deliveryId={delivery.id} />;
  return <div className="space-y-3 p-6"><h1 className="text-lg font-bold">Active Delivery</h1><p className="text-sm text-muted-foreground">No active delivery assigned.</p><Link to="/rider/deliveries" className="text-sm text-primary underline">View Deliveries & History</Link></div>;
}