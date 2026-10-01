import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RiderDeliveryRow from '@/components/rider/RiderDeliveryRow';
import { Button } from '@/components/ui/button';

export default function RiderDeliveries() {
  const { rider } = useOutletContext();
  const [tab, setTab] = useState('active');
  const [cursor, setCursor] = useState(null);
  const [previous, setPrevious] = useState([]);
  const query = { rider_id: rider.id, status: tab === 'history' ? { $in: ['delivered', 'cancelled'] } : { $nin: ['delivered', 'cancelled'] } };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['rider-deliveries', rider.id, tab, cursor], queryFn: () => base44.entities.Delivery.filter(query, { sort: '-created_date', limit: 20, ...(cursor ? { cursor } : {}) }) });
  useEffect(() => base44.entities.Delivery.subscribe(() => refetch()), [refetch]);
  function changeTab(next) { setPrevious([]); setCursor(null); setTab(next); }
  const deliveries = [...previous, ...(data?.items || [])];
  return <div className="space-y-4 p-4"><h1 className="text-lg font-bold">Deliveries</h1><div className="flex gap-2"><Button variant={tab === 'active' ? 'default' : 'outline'} onClick={() => changeTab('active')}>Assigned & Active</Button><Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => changeTab('history')}>History</Button></div>
    <Link className="block text-sm text-primary underline" to="/rider/active-delivery">Open Active Delivery</Link>
    {isLoading ? <p className="text-sm text-muted-foreground">Loading deliveries...</p> : error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : deliveries.length === 0 ? <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{tab === 'history' ? 'No delivery history yet' : 'No deliveries assigned yet'}</p> : deliveries.map(delivery => <RiderDeliveryRow key={delivery.id} delivery={delivery} />)}
    {data?.has_more && <Button variant="outline" onClick={() => { setPrevious(deliveries); setCursor(data.next_cursor); }}>Load More</Button>}
  </div>;
}