export const BROAD_CATEGORIES = [
  {
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    icon: '🥬',
    image: 'https://images.pexels.com/photos/37321079/pexels-photo-37321079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Vegetables & fruits',
    slugs: ['vegetables', 'fruits'],
  },
  {
    name: 'Tubers & Grains',
    slug: 'tubers-grains',
    icon: '🍠',
    image: 'https://images.pexels.com/photos/8287244/pexels-photo-8287244.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Rice, beans, yam & garri',
    slugs: ['rice-grains', 'tubers-root-crops'],
  },
  {
    name: 'Protein',
    slug: 'protein',
    icon: '🍖',
    image: 'https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Meat, chicken, fish, seafood & eggs',
    slugs: ['meat-fish', 'eggs'],
  },
  {
    name: 'Cooking Essentials',
    slug: 'cooking-essentials',
    icon: '🧂',
    image: 'https://images.pexels.com/photos/5903388/pexels-photo-5903388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Oils, spices, condiments & bread',
    slugs: ['cooking-oils-fats', 'herbs-spices-seasonings', 'seeds-nuts-soup', 'sauces-condiments', 'local-soup-ingredients', 'bread-bakery'],
  },
  {
    name: 'Baking Essentials',
    slug: 'baking-essentials',
    icon: '🎂',
    image: 'https://images.pexels.com/photos/5441079/pexels-photo-5441079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Sugar, flour & cocoa',
    slugs: ['baking-ingredients'],
  },
  {
    name: 'Pasta & Noodles',
    slug: 'pasta-noodles',
    icon: '🍝',
    image: 'https://images.pexels.com/photos/6287446/pexels-photo-6287446.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    example: 'Spaghetti & macaroni',
    slugs: ['pasta-noodles'],
  },
];

export function getBroadCategory(slug) {
  return BROAD_CATEGORIES.find((c) => c.slug === slug);
}