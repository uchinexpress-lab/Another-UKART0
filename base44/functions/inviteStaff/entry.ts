import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const VALID_STAFF_ROLES = [
  'super_admin', 'support', 'operations', 'content_manager', 'finance', 'rider_manager',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const callerStaffRole = user.staffRole || 'super_admin';
    if (callerStaffRole !== 'super_admin') {
      return Response.json({ error: 'Super Admin access required to manage staff' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const admin = base44.asServiceRole;

    if (action === 'invite') {
      const { email, staffRole } = body;
      if (!email || !staffRole) {
        return Response.json({ error: 'Email and staffRole are required' }, { status: 400 });
      }
      if (!VALID_STAFF_ROLES.includes(staffRole)) {
        return Response.json({ error: 'Invalid staff role' }, { status: 400 });
      }

      // Invite with Base44 auth role = "admin" (never a custom role)
      await base44.users.inviteUser(email, 'admin');

      // Try to set role + staffRole immediately — the user record may already exist
      // (e.g., an existing customer being promoted to staff). For existing users,
      // inviteUser alone does NOT change their role, so we must explicitly set
      // role: 'admin' alongside staffRole.
      let userUpdated = false;
      try {
        const users = await admin.entities.User.list();
        const invitedUser = users.find((u) => u.email === email);
        if (invitedUser) {
          await admin.entities.User.update(invitedUser.id, { role: 'admin', staffRole });
          userUpdated = true;
        }
      } catch (updateErr) {
        // User hasn't accepted the invitation yet — role and staffRole will need
        // to be set manually from Staff Settings after they register.
      }

      await admin.entities.StaffAuditLog.create({
        staff_id: user.id,
        staff_name: user.full_name || user.email,
        staff_role: callerStaffRole,
        action: 'staff_invited',
        entity_type: 'User',
        record_name: email,
        new_value: staffRole,
        details: userUpdated ? 'staffRole set immediately' : 'staffRole pending — user must accept invitation first',
      });

      return Response.json({
        success: true,
        message: `Invitation sent to ${email}`,
        staffRole,
        userUpdated,
      });
    }

    if (action === 'updateRole') {
      const { userId, staffRole } = body;
      if (!userId || !staffRole) {
        return Response.json({ error: 'userId and staffRole are required' }, { status: 400 });
      }
      if (!VALID_STAFF_ROLES.includes(staffRole)) {
        return Response.json({ error: 'Invalid staff role' }, { status: 400 });
      }

      const targetUser = await admin.entities.User.get(userId);
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });
      if (targetUser.role !== 'admin') {
        return Response.json({ error: 'Target user is not a staff member' }, { status: 400 });
      }

      const previousRole = targetUser.staffRole || 'super_admin';
      await admin.entities.User.update(userId, { staffRole });

      await admin.entities.StaffAuditLog.create({
        staff_id: user.id,
        staff_name: user.full_name || user.email,
        staff_role: callerStaffRole,
        action: 'staff_role_changed',
        entity_type: 'User',
        record_id: userId,
        record_name: targetUser.email,
        previous_value: previousRole,
        new_value: staffRole,
      });

      return Response.json({ success: true, message: 'Staff role updated' });
    }

    if (action === 'deactivate') {
      const { userId } = body;
      if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

      const targetUser = await admin.entities.User.get(userId);
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

      const previousRole = targetUser.staffRole || 'super_admin';
      // Demote to customer — role becomes "user", staffRole becomes irrelevant
      await admin.entities.User.update(userId, { role: 'user' });

      await admin.entities.StaffAuditLog.create({
        staff_id: user.id,
        staff_name: user.full_name || user.email,
        staff_role: callerStaffRole,
        action: 'staff_deactivated',
        entity_type: 'User',
        record_id: userId,
        record_name: targetUser.email,
        previous_value: previousRole,
        new_value: 'user',
      });

      return Response.json({ success: true, message: 'Staff access removed' });
    }

    if (action === 'promote') {
      // Fix users who have staffRole set but Base44 role is still 'user'.
      // This happens when inviteUser was called for an existing customer but
      // the role was never promoted to 'admin'.
      const { userId } = body;
      if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

      const targetUser = await admin.entities.User.get(userId);
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

      const previousRole = targetUser.role || 'user';
      const staffRole = targetUser.staffRole || 'super_admin';
      await admin.entities.User.update(userId, { role: 'admin', staffRole });

      await admin.entities.StaffAuditLog.create({
        staff_id: user.id,
        staff_name: user.full_name || user.email,
        staff_role: callerStaffRole,
        action: 'staff_promoted',
        entity_type: 'User',
        record_id: userId,
        record_name: targetUser.email,
        previous_value: previousRole,
        new_value: 'admin',
        details: `Role promoted to admin with staffRole: ${staffRole}`,
      });

      return Response.json({ success: true, message: 'User promoted to staff admin' });
    }

    return Response.json({ error: 'Unknown action. Use invite, updateRole, promote, or deactivate.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}