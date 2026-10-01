// Staff role definitions and permission checks for the Ukart Staff Admin app.

export const STAFF_ROLES = {
  admin: {
    label: 'Super Admin',
    pages: '*',
    color: 'bg-red-100 text-red-700',
  },
  staff_admin: {
    label: 'Staff Admin',
    pages: [
      'dashboard', 'orders', 'tickets', 'riders', 'live-deliveries',
      'products', 'categories', 'meal-kits', 'banners', 'bulk-images',
      'customers', 'reports', 'notifications', 'settings',
    ],
    color: 'bg-purple-100 text-purple-700',
  },
  operations: {
    label: 'Operations',
    pages: ['dashboard', 'orders', 'tickets', 'riders', 'live-deliveries', 'customers'],
    color: 'bg-blue-100 text-blue-700',
  },
  content: {
    label: 'Content',
    pages: ['dashboard', 'products', 'categories', 'meal-kits', 'banners', 'bulk-images'],
    color: 'bg-green-100 text-green-700',
  },
  support: {
    label: 'Support',
    pages: ['dashboard', 'tickets', 'customers', 'orders'],
    color: 'bg-amber-100 text-amber-700',
  },
};

export const STAFF_ROLE_VALUES = ['admin', 'staff_admin', 'operations', 'content', 'support'];

export const ALL_STAFF_PAGES = [
  'dashboard', 'orders', 'tickets', 'riders', 'live-deliveries',
  'products', 'categories', 'meal-kits', 'banners', 'bulk-images',
  'customers', 'reports', 'notifications', 'settings',
];

export function isStaffRole(role) {
  return STAFF_ROLE_VALUES.includes(role);
}

export function canAccessPage(role, page) {
  const r = STAFF_ROLES[role];
  if (!r) return false;
  if (r.pages === '*') return true;
  return r.pages.includes(page);
}

export function getAccessiblePages(role) {
  const r = STAFF_ROLES[role];
  if (!r) return [];
  if (r.pages === '*') return ALL_STAFF_PAGES;
  return r.pages;
}

export function getRoleLabel(role) {
  return STAFF_ROLES[role]?.label || role;
}