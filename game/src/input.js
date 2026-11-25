// Sizzle & Serve — input: mouse clicks and keyboard, mapped onto the same
// hit zones render.js draws (layout() is the single source of truth).

import { STATIONS, UPGRADES } from './config.js';
import { layout } from './render.js';
import { binHeld, buyUpgrade, clearPlate, nextWave, pickIngredient, startGame, tryServe, useStation } from './state.js';

export function attachInput(canvas, state, audio) {
  const mouse = { x: -100, y: -100 };

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 1280;
    mouse.y = ((event.clientY - rect.top) / rect.height) * 720;
  });

  canvas.addEventListener('click', () => {
    audio.resume();
    handleClick(state, mouse, audio);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    audio.resume();
    const key = event.key.toLowerCase();
    if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
      startGame(state);
      audio.sizzle();
      return;
    }
    if ((state.screen === 'over' || state.screen === 'win') && key === 'r') {
      startGame(state);
      return;
    }
    if (state.screen === 'shop' && key === 'enter') {
      nextWave(state);
      return;
    }
    if (state.screen !== 'playing') return;
    const station = STATIONS.find((s) => s.key === key);
    if (station) {
      useStation(state, station.id);
      audio.click();
      return;
    }
    if (key === ' ') { event.preventDefault(); tryServe(state); audio.serve(); }
    if (key === 'b') binHeld(state);
    if (key === 'c') clearPlate(state);
  });

  return mouse;
}

export function handleClick(state, mouse, audio) {
  const lay = layout();
  if (state.screen === 'title') {
    const b = lay.start;
    if (inside(mouse, b)) {
      startGame(state);
      audio.sizzle();
    }
    return;
  }
  if (state.screen === 'shop') {
    for (const zone of lay.shopButtons) {
      if (inside(mouse, zone)) {
        if (buyUpgrade(state, zone.id)) audio.buy();
        return;
      }
    }
    if (inside(mouse, lay.nextWave)) {
      nextWave(state);
      audio.sizzle();
    }
    return;
  }
  if (state.screen !== 'playing') return;

  for (const zone of lay.stations) {
    if (inside(mouse, zone)) {
      useStation(state, zone.id);
      audio.click();
      return;
    }
  }
  if (inside(mouse, lay.bin)) {
    binHeld(state);
    audio.click();
    return;
  }
  for (const zone of lay.ingredients) {
    if (inside(mouse, zone)) {
      pickIngredient(state, zone.id);
      audio.click();
      return;
    }
  }
}

function inside(mouse, rect) {
  return mouse.x >= rect.x && mouse.x <= rect.x + rect.w
    && mouse.y >= rect.y && mouse.y <= rect.y + rect.h;
}

// Keyboard shortcuts for the shop (1-6 buy, Enter continues) are handled
// here so the shop stays playable without a mouse.
export function shopKey(state, key) {
  const index = Number.parseInt(key, 10) - 1;
  if (index >= 0 && index < UPGRADES.length) return buyUpgrade(state, UPGRADES[index].id);
  return false;
}
