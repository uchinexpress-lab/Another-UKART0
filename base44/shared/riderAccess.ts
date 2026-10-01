export async function isApprovedAssignedRider(admin, user, delivery) {
  if (delivery.rider_user_id !== user.id || !delivery.rider_id) return false;
  const rider = await admin.entities.Rider.get(delivery.rider_id);
  return Boolean(rider && rider.user_id === user.id && rider.approval_status === 'approved');
}