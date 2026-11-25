// Sizzle & Serve — game data: every recipe, ingredient, station and upgrade.
// Nothing here is copied from another game: names, prices and timings are
// invented for this night-market dumpling stall.

// The 14 ingredients on the counter, in counter order. Each one knows its
// colour, its emoji-free drawn shape and which station cooks it.
export const INGREDIENTS = [
  { id: 'dough',   name: 'Dough',    color: '#f2e3c6', shape: 'round',  price: 1 },
  { id: 'pork',    name: 'Pork',     color: '#e58a8a', shape: 'chunk',  price: 3 },
  { id: 'prawn',   name: 'Prawn',    color: '#ff9d76', shape: 'curl',   price: 4 },
  { id: 'chive',   name: 'Chive',    color: '#7ec850', shape: 'stick',  price: 2 },
  { id: 'cabbage', name: 'Cabbage',  color: '#b8e986', shape: 'leaf',   price: 2 },
  { id: 'mushroom',name: 'Mushroom', color: '#d8c3a5', shape: 'cap',    price: 3 },
  { id: 'noodle',  name: 'Noodle',   color: '#f7d774', shape: 'coil',   price: 2 },
  { id: 'egg',     name: 'Egg',      color: '#fff3b0', shape: 'round',  price: 2 },
  { id: 'chilli',  name: 'Chilli',   color: '#e23b3b', shape: 'stick',  price: 2 },
  { id: 'ginger',  name: 'Ginger',   color: '#e8c87a', shape: 'chunk',  price: 2 },
  { id: 'spring',  name: 'Spring Onion', color: '#8fd14f', shape: 'stick', price: 2 },
  { id: 'tofu',    name: 'Tofu',     color: '#fbf7ee', shape: 'chunk',  price: 2 },
  { id: 'broth',   name: 'Broth',    color: '#d98e32', shape: 'bowl',   price: 3 },
  { id: 'sesame',  name: 'Sesame',   color: '#c9a86a', shape: 'dots',   price: 1 },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// The 5 stations. A station takes one raw ingredient, cooks it for
// cookSeconds, and holds the cooked result until the cook plates it.
export const STATIONS = [
  { id: 'chop',   name: 'Chop Board', kind: 'chop',   color: '#c98f5a', key: '1', cookSeconds: 2.5 },
  { id: 'pot',    name: 'Boiling Pot', kind: 'boil',  color: '#7fa8c9', key: '2', cookSeconds: 6 },
  { id: 'fryer',  name: 'Fryer',      kind: 'fry',   color: '#e0a33c', key: '3', cookSeconds: 5 },
  { id: 'steamer',name: 'Steamer',    kind: 'steam', color: '#b9c4c9', key: '4', cookSeconds: 7 },
  { id: 'plate',  name: 'Plating',    kind: 'plate', color: '#e8e0d0', key: '5', cookSeconds: 0 },
];

// Which station each ingredient must visit before it can be plated.
// 'none' means it goes straight from the counter onto the plate.
export const COOKS_AT = {
  dough: 'none', pork: 'chop', prawn: 'chop', chive: 'chop', cabbage: 'chop',
  mushroom: 'chop', noodle: 'pot', egg: 'fryer', chilli: 'none', ginger: 'chop',
  spring: 'chop', tofu: 'fryer', broth: 'pot', sesame: 'none',
};

// The 8 recipes. steps list ingredient ids in the order the customer
// expects them; serveSeconds is how long the order waits before the
// customer walks out angry.
export const RECIPES = [
  { id: 'pork-dumpling', name: 'Pork Dumpling',    steps: ['dough', 'pork', 'chive'],   price: 12, serveSeconds: 75 },
  { id: 'prawn-dumpling', name: 'Prawn Dumpling',  steps: ['dough', 'prawn', 'ginger'], price: 15, serveSeconds: 75 },
  { id: 'veggie-dumpling', name: 'Garden Dumpling', steps: ['dough', 'cabbage', 'mushroom'], price: 11, serveSeconds: 80 },
  { id: 'dan-noodle',   name: 'Dan Dan Noodle',   steps: ['noodle', 'pork', 'chilli', 'sesame'], price: 16, serveSeconds: 85 },
  { id: 'egg-noodle',   name: 'Golden Egg Noodle', steps: ['noodle', 'egg', 'spring'], price: 13, serveSeconds: 80 },
  { id: 'tofu-broth',   name: 'Tofu Broth Bowl',  steps: ['broth', 'tofu', 'spring'],  price: 14, serveSeconds: 85 },
  { id: 'prawn-noodle', name: 'Prawn Noodle Soup', steps: ['noodle', 'broth', 'prawn', 'chive'], price: 18, serveSeconds: 90 },
  { id: 'feast-platter', name: 'Night Feast Platter', steps: ['dough', 'pork', 'prawn', 'egg', 'sesame'], price: 24, serveSeconds: 100 },
];

export const RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

// The 3 rush-hour waves of a night. Each wave sets how fast orders arrive
// and how many the stall must clear to open the upgrade shop.
export const WAVES = [
  { id: 1, name: 'Lantern Hour',  orderEverySeconds: 16, orderCount: 5,  patienceBonus: 0 },
  { id: 2, name: 'Dinner Rush',   orderEverySeconds: 11, orderCount: 7,  patienceBonus: 0 },
  { id: 3, name: 'Midnight Rush', orderEverySeconds: 8,  orderCount: 9,  patienceBonus: -5 },
];

// The 6 upgrades sold between waves. cost in coins, effect applied on buy.
export const UPGRADES = [
  { id: 'sharp-knife', name: 'Sharp Knife',   desc: 'Chopping takes half the time.',      cost: 20, apply: 'chopSpeed' },
  { id: 'big-pot',     name: 'Big Pot',       desc: 'The pot cooks 40% faster.',          cost: 25, apply: 'potSpeed' },
  { id: 'extra-plate', name: 'Second Plate',  desc: 'Plate two dishes at once.',          cost: 30, apply: 'extraPlate' },
  { id: 'calm-service',name: 'Calm Service',  desc: 'Customers wait 15 seconds longer.',  cost: 22, apply: 'patience' },
  { id: 'hot-oil',     name: 'Hot Oil',       desc: 'The fryer cooks 40% faster.',        cost: 25, apply: 'fryerSpeed' },
  { id: 'lucky-lantern', name: 'Lucky Lantern', desc: 'Every served dish pays +3 coins.', cost: 35, apply: 'tipBonus' },
];

export const GAME = {
  width: 1280,
  height: 720,
  startCoins: 0,
  startLives: 3,
  maxOrders: 4,
  comboWindowSeconds: 12,
  trashRefund: 0,
};
