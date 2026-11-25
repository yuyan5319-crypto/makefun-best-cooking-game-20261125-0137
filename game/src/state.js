// Sizzle & Serve — game state: orders, stations, the plate, coins, waves.
// Pure logic, no drawing: render.js reads this state, input.js mutates it
// through the small functions below, main.js ticks it.

import { COOKS_AT, GAME, INGREDIENT_BY_ID, RECIPES, STATIONS, UPGRADES, WAVES } from './config.js';

let orderSeq = 0;

export function newOrder(wave, now) {
  const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const patience = recipe.serveSeconds + wave.patienceBonus;
  return {
    id: ++orderSeq,
    recipeId: recipe.id,
    stepsLeft: [...recipe.steps],
    deadline: now + patience,
    patience,
    bornAt: now,
  };
}

export function createState() {
  return {
    screen: 'title', // title | playing | shop | over | win
    time: 0,
    coins: GAME.startCoins,
    lives: GAME.startLives,
    score: 0,
    combo: 0,
    comboUntil: 0,
    waveIndex: 0,
    servedThisWave: 0,
    orderTimer: 6,
    orders: [],
    // one slot per station: { ingredientId, readyAt } or null
    stations: Object.fromEntries(STATIONS.map((s) => [s.id, null])),
    held: null, // ingredient id carried by the cook's hand, or null
    plate: [], // cooked ingredient ids waiting on the plate
    plateCapacity: 1,
    bought: new Set(),
    log: [],
    stats: { served: 0, lost: 0, perfect: 0, earned: 0 },
    flash: null, // { text, color, until }
    selectedStation: null,
  };
}

export function currentWave(state) {
  return WAVES[Math.min(state.waveIndex, WAVES.length - 1)];
}

export function stationSpeed(state, stationId) {
  const base = STATIONS.find((s) => s.id === stationId).cookSeconds;
  let factor = 1;
  if (stationId === 'chop' && state.bought.has('sharp-knife')) factor *= 0.5;
  if (stationId === 'pot' && state.bought.has('big-pot')) factor *= 0.6;
  if (stationId === 'fryer' && state.bought.has('hot-oil')) factor *= 0.6;
  return base * factor;
}

export function patienceOf(state, recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  let seconds = recipe.serveSeconds + currentWave(state).patienceBonus;
  if (state.bought.has('calm-service')) seconds += 15;
  return seconds;
}

export function startGame(state) {
  const fresh = createState();
  Object.assign(state, fresh, { screen: 'playing' });
  state.orders.push(newOrder(currentWave(state), 0));
  state.orders.push(newOrder(currentWave(state), 0));
  state.log.push('Stall open! Serve the orders before customers leave.');
}

export function tick(state, dt) {
  if (state.screen !== 'playing') return;
  state.time += dt;
  const wave = currentWave(state);

  // New orders arrive on the wave's rhythm while the board has room.
  state.orderTimer -= dt;
  if (state.orderTimer <= 0 && state.orders.length < GAME.maxOrders) {
    state.orders.push(newOrder(wave, state.time));
    state.orderTimer = wave.orderEverySeconds;
  }
  if (state.orderTimer <= 0) state.orderTimer = wave.orderEverySeconds;

  // Orders whose patience ran out walk away: lose a life.
  for (const order of [...state.orders]) {
    if (state.time >= order.deadline) {
      state.orders.splice(state.orders.indexOf(order), 1);
      state.lives -= 1;
      state.combo = 0;
      state.stats.lost += 1;
      state.log.push(`${recipeName(order)} walked out! -1 heart.`);
      flash(state, 'ORDER LOST!', '#e23b3b');
      if (state.lives <= 0) {
        state.screen = 'over';
        state.log.push('The stall closed early. The night is over.');
      }
    }
  }

  // Combo expires when the window closes.
  if (state.combo > 0 && state.time > state.comboUntil) state.combo = 0;
}

function recipeName(order) {
  return RECIPES.find((r) => r.id === order.recipeId).name;
}

function flash(state, text, color) {
  state.flash = { text, color, until: state.time + 1.2 };
}

// --- player actions (called from input.js) ---

export function pickIngredient(state, ingredientId) {
  if (state.screen !== 'playing') return;
  if (state.held) {
    state.log.push('Hands full — put this down first.');
    return;
  }
  state.held = ingredientId;
  state.log.push(`Picked up ${INGREDIENT_BY_ID[ingredientId].name}.`);
}

export function useStation(state, stationId) {
  if (state.screen !== 'playing') return;
  const station = STATIONS.find((s) => s.id === stationId);
  const slot = state.stations[stationId];

  if (stationId === 'plate') {
    plateHeld(state);
    return;
  }

  // Pick up a finished ingredient from the station.
  if (slot && state.time >= slot.readyAt) {
    if (state.held) {
      state.log.push('Hands full — serve or bin this first.');
      return;
    }
    state.held = slot.ingredientId;
    state.stations[stationId] = null;
    state.log.push(`Took cooked ${INGREDIENT_BY_ID[slot.ingredientId].name} off the ${station.name}.`);
    return;
  }
  if (slot) {
    state.log.push(`${station.name} is still cooking…`);
    return;
  }

  // Start cooking the held ingredient here.
  if (!state.held) {
    state.log.push(`Nothing in hand — grab an ingredient for the ${station.name}.`);
    return;
  }
  const need = COOKS_AT[state.held];
  if (need !== stationId && need !== 'none') {
    const right = STATIONS.find((s) => s.id === need);
    state.log.push(`${INGREDIENT_BY_ID[state.held].name} goes to the ${right.name}, not here.`);
    return;
  }
  if (need === 'none') {
    state.log.push(`${INGREDIENT_BY_ID[state.held].name} needs no cooking — plate it directly.`);
    return;
  }
  state.stations[stationId] = { ingredientId: state.held, readyAt: state.time + stationSpeed(state, stationId) };
  state.log.push(`${INGREDIENT_BY_ID[state.held].name} is on the ${station.name}.`);
  state.held = null;
}

function plateHeld(state) {
  if (!state.held) {
    state.log.push('Nothing in hand to plate.');
    return;
  }
  if (state.plate.length >= state.plateCapacity) {
    state.log.push('The plate is full — serve it first.');
    return;
  }
  state.plate.push(state.held);
  state.log.push(`Plated ${INGREDIENT_BY_ID[state.held].name}.`);
  state.held = null;
  tryServe(state);
}

export function binHeld(state) {
  if (state.screen !== 'playing' || !state.held) return;
  state.log.push(`Binned the ${INGREDIENT_BY_ID[state.held].name}.`);
  state.held = null;
}

export function clearPlate(state) {
  if (state.screen !== 'playing' || state.plate.length === 0) return;
  state.plate = [];
  state.log.push('Cleared the plate.');
}

// Serving: the plate must hold exactly the next order's remaining steps,
// in order. Serving the top order that matches earns coins and combo.
export function tryServe(state) {
  for (const order of state.orders) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    if (state.plate.length === recipe.steps.length
      && state.plate.every((ing, i) => ing === recipe.steps[i])) {
      serveOrder(state, order, recipe);
      return true;
    }
  }
  return false;
}

function serveOrder(state, order, recipe) {
  state.orders.splice(state.orders.indexOf(order), 1);
  const timeLeft = order.deadline - state.time;
  const perfect = timeLeft > order.patience * 0.5;
  const tip = state.bought.has('lucky-lantern') ? 3 : 0;
  const comboBonus = state.combo * 2;
  const earned = recipe.price + tip + comboBonus;
  state.coins += earned;
  state.score += earned * 10;
  state.stats.served += 1;
  state.stats.earned += earned;
  if (perfect) state.stats.perfect += 1;
  state.combo += 1;
  state.comboUntil = state.time + GAME.comboWindowSeconds;
  state.plate = [];
  state.servedThisWave += 1;
  state.log.push(`Served ${recipe.name} +${earned} coins${perfect ? ' — perfect!' : ''}${comboBonus ? ` (combo x${state.combo})` : ''}.`);
  flash(state, perfect ? 'PERFECT!' : `+${earned} COINS`, perfect ? '#ffd23f' : '#7ec850');
  checkWaveEnd(state);
}

function checkWaveEnd(state) {
  const wave = currentWave(state);
  if (state.servedThisWave >= wave.orderCount) {
    if (state.waveIndex >= WAVES.length - 1) {
      state.screen = 'win';
      state.log.push('Midnight Rush cleared — best stall on the street!');
    } else {
      state.screen = 'shop';
      state.log.push(`${wave.name} cleared! Spend your coins, then start the next wave.`);
    }
  }
}

export function buyUpgrade(state, upgradeId) {
  if (state.screen !== 'shop') return false;
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade || state.bought.has(upgradeId)) return false;
  if (state.coins < upgrade.cost) {
    state.log.push(`Not enough coins for ${upgrade.name}.`);
    return false;
  }
  state.coins -= upgrade.cost;
  state.bought.add(upgradeId);
  if (upgradeId === 'extra-plate') state.plateCapacity = 2;
  state.log.push(`Bought ${upgrade.name} — ${upgrade.desc}`);
  return true;
}

export function nextWave(state) {
  if (state.screen !== 'shop') return;
  state.waveIndex += 1;
  state.servedThisWave = 0;
  state.orderTimer = 5;
  state.screen = 'playing';
  state.log.push(`${currentWave(state).name} begins — orders are coming faster!`);
}
