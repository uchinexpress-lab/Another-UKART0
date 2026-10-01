// Audit logging utility for the Ukart Staff Admin app.
// Records staff actions to the StaffAuditLog entity for accountability.

import { base44 } from '@/api/base44Client';

export async function logStaffAction(action, details = {}) {
  try {
    const user = await base44.auth.me();
    if (!user) return;
    await base44.entities.StaffAuditLog.create({
      staff_id: user.id,
      staff_name: user.full_name || user.email,
      staff_role: user.role,
      action,
      entity_type: details.entity_type || '',
      record_id: details.record_id || '',
      record_name: details.record_name || '',
      previous_value: details.previous_value || '',
      new_value: details.new_value || '',
      details: details.details || '',
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}