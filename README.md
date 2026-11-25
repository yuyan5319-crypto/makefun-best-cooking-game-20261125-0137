[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/yuyan5319-crypto/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/yuyan5319-crypto/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# SIZZLE & SERVE: run a night-market dumpling stall — 8 recipes, 5 stations, 14 ingredients, 3 rush-hour waves, 6 upgrades

Sizzle & Serve is a complete cooking game for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137): 8 recipes to master, 5 stations to run, 14 ingredients on the counter, 3 rush-hour waves that get faster every time, and 6 upgrades to buy between waves. Serve orders before customers walk out, chain fast serves into combos, and finish the Midnight Rush to become the best stall on the street.

## How to play

1. **Pick up** an ingredient by clicking it on the counter (bottom).
2. **Cook it** at the right station: chop board, boiling pot, fryer, or steamer. Each ingredient lists where it belongs — dough, chilli and sesame need no cooking and go straight to the plate.
3. **Take it off** the station when it is ready, then **plate it** at the Plating station.
4. **Serve** when the plate matches an order ticket exactly, in order. Fast serves earn perfect bonuses; serving within 12 seconds of the last serve builds a combo worth +2 coins per step.
5. **Clear the wave** (5, then 7, then 9 orders) to open the upgrade shop, spend your coins, and face the next rush. Lose all 3 hearts to walk-outs and the stall closes early.

Keyboard: `1–5` use the stations, `Space` serves, `B` bins what you hold, `C` clears the plate, `R` restarts after game over, `Enter` opens the stall and continues from the shop.

## What is in the game

- **8 recipes** — Pork Dumpling, Prawn Dumpling, Garden Dumpling, Dan Dan Noodle, Golden Egg Noodle, Tofu Broth Bowl, Prawn Noodle Soup, and the 5-step Night Feast Platter.
- **5 stations** — Chop Board, Boiling Pot, Fryer, Steamer, and Plating — each with its own cook time and a progress bar with steam.
- **14 ingredients** — dough, pork, prawn, chive, cabbage, mushroom, noodle, egg, chilli, ginger, spring onion, tofu, broth, sesame.
- **3 rush-hour waves** — Lantern Hour, Dinner Rush, Midnight Rush — with faster order arrivals and shorter patience each wave.
- **6 upgrades** — Sharp Knife, Big Pot, Second Plate, Calm Service, Hot Oil, Lucky Lantern.
- **Systems** — order patience timers, combo window, perfect-serve bonus, coins and score, 3 hearts, shop between waves, WebAudio synth sizzle/serve sounds (no audio files), and a screen-reader status line.

## Run it

No build step, no network: everything is static files under `game/`.

```sh
node serve.ts   # then open http://localhost:8080
```

Or open `game/index.html` through any static server. Screenshots live in `screenshots/` (cover first) and were taken from this code with `shots.json` (`?shot=start|play|rush|serve`).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json` with the vendored `vendor/makefun-game.ts` library.

## License

MIT — see [LICENSE](LICENSE).
