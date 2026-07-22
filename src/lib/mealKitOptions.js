export const DEFAULT_PROTEINS = [
  { name: 'Chicken', price: 4500 },
  { name: 'Turkey', price: 6000 },
  { name: 'Beef', price: 5000 },
  { name: 'Goat Meat', price: 5500 },
  { name: 'Fresh Fish', price: 7000 },
];

export const DEFAULT_EXTRAS = [
  { name: 'Plantain', price: 1500 },
  { name: 'Soft Drinks', price: 800 },
  { name: 'Salad Ingredients', price: 2000 },
  { name: 'Coleslaw Kit', price: 1800 },
  { name: 'Extra Sweet Corn', price: 700 },
  { name: 'Extra Green Peas', price: 700 },
  { name: 'Extra Carrots', price: 500 },
];

export const PROTEIN_QUANTITIES = [1, 2, 3];

export function getProteinOptions(pkg) {
  return Array.isArray(pkg?.proteins) && pkg.proteins.length
    ? pkg.proteins
    : DEFAULT_PROTEINS;
}

export function getExtraOptions(pkg) {
  return Array.isArray(pkg?.extras) && pkg.extras.length
    ? pkg.extras
    : DEFAULT_EXTRAS;
}