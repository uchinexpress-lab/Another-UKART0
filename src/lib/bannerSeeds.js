import { base44 } from '@/api/base44Client';

/**
 * Seed data for existing hardcoded banners that were displayed on the
 * homepage before the Banner Manager was connected. These are migrated
 * into the Banner database on first load of the Admin Banner Manager page
 * so they become managed records (editable, reorderable, toggleable).
 *
 * Matched by `name` — migration is idempotent and will not create duplicates.
 */
export const BANNER_SEEDS = [
  {
    name: 'No Market Wahala',
    location: 'home',
    image:
      'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/bb0ab3609_04724820-6E3F-45F0-B429-BA6C62A01A7A.PNG',
    link: '/categories',
    order: 0,
    active: true,
    fit_mode: 'cover',
    zoom: 1,
    pos_x: 50,
    pos_y: 50,
    auto_slide: true,
    slide_duration: 5,
    show_overlay: true,
    heading: 'NO MARKET WAHALA.',
    subheading:
      'Fresh groceries delivered across Lagos with fast, reliable delivery.',
    badge_text: 'Delivering Across Lagos',
    cta_text: 'Shop Now',
  },
  {
    name: 'Cook Something Delicious',
    location: 'meal_kits',
    image:
      'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/3f02716ea_80948D94-EADE-4581-AA25-CA71CF4BA066.png',
    link: '/packages#meal-kits',
    order: 0,
    active: true,
    fit_mode: 'contain',
    zoom: 1,
    pos_x: 50,
    pos_y: 50,
    auto_slide: true,
    slide_duration: 5,
    show_overlay: false,
  },
];

/**
 * Migrates seed banners into the Banner database.
 * Only creates banners whose `name` doesn't already exist — idempotent.
 * @returns {Promise<number>} count of newly created banners
 */
export async function migrateSeedBanners() {
  const existing = await base44.entities.Banner.list();
  const existingNames = new Set(existing.map((b) => b.name));
  const toCreate = BANNER_SEEDS.filter((seed) => !existingNames.has(seed.name));
  if (toCreate.length === 0) return 0;
  await base44.entities.Banner.bulkCreate(toCreate);
  return toCreate.length;
}