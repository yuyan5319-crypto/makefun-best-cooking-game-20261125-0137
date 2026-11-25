// Sizzle & Serve — rendering: every pixel is drawn with canvas primitives
// (warm lantern-lit night-market palette, no image assets). Layout, top to
// bottom: the order board with waiting customers, the five stations, the
// plate and the cook's hand, the ingredient counter. Title, shop, game-over
// and win screens are overlays drawn over the same kitchen.

import { COOKS_AT, GAME, INGREDIENTS, INGREDIENT_BY_ID, RECIPES, STATIONS, UPGRADES, WAVES } from './config.js';
import { currentWave } from './state.js';

const PALETTE = {
  night: '#1d1420',
  awning: '#c0392b',
  awningStripe: '#f5d76e',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  counter: '#a9713f',
  board: '#2b1a2e',
  paper: '#fff6dd',
  ink: '#2b1a2e',
  gold: '#ffd23f',
  green: '#7ec850',
  red: '#e23b3b',
  steam: 'rgba(255,255,255,0.55)',
};

export function draw(ctx, state, mouse) {
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  drawBackground(ctx);
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawStations(ctx, state, mouse);
  drawPlateArea(ctx, state, mouse);
  drawCounter(ctx, state, mouse);
  drawLog(ctx, state);
  if (state.flash && state.time < state.flash.until) drawFlash(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'shop') drawShop(ctx, state, mouse);
  if (state.screen === 'over') drawEnd(ctx, state, 'THE STALL CLOSED EARLY', 'The night ended before the last rush.');
  if (state.screen === 'win') drawEnd(ctx, state, 'BEST STALL ON THE STREET!', 'You cleared all three rush waves.');
  if (state.held) drawHeld(ctx, state, mouse);
}

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME.height);
  g.addColorStop(0, '#2a1a2e');
  g.addColorStop(0.55, '#1d1420');
  g.addColorStop(1, '#120d14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  // Paper lanterns strung across the top.
  ctx.fillStyle = '#3a2430';
  ctx.fillRect(0, 0, GAME.width, 6);
  for (let x = 60; x < GAME.width; x += 160) {
    ctx.strokeStyle = '#3a2430';
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, 26);
    ctx.stroke();
    ctx.fillStyle = x % 320 === 60 ? '#ff5a4e' : '#ffd23f';
    ctx.beginPath();
    ctx.ellipse(x, 40, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 2, 24, 4, 6);
  }
}

// --- hit zones shared with input.js (same numbers, same order) ---
export function layout() {
  const stations = STATIONS.map((s, i) => ({
    id: s.id, x: 60 + i * 236, y: 300, w: 216, h: 150,
  }));
  const ingredients = INGREDIENTS.map((ing, i) => ({
    id: ing.id, x: 40 + (i % 7) * 176, y: 520 + Math.floor(i / 7) * 78, w: 164, h: 66,
  }));
  return {
    stations,
    ingredients,
    plate: { x: 60, y: 452, w: 216, h: 46 },
    bin: { x: 1180, y: 452, w: 60, h: 46 },
    orders: stateOrdersRect(),
    shopButtons: UPGRADES.map((u, i) => ({
      id: u.id, x: 340 + (i % 3) * 310, y: 250 + Math.floor(i / 3) * 120, w: 290, h: 100,
    })),
    nextWave: { x: 540, y: 540, w: 200, h: 56 },
    start: { x: 440, y: 520, w: 400, h: 64 },
  };
}

function stateOrdersRect() {
  return { x: 40, y: 108, w: 1200, h: 150 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold' : ''} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#8e2f26';
  ctx.fillRect(0, 62, GAME.width, 40);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 100, GAME.width, 2);
  text(ctx, 'SIZZLE & SERVE', 24, 82, 24, '#fff6dd');
  text(ctx, `${currentWave(state).name}  •  Wave ${state.waveIndex + 1}/3`, 330, 82, 17, '#ffe9a8');
  text(ctx, `${state.coins} coins`, 640, 82, 18, PALETTE.gold);
  text(ctx, `♥`.repeat(Math.max(0, state.lives)) + `♡`.repeat(Math.max(0, 3 - state.lives)), 800, 82, 18, '#ff8a80');
  text(ctx, `Score ${state.score}`, 960, 82, 18, '#fff6dd');
  if (state.combo > 1) text(ctx, `COMBO x${state.combo}`, 1240, 82, 18, PALETTE.gold, 'right');
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 40, 108, 1200, 150, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', 60, 128, 15, '#c9a86a');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the night is young.', 60, 190, 18, '#fff6dd', 'left', false);
    return;
  }
  state.orders.forEach((order, i) => {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    const x = 60 + i * 300;
    const y = 140;
    const left = Math.max(0, order.deadline - state.time);
    const frac = left / order.patience;
    ctx.fillStyle = frac < 0.3 ? '#e23b3b' : '#fff6dd';
    roundRect(ctx, x, y, 280, 104, 10);
    ctx.fill();
    // Waiting customer, drawn above the ticket.
    drawCustomer(ctx, x + 24, y + 8, i);
    text(ctx, recipe.name, x + 56, y + 20, 17, frac < 0.3 ? '#fff6dd' : PALETTE.ink);
    text(ctx, `$${recipe.price}`, x + 268, y + 20, 16, frac < 0.3 ? '#ffd23f' : '#8a5a33', 'right');
    // Steps: filled dots are already on the plate for this order.
    recipe.steps.forEach((step, j) => {
      const ing = INGREDIENT_BY_ID[step];
      const cx = x + 70 + j * 44;
      const cy = y + 52;
      drawIngredientShape(ctx, ing, cx, cy, 15);
      ctx.fillStyle = frac < 0.3 ? '#fff6dd' : PALETTE.ink;
      ctx.font = '11px Trebuchet MS, Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ing.name.split(' ')[0], cx, cy + 26);
    });
    // Patience bar.
    ctx.fillStyle = '#d8c3a5';
    ctx.fillRect(x + 12, y + 88, 256, 8);
    ctx.fillStyle = frac < 0.3 ? '#e23b3b' : '#7ec850';
    ctx.fillRect(x + 12, y + 88, 256 * frac, 8);
    text(ctx, `${Math.ceil(left)}s`, x + 268, y + 92, 12, frac < 0.3 ? '#e23b3b' : '#5a7a4a', 'right');
  });
}

function drawCustomer(ctx, x, y, i) {
  const colors = ['#ff9d76', '#7ec850', '#7fa8c9', '#e0a33c'];
  ctx.fillStyle = colors[i % colors.length];
  ctx.beginPath();
  ctx.arc(x + 12, y + 12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x, y + 24, 24, 14);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x + 7, y + 9, 3, 3);
  ctx.fillRect(x + 15, y + 9, 3, 3);
}

function drawStations(ctx, state, mouse) {
  const lay = layout();
  text(ctx, 'KITCHEN — click a station with an ingredient in hand', 60, 282, 15, '#c9a86a', 'left', false);
  lay.stations.forEach((zone) => {
    const station = STATIONS.find((s) => s.id === zone.id);
    const slot = state.stations[zone.id];
    const hover = mouse.x >= zone.x && mouse.x <= zone.x + zone.w
      && mouse.y >= zone.y && mouse.y <= zone.y + zone.h;
    ctx.fillStyle = hover ? '#7a4a2b' : PALETTE.wood;
    roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.fill();
    ctx.fillStyle = station.color;
    roundRect(ctx, zone.x + 8, zone.y + 8, zone.w - 16, 66, 8);
    ctx.fill();
    text(ctx, `${station.key}  ${station.name}`, zone.x + 16, zone.y + 30, 16, '#fff6dd');
    if (zone.id === 'plate') {
      text(ctx, 'assembles the dish', zone.x + 16, zone.y + 56, 13, '#fff6dd', 'left', false);
      return;
    }
    if (!slot) {
      text(ctx, 'empty — bring an ingredient', zone.x + 16, zone.y + 100, 13, '#f2e3c6', 'left', false);
      text(ctx, `cooks in ${station.cookSeconds}s`, zone.x + 16, zone.y + 126, 13, '#f2e3c6', 'left', false);
    } else {
      const ing = INGREDIENT_BY_ID[slot.ingredientId];
      drawIngredientShape(ctx, ing, zone.x + 40, zone.y + 108, 20);
      if (state.time >= slot.readyAt) {
        text(ctx, `${ing.name} READY!`, zone.x + 70, zone.y + 100, 15, PALETTE.gold);
        text(ctx, 'click to take it', zone.x + 70, zone.y + 126, 13, '#f2e3c6', 'left', false);
      } else {
        const left = slot.readyAt - state.time;
        ctx.fillStyle = '#3a2430';
        ctx.fillRect(zone.x + 70, zone.y + 100, 130, 10);
        ctx.fillStyle = PALETTE.gold;
        const progress = 1 - left / station.cookSeconds;
        ctx.fillRect(zone.x + 70, zone.y + 100, 130 * Math.max(0, Math.min(1, progress)), 10);
        text(ctx, `cooking… ${left.toFixed(1)}s`, zone.x + 70, zone.y + 126, 13, '#f2e3c6', 'left', false);
        drawSteam(ctx, zone.x + 108, zone.y + 92, state.time);
      }
    }
  });
}

function drawSteam(ctx, x, y, t) {
  ctx.strokeStyle = PALETTE.steam;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const wobble = Math.sin(t * 3 + i * 2) * 6;
    ctx.beginPath();
    ctx.moveTo(x - 16 + i * 16 + wobble, y + 18);
    ctx.quadraticCurveTo(x - 16 + i * 16 - wobble, y, x - 16 + i * 16 + wobble, y - 16);
    ctx.stroke();
  }
}

function drawPlateArea(ctx, state, mouse) {
  const lay = layout();
  ctx.fillStyle = PALETTE.woodDark;
  roundRect(ctx, 40, 452, 1200, 52, 10);
  ctx.fill();
  text(ctx, 'PLATE', 60, 468, 14, '#c9a86a');
  // The plate itself: a white ellipse holding the plated ingredients.
  ctx.fillStyle = '#fdfbf5';
  ctx.beginPath();
  ctx.ellipse(360, 478, 150, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  state.plate.forEach((ingId, i) => {
    drawIngredientShape(ctx, INGREDIENT_BY_ID[ingId], 250 + i * 90, 478, 18);
  });
  if (state.plate.length === 0) text(ctx, 'empty plate — click the Plating station with food in hand', 560, 478, 14, '#f2e3c6', 'left', false);
  else text(ctx, `${state.plate.length} on the plate — serve it when it matches an order`, 560, 478, 14, '#f2e3c6', 'left', false);
  // Bin.
  const bin = lay.bin;
  ctx.fillStyle = '#3a2430';
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 8);
  ctx.fill();
  text(ctx, 'BIN', bin.x + 30, bin.y + 24, 14, '#fff6dd', 'center');
}

export function drawIngredientShape(ctx, ing, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  switch (ing.shape) {
    case 'round':
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'chunk':
      roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, 4); ctx.fill(); ctx.stroke();
      break;
    case 'curl':
      ctx.beginPath(); ctx.arc(0, 0, r, 0.4, Math.PI * 1.6); ctx.lineWidth = 6; ctx.strokeStyle = ing.color; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fillStyle = ing.color; ctx.fill();
      break;
    case 'stick':
      ctx.save(); ctx.rotate(-0.5);
      roundRect(ctx, -r, -r * 0.3, r * 2, r * 0.6, 3); ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    case 'leaf':
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'cap':
      ctx.beginPath(); ctx.arc(0, -r * 0.2, r, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillRect(-r * 0.25, -r * 0.2, r * 0.5, r * 0.9);
      break;
    case 'coil':
      ctx.strokeStyle = ing.color; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.4) {
        const px = Math.cos(a) * r * (a / (Math.PI * 4));
        const py = Math.sin(a) * r * (a / (Math.PI * 4));
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    case 'bowl':
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillRect(-r, -r * 0.2, r * 2, 4);
      break;
    case 'dots':
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-r * 0.6 + i * r * 0.3, (i % 2 ? -4 : 4), 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCounter(ctx, state, mouse) {
  const lay = layout();
  text(ctx, 'INGREDIENT COUNTER — click to pick up (keys 1–5 use stations, B bins, Space serves)', 40, 512, 14, '#c9a86a', 'left', false);
  lay.ingredients.forEach((zone) => {
    const ing = INGREDIENT_BY_ID[zone.id];
    const hover = mouse.x >= zone.x && mouse.x <= zone.x + zone.w
      && mouse.y >= zone.y && mouse.y <= zone.y + zone.h;
    const held = state.held === zone.id;
    ctx.fillStyle = held ? PALETTE.gold : hover ? '#c98f5a' : PALETTE.counter;
    roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 8);
    ctx.fill();
    drawIngredientShape(ctx, ing, zone.x + 26, zone.y + 33, 14);
    text(ctx, ing.name, zone.x + 48, zone.y + 26, 14, '#fff6dd');
    text(ctx, COOKS_AT[ing.id] === 'none' ? 'no cooking' : `→ ${stationName(COOKS_AT[ing.id])}`, zone.x + 48, zone.y + 48, 11, '#f2e3c6', 'left', false);
  });
}

function stationName(id) {
  return STATIONS.find((s) => s.id === id).name;
}

function drawLog(ctx, state) {
  const line = state.log[state.log.length - 1] ?? '';
  text(ctx, line, 40, 700, 14, '#f2e3c6', 'left', false);
  text(ctx, 'Sizzle & Serve — a night-market dumpling stall', 1240, 700, 13, '#8a7a8a', 'right', false);
}

function drawFlash(ctx, state) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, (state.flash.until - state.time) / 1.2);
  text(ctx, state.flash.text, GAME.width / 2, 250, 44, state.flash.color, 'center');
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(18,13,20,0.82)';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  text(ctx, 'SIZZLE & SERVE', GAME.width / 2, 150, 64, PALETTE.gold, 'center');
  text(ctx, 'Run a night-market dumpling stall — 8 recipes, 5 stations, 14 ingredients,', GAME.width / 2, 220, 22, '#fff6dd', 'center', false);
  text(ctx, '3 rush-hour waves, 6 upgrades, and customers who will not wait.', GAME.width / 2, 252, 22, '#fff6dd', 'center', false);
  text(ctx, 'HOW TO PLAY', GAME.width / 2, 320, 18, PALETTE.gold, 'center');
  text(ctx, '1. Click an ingredient on the counter, then its station to cook it.', GAME.width / 2, 352, 17, '#fff6dd', 'center', false);
  text(ctx, '2. Take it off the station, plate it, and match an order ticket to serve.', GAME.width / 2, 380, 17, '#fff6dd', 'center', false);
  text(ctx, '3. Serve fast for combos and perfect bonuses. Clear each wave to shop upgrades.', GAME.width / 2, 408, 17, '#fff6dd', 'center', false);
  text(ctx, 'Mouse to play  •  keys 1–5 stations  •  B bin  •  Space serve', GAME.width / 2, 452, 15, '#c9a86a', 'center', false);
  const b = layout().start;
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'OPEN THE STALL', b.x + b.w / 2, b.y + 32, 22, PALETTE.ink, 'center');
}

function drawShop(ctx, state, mouse) {
  ctx.fillStyle = 'rgba(18,13,20,0.88)';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  const wave = WAVES[state.waveIndex];
  text(ctx, `${wave.name} CLEARED!`, GAME.width / 2, 130, 40, PALETTE.gold, 'center');
  text(ctx, `You have ${state.coins} coins — buy upgrades, then face the next rush.`, GAME.width / 2, 180, 19, '#fff6dd', 'center', false);
  const lay = layout();
  lay.shopButtons.forEach((zone) => {
    const up = UPGRADES.find((u) => u.id === zone.id);
    const owned = state.bought.has(up.id);
    const afford = state.coins >= up.cost;
    const hover = mouse.x >= zone.x && mouse.x <= zone.x + zone.w
      && mouse.y >= zone.y && mouse.y <= zone.y + zone.h;
    ctx.fillStyle = owned ? '#3a5a3a' : hover && afford ? '#7a4a2b' : PALETTE.wood;
    roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.fill();
    text(ctx, up.name, zone.x + 16, zone.y + 24, 17, '#fff6dd');
    text(ctx, up.desc, zone.x + 16, zone.y + 50, 13, '#f2e3c6', 'left', false);
    text(ctx, owned ? 'OWNED' : `${up.cost} coins`, zone.x + 16, zone.y + 78, 15, owned ? PALETTE.green : afford ? PALETTE.gold : '#ff8a80');
  });
  const b = lay.nextWave;
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, `START ${WAVES[state.waveIndex + 1].name.toUpperCase()}`, b.x + b.w / 2, b.y + 28, 18, PALETTE.ink, 'center');
}

function drawEnd(ctx, state, title, sub) {
  ctx.fillStyle = 'rgba(18,13,20,0.85)';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  text(ctx, title, GAME.width / 2, 220, 44, PALETTE.gold, 'center');
  text(ctx, sub, GAME.width / 2, 280, 20, '#fff6dd', 'center', false);
  text(ctx, `Dishes served: ${state.stats.served}   •   Perfect: ${state.stats.perfect}   •   Coins earned: ${state.stats.earned}   •   Score: ${state.score}`, GAME.width / 2, 340, 18, '#fff6dd', 'center', false);
  text(ctx, 'Press R to play again', GAME.width / 2, 400, 17, '#c9a86a', 'center', false);
}

function drawHeld(ctx, state, mouse) {
  const ing = INGREDIENT_BY_ID[state.held];
  drawIngredientShape(ctx, ing, mouse.x, mouse.y - 24, 16);
  text(ctx, ing.name, mouse.x, mouse.y - 48, 13, '#fff6dd', 'center');
}
