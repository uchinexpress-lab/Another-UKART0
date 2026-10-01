// Staff role definitions and permission checks for the Ukart Staff Admin app.
//
// ARCHITECTURE:
//   Base44 auth role (user.role):  "admin" (all staff) | "user" (customers) | "rider"
//   Ukart staff role (user.staffRole): "super_admin" | "support" | "operations" | "content_manager" | "finance" | "rider_manager"
//
// The Base44 role field ONLY accepts "admin", "user", or "rider".
// Custom Ukart staff positions live in the separate staffRole field.
// An admin without a staffRole is treated as super_admin (backward compat for the original admin account).

export const STAFF_ROLES = {
  super_admin: {
    label: 'Super Admin',
    pages: '*',
    color: 'bg-red-100 text-red-700',
  },
  support: {
    label: 'Support',
    pages: ['dashboard', 'orders', 'tickets', 'customers', 'birthday-rewards'],
    color: 'bg-amber-100 text-amber-700',
  },
  operations: {
    label: 'Operations',
    pages: ['dashboard', 'orders', 'riders', 'live-deliveries'],
    color: 'bg-blue-100 text-blue-700',
  },
  content_manager: {
    label: 'Content Manager',
    pages: ['dashboard', 'products', 'categories', 'meal-kits', 'packages', 'banners', 'bulk-images', 'homepage'],
    color: 'bg-green-100 text-green-700',
  },
  finance: {
    label: 'Finance',
    pages: ['dashboard', 'orders', 'reports', 'birthday-rewards'],
    color: 'bg-purple-100 text-purple-700',
  },
  rider_manager: {
    label: 'Rider Manager',
    pages: ['dashboard', 'riders', 'live-deliveries'],
    color: 'bg-teal-100 text-teal-700',
  },
};

export const STAFF_ROLE_VALUES = [
  'super_admin', 'support', 'operations', 'content_manager', 'finance', 'rider_manager',
];

export const STAFF_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'support', label: 'Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'rider_manager', label: 'Rider Manager' },
];

export const ALL_STAFF_PAGES = [
  'dashboard', 'orders', 'tickets', 'riders', 'live-deliveries',
  'products', 'categories', 'meal-kits', 'packages', 'banners', 'bulk-images', 'homepage',
  'customers', 'reports', 'notifications', 'birthday-rewards', 'settings',
];

// Check if a user is a Ukart staff member (Base44 role = admin).
export function isStaffMember(user) {
  return user?.role === 'admin';
}

// Backward-compat alias: checks if a Base44 role string is "admin".
export function isStaffRole(role) {
  return role === 'admin';
}

// Resolve the effective staffRole for a user.
// Returns null for non-staff. Returns "super_admin" for admins without a staffRole (backward compat).
export function resolveStaffRole(user) {
  if (!user || user.role !== 'admin') return null;
  return user.staffRole || 'super_admin';
}

// Check if a user can access a specific admin page.
export function canAccessPage(user, page) {
  if (!isStaffMember(user)) return false;
  const staffRole = resolveStaffRole(user);
  const r = STAFF_ROLES[staffRole];
  if (!r) return false;
  if (r.pages === '*') return true;
  return r.pages.includes(page);
}

// Get the list of admin pages a user can access.
export function getAccessiblePages(user) {
  if (!isStaffMember(user)) return [];
  const staffRole = resolveStaffRole(user);
  const r = STAFF_ROLES[staffRole];
  if (!r) return [];
  if (r.pages === '*') return ALL_STAFF_PAGES;
  return r.pages;
}

// Get a friendly label for a staff role. Accepts either a user object or a staffRole string.
export function getRoleLabel(userOrStaffRole) {
  if (typeof userOrStaffRole === 'string') {
    return STAFF_ROLES[userOrStaffRole]?.label || userOrStaffRole;
  }
  const staffRole = resolveStaffRole(userOrStaffRole);
  return STAFF_ROLES[staffRole]?.label || staffRole || '';
}

// Check if a user is a Super Admin (full access, staff management, settings).
export function isSuperAdmin(user) {
  if (!isStaffMember(user)) return false;
  return resolveStaffRole(user) === 'super_admin';
}