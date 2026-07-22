export const BROAD_CATEGORIES = [
  {
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    icon: '🥬',
    example: 'Vegetables & fruits',
    slugs: ['vegetables', 'fruits'],
  },
  {
    name: 'Tubers & Grains',
    slug: 'tubers-grains',
    icon: '🍠',
    example: 'Rice, beans, yam & garri',
    slugs: ['rice-grains', 'tubers-root-crops'],
  },
  {
    name: 'Protein',
    slug: 'protein',
    icon: '🍖',
    example: 'Meat, chicken, fish & seafood',
    slugs: ['meat-fish'],
  },
  {
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    icon: '🥛',
    example: 'Milk, cheese, butter & eggs',
    slugs: ['dairy', 'eggs'],
  },
  {
    name: 'Cooking Essentials',
    slug: 'cooking-essentials',
    icon: '🧂',
    example: 'Oils, spices & condiments',
    slugs: ['cooking-oils-fats', 'herbs-spices-seasonings', 'seeds-nuts-soup', 'sauces-condiments', 'local-soup-ingredients'],
  },
  {
    name: 'Pasta & Noodles',
    slug: 'pasta-noodles',
    icon: '🍝',
    example: 'Spaghetti & macaroni',
    slugs: ['pasta-noodles'],
  },
  {
    name: 'Bread & Bakery',
    slug: 'bread-bakery',
    icon: '🍞',
    example: 'Bread, buns & rolls',
    slugs: ['bread-bakery'],
  },
  {
    name: 'Snacks',
    slug: 'snacks',
    icon: '🍿',
    example: 'Chips, biscuits & treats',
    slugs: ['snacks'],
  },
  {
    name: 'Drinks & Beverages',
    slug: 'drinks-beverages',
    icon: '🥤',
    example: 'Water, juice, soft drinks & tea',
    slugs: ['drinks', 'tea-coffee'],
  },
  {
    name: 'Frozen Foods',
    slug: 'frozen-foods',
    icon: '❄️',
    example: 'Frozen chicken, fish & fries',
    slugs: ['frozen-foods'],
  },
  {
    name: 'Baking Essentials',
    slug: 'baking-essentials',
    icon: '🎂',
    example: 'Sugar, flour & cocoa',
    slugs: ['baking-ingredients'],
  },
  {
    name: 'Grocery Packages',
    slug: 'grocery-packages',
    icon: '📦',
    example: 'Curated meal kits & bundles',
    slugs: ['packages'],
    route: '/packages',
  },
];

export function getBroadCategory(slug) {
  return BROAD_CATEGORIES.find((c) => c.slug === slug);
}