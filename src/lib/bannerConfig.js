// Banner location configuration: labels, aspect ratios, and display heights.
// Add new locations here to extend the banner system.

export const BANNER_LOCATIONS = {
  home: {
    label: 'Home',
    aspectRatio: 16 / 7,
    heightClass: 'h-44',
    description: 'Main homepage hero banner',
  },
  meal_kits: {
    label: 'Meal Kits',
    aspectRatio: 5 / 3,
    heightClass: 'h-56',
    description: 'Meal kits section banner',
  },
  promotions: {
    label: 'Promotions',
    aspectRatio: 16 / 7,
    heightClass: 'h-44',
    description: 'Promotional offers banner',
  },
  categories: {
    label: 'Categories',
    aspectRatio: 16 / 7,
    heightClass: 'h-44',
    description: 'Category browsing banner',
  },
};

export const SLIDE_DURATIONS = [3, 5, 7, 10];

export const DEFAULT_BANNER_SETTINGS = {
  zoom: 1,
  pos_x: 50,
  pos_y: 50,
  fit_mode: 'cover',
  auto_slide: true,
  slide_duration: 5,
  active: true,
  order: 0,
};