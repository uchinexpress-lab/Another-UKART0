import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;
    const page = await admin.entities.Rider.filter({ user_id: user.id, approval_status: 'approved' }, { limit: 1 });
    const rider = page.items[0];
    if (!rider) return Response.json({ error: 'Approved rider account required' }, { status: 403 });
    const body = await req.json();
    let update;
    if (body.action === 'availability') {
      if (typeof body.online !== 'boolean') return Response.json({ error: 'Online must be true or false' }, { status: 400 });
      const active = await admin.entities.Delivery.count({ rider_id: rider.id, status: { $nin: ['delivered', 'cancelled'] } });
      update = { is_online: body.online, is_available: body.online && active === 0 };
    } else if (body.action === 'profile') {
      const profile = body.profile || {};
      const keys = ['name', 'phone', 'vehicle_number', 'emergency_contact', 'address'];
      if (keys.some(key => typeof profile[key] !== 'string') || !profile.name.trim() || !profile.phone.trim()) return Response.json({ error: 'Valid name and phone are required' }, { status: 400 });
      update = Object.fromEntries(keys.map(key => [key, profile[key].trim()]));
    } else return Response.json({ error: 'Unknown action' }, { status: 400 });
    return Response.json({ rider: await admin.entities.Rider.update(rider.id, update) });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}