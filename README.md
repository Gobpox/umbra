# UMBRA — walk the shadow home

![make.fun best-game-01](https://make.fun/badge/best-game-01.svg)
![rank](https://make.fun/badge/best-game-01/Gobpox/umbra/rank.svg)
![reward](https://make.fun/badge/best-game-01/Gobpox/umbra/reward.svg)

An entry to [make.fun best-game-01](https://make.fun/bounty/best-game-01).

**The light burns. The shade is a road.** You are a little shade-spirit in a
temple court where sunlight itself is deadly. Turn the sun, and the shadows
of pillars, trees, statues and walls stretch and sweep across the court —
the only safe ground there is. Walk the shadow home through twelve
courtyards, from the first dawn to the night of the Great Sunwraith.

## How to play

Open `game/index.html` in a browser — no build step, no network, everything
is drawn and sounded in code.

- **WASD / arrows** — walk the spirit (touch: left stick)
- **Mouse** — aim the sun; shade falls away from your pointing (touch: drag right side)
- **Q / E** — turn the sun by hand · **R** restart courtyard · **Esc** pause

Cross all twelve courtyards to the last moon gate. Stand in the light and
you burn — the courtyard begins again.

## The shape of the game

- **Four watches** — Dawn (long kind shade), Noon (shade shrinks to ribbons,
  idols can be pushed), Dusk (the sun drifts on its own, trees sway), Night
  (the Sunwraith patrols and its gaze burns).
- **Shadow Gifts** — between courtyards, draft 1 of 3 gifts in three
  families (Shade, Spirit, Dial); two of one family wake its synergy.
  Reroll for embers.
- **Three seasons** — Spring (gentle, ×0.75), Summer (standard, ×1),
  Autumn (severe, ×1.5), each with its own best score.
- **Scoring & grades** — 1,000 per courtyard, par-time bonus, +250 per
  shade crystal, season multiplier; grades D to S, a per-courtyard score
  chart, feats kept forever, last crossings remembered.
- The shade is computed honestly: every caster's silhouette is extruded
  along the sun direction into a shade layer, and the spirit is safe
  exactly where that layer is dark at its feet.

## Layout

- `game/` — the playable static game (`index.html` + `src/` modules:
  config, game, render, input, audio, main)
- `screenshots/` — the maker's screenshots of the real game running
- `main.ts` — the handover program: copies `game/` and `screenshots/` to
  the output directory and writes `dossier.json` with the vendored library
- `vendor/makefun-game.ts` — the bounty kit's library, byte-identical

## License

MIT — see `LICENSE`.
