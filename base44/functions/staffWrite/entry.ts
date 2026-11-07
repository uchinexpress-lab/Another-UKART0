import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  canWriteEntity,
  resolveStaffRole,
  STAFF_WRITE_ROLES,
} from '../../shared/staffPermissions.ts';

// Privileged staff writes for the Staff Admin app.
//
// Every staff member has Base44 role "admin", so the entity RLS rules alone
// would let any of them write anything. This function is the server-side gate:
// it resolves the caller's Ukart staffRole and only performs the write (with
// the service role) when that role is allowed to modify the entity.

const PROTECTED_FIELDS = [
  'id',
  'created_by_id',
  'created_by',
  'created_date',
  'updated_date',
];

function cleanPayload(data: any) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (!PROTECTED_FIELDS.includes(key)) out[key] = value;
  }
  return out;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const staffRole = resolveStaffRole(user);
    const body = await req.json();
    const { entity, action, id, data } = body || {};

    if (!entity || !STAFF_WRITE_ROLES[entity]) {
      return Response.json({ error: 'Unknown entity' }, { status: 400 });
    }
    if (!['create', 'update', 'delete'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (!canWriteEntity(staffRole, entity)) {
      return Response.json(
        { error: `Your staff role (${staffRole}) cannot modify ${entity}` },
        { status: 403 }
      );
    }
    if (action !== 'create' && !id) {
      return Response.json({ error: 'Record id is required' }, { status: 400 });
    }

    const admin = base44.asServiceRole;
    const targets: Record<string, any> = {
      Product: admin.entities.Product,
      Package: admin.entities.Package,
      Category: admin.entities.Category,
      Banner: admin.entities.Banner,
      HomepageSection: admin.entities.HomepageSection,
      NotificationSetting: admin.entities.NotificationSetting,
      DeliverySetting: admin.entities.DeliverySetting,
      PromotionSetting: admin.entities.PromotionSetting,
      Voucher: admin.entities.Voucher,
      BirthdayReward: admin.entities.BirthdayReward,
      Rider: admin.entities.Rider,
    };
    const target = targets[entity];

    let record: any = null;
    if (action === 'create') {
      record = await target.create(cleanPayload(data));
    } else if (action === 'update') {
      record = await target.update(id, cleanPayload(data));
    } else {
      await target.delete(id);
      record = { id };
    }

    try {
      await admin.entities.StaffAuditLog.create({
        staff_id: user.id,
        staff_name: user.full_name || user.email,
        staff_role: staffRole,
        action: `staff_${entity}_${action}`,
        entity_type: entity,
        record_id: record?.id || id || '',
        record_name: record?.name || '',
      });
    } catch (e) {
      console.error('Staff audit log failed:', e);
    }

    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}