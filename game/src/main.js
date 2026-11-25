// Sizzle & Serve — entry point: sizes the canvas, wires input and audio,
// runs the tick/render loop, and applies ?shot= presets for screenshots.

import { GAME } from './config.js';
import { createAudio } from './audio.js';
import { attachInput } from './input.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';
import { createState, tick } from './state.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

const state = createState();
const audio = createAudio();
const mouse = attachInput(canvas, state, audio);

// Fixed internal resolution; CSS scales it to the window.
canvas.width = GAME.width;
canvas.height = GAME.height;

const params = new URLSearchParams(window.location.search);
const isShot = applyShot(state, params);
if (isShot) {
  // Screenshots are deterministic: freeze the clock so the patience bars
  // and steam read the same every render.
  state.time = 42;
}

let last = performance.now();
let announced = '';

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!isShot) tick(state, dt);
  draw(ctx, state, mouse);
  const line = describe(state);
  if (line !== announced) {
    announced = line;
    status.textContent = line;
  }
  requestAnimationFrame(frame);
}

function describe(state) {
  if (state.screen === 'title') return 'Sizzle and Serve. Press Enter to open the stall.';
  if (state.screen === 'shop') return `Wave cleared. You have ${state.coins} coins. Buy upgrades or start the next wave.`;
  if (state.screen === 'over') return `Game over. Score ${state.score}. Press R to play again.`;
  if (state.screen === 'win') return `You won. Best stall on the street. Score ${state.score}. Press R to play again.`;
  return `${state.orders.length} orders waiting, ${state.coins} coins, ${state.lives} hearts, score ${state.score}.`;
}

requestAnimationFrame(frame);
