// Sizzle & Serve — screenshot presets: ?shot=start|play|rush|serve&seed=1
// puts the game into a fixed, deterministic scene so the screenshots in
// screenshots/ are real renders of this code. Played games never use these
// paths; they only run when the URL carries a shot parameter.

import { RECIPES } from './config.js';
import { currentWave, newOrder } from './state.js';

export function applyShot(state, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = Number(params.get('seed') ?? 1);
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 233280 + 9301) % 233280;
    return s / 233280;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  state.screen = 'playing';
  state.time = 42;
  state.coins = shot === 'rush' ? 58 : 34;
  state.score = shot === 'rush' ? 1240 : 480;
  state.lives = 3;

  // A full order board: four tickets, one of them mid-assembly.
  state.orders = [];
  const chosen = [RECIPES[0], RECIPES[3], RECIPES[1], RECIPES[6]];
  chosen.forEach((recipe, i) => {
    const order = {
      id: 100 + i,
      recipeId: recipe.id,
      stepsLeft: [...recipe.steps],
      patience: recipe.serveSeconds,
      deadline: state.time + recipe.serveSeconds * (0.35 + rand() * 0.55),
      bornAt: 0,
    };
    state.orders.push(order);
  });

  if (shot === 'start') {
    state.screen = 'title';
    state.orders = [];
    return true;
  }

  if (shot === 'play' || shot === 'serve') {
    // One dish mid-assembly: pork chopped and ready, noodle boiling, and
    // the first two steps of the pork dumpling already on the plate.
    state.stations.chop = { ingredientId: 'pork', readyAt: state.time - 1 };
    state.stations.pot = { ingredientId: 'noodle', readyAt: state.time + 3.2 };
    state.stations.fryer = { ingredientId: 'egg', readyAt: state.time + 1.5 };
    state.plate = ['dough', 'pork'];
    state.held = 'chive';
    state.combo = 2;
    state.comboUntil = state.time + 8;
    state.log.push('Mid-service: dumplings on the plate, noodles on the boil.');
  }

  if (shot === 'rush') {
    // Midnight rush: every station busy, steamer going, plate full.
    state.waveIndex = 2;
    state.stations.chop = { ingredientId: 'prawn', readyAt: state.time - 0.5 };
    state.stations.pot = { ingredientId: 'broth', readyAt: state.time + 2.0 };
    state.stations.fryer = { ingredientId: 'tofu', readyAt: state.time + 4.0 };
    state.stations.steamer = { ingredientId: 'mushroom', readyAt: state.time + 1.0 };
    state.plate = ['noodle', 'broth', 'prawn'];
    state.held = 'chive';
    state.combo = 4;
    state.comboUntil = state.time + 9;
    state.orders[0].deadline = state.time + 9;
    state.log.push('Midnight Rush! Every station is cooking at once.');
  }

  if (shot === 'serve') {
    // The plate holds a finished pork dumpling, ready to serve.
    state.plate = ['dough', 'pork', 'chive'];
    state.stations.chop = null;
    state.stations.pot = null;
    state.stations.fryer = null;
    state.held = null;
    state.log.push('Pork Dumpling plated and ready to serve!');
  }

  void pick;
  void newOrder;
  void currentWave;
  return true;
}
