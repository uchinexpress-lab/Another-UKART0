export const BROAD_CATEGORIES = [
  {
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    icon: '🥬',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/82034169c_F273CC61-F421-4CC8-9B3D-DAC42D0E826E.png',
    example: 'Vegetables & fruits',
    slugs: ['vegetables', 'fruits'],
  },
  {
    name: 'Tubers & Grains',
    slug: 'tubers-grains',
    icon: '🍠',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/dec508480_7D9D3B8B-904D-4FBC-8DB8-6632E1E49D37.png',
    example: 'Rice, beans, yam & garri',
    slugs: ['rice-grains', 'tubers-root-crops'],
  },
  {
    name: 'Protein',
    slug: 'protein',
    icon: '🍖',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/28463f326_3E902D28-4B97-4B8D-A658-D154D6243696.png',
    example: 'Meat, chicken, fish, seafood & eggs',
    slugs: ['meat-fish', 'eggs'],
  },
  {
    name: 'Cooking Essentials',
    slug: 'cooking-essentials',
    icon: '🧂',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/45d00a1fe_7494640B-5046-478E-843D-5F98BE2B9C06.png',
    example: 'Oils, spices, condiments & bread',
    slugs: ['cooking-oils-fats', 'herbs-spices-seasonings', 'seeds-nuts-soup', 'sauces-condiments', 'local-soup-ingredients', 'bread-bakery'],
  },
  {
    name: 'Baking Essentials',
    slug: 'baking-essentials',
    icon: '🎂',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/1fec70355_AC2D39B5-2999-484B-AC1F-2EE2706EE68F.png',
    example: 'Sugar, flour & cocoa',
    slugs: ['baking-ingredients'],
  },
  {
    name: 'Pasta & Noodles',
    slug: 'pasta-noodles',
    icon: '🍝',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/2f6362b73_D09BEF94-B67A-4E40-9587-FF454787D380.png',
    example: 'Spaghetti & macaroni',
    slugs: ['pasta-noodles'],
  },
];

export function getBroadCategory(slug) {
  return BROAD_CATEGORIES.find((c) => c.slug === slug);
}