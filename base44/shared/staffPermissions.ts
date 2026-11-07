// Server-side staff capability map.
//
// Every staff member carries the Base44 role "admin", so entity RLS on
// role === "admin" cannot tell a Content Manager from a Support agent. The
// fine-grained Ukart staffRole is therefore enforced here, in backend code,
// before a privileged write runs with the service role.
//
// Keep this in sync with the page map in src/lib/staffRoles.js — the page map
// only decides which screens are shown; this map decides what may actually be
// written.

export const STAFF_WRITE_ROLES: Record<string, string[]> = {
  // Catalog content
  Product: ["super_admin", "content_manager"],
  Package: ["super_admin", "content_manager"],
  Category: ["super_admin", "content_manager"],
  Banner: ["super_admin", "content_manager"],
  HomepageSection: ["super_admin", "content_manager"],

  // Store configuration
  NotificationSetting: ["super_admin"],
  DeliverySetting: ["super_admin"],
  PromotionSetting: ["super_admin"],

  // Money-adjacent records
  Voucher: ["super_admin", "finance"],
  BirthdayReward: ["super_admin", "finance"],

  // Rider records
  Rider: ["super_admin", "operations", "rider_manager"],
};

export const STAFF_WRITE_ENTITIES = Object.keys(STAFF_WRITE_ROLES);

// Admins without an explicit staffRole are the original super admin.
export function resolveStaffRole(user: any): string | null {
  if (!user || user.role !== "admin") return null;
  return user.staffRole || "super_admin";
}

export function canWriteEntity(staffRole: string | null, entity: string): boolean {
  if (!staffRole) return false;
  const allowed = STAFF_WRITE_ROLES[entity];
  return Array.isArray(allowed) && allowed.includes(staffRole);
}