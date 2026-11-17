// UMBRA — all design data: chapters, seasons, gifts, feats, and the twelve
// courtyards. The world is a 1200x700 court. Casters throw the only safe
// ground there is: their shade.

export const WORLD = { w: 1200, h: 700 };

// Sun elevation per chapter: lower sun = longer shade.
export const CHAPTERS = [
  {
    id: 'dawn', name: 'DAWN', sub: 'The First Light', elev: 0.38,
    sky: ['#3b2b52', '#7a4470', '#c96f4a'], lit: '#8a5a44', litEdge: '#a06a4c',
    ground: '#6e4636', shade: 'rgba(24,20,54,0.88)', mote: '#ffd98a',
    accent: '#ffcf87', panel: '#2a1e3f',
  },
  {
    id: 'noon', name: 'NOON', sub: 'The White Hour', elev: 1.05,
    sky: ['#274069', '#4a6ea8', '#9db8d9'], lit: '#b09a72', litEdge: '#c2ab80',
    ground: '#97835f', shade: 'rgba(30,34,72,0.88)', mote: '#fff3c4',
    accent: '#ffe9a8', panel: '#1e2a4a',
  },
  {
    id: 'dusk', name: 'DUSK', sub: 'The Ember Hour', elev: 0.30,
    sky: ['#2c1638', '#6e2547', '#c74e35'], lit: '#7c4034', litEdge: '#8f4c3a',
    ground: '#5f322c', shade: 'rgba(16,12,44,0.9)', mote: '#ffb37a',
    accent: '#ffab6b', panel: '#33182f',
  },
  {
    id: 'night', name: 'NIGHT', sub: 'The Moon Hour', elev: 0.55,
    sky: ['#060a24', '#101c44', '#274069'], lit: '#3d4a75', litEdge: '#47567f',
    ground: '#2c3557', shade: 'rgba(4,6,22,0.92)', mote: '#bfe3ff',
    accent: '#a8d8ff', panel: '#0c1430',
  },
];

export const SEASONS = [
  { id: 'spring', name: 'SPRING', tag: 'GENTLE', desc: 'The light forgives. Burn builds 30% slower.', burn: 0.7, drift: 0.7, mult: 0.75 },
  { id: 'summer', name: 'SUMMER', tag: 'STANDARD', desc: 'The court as it was meant to be crossed.', burn: 1.0, drift: 1.0, mult: 1.0 },
  { id: 'autumn', name: 'AUTUMN', tag: 'SEVERE', desc: 'Cruel light, restless sun. Burn +30%, score x1.5.', burn: 1.3, drift: 1.5, mult: 1.5 },
];

// Shadow Gifts: three families of three. Two of one family wake its synergy.
export const GIFTS = [
  { id: 'longshade', fam: 'SHADE', name: 'Long Shade', icon: '◐', desc: 'All shade stretches 18% longer.', },
  { id: 'deepumbra', fam: 'SHADE', name: 'Deep Umbra', icon: '●', desc: 'Burn builds 35% slower in the light.', },
  { id: 'coolheart', fam: 'SHADE', name: 'Cool Heart', icon: '❄', desc: 'Burn drains 60% faster in the shade.', },
  { id: 'swift', fam: 'SPIRIT', name: 'Swift Shade', icon: '➤', desc: 'Move 14% faster.', },
  { id: 'secondbreath', fam: 'SPIRIT', name: 'Second Breath', icon: '✦', desc: 'Once per run, a fatal burn rekindles you at the gate.', },
  { id: 'crystalsense', fam: 'SPIRIT', name: 'Crystal Sense', icon: '◆', desc: 'Shade crystals shine through the light and are worth +50%.', },
  { id: 'steadyhand', fam: 'DIAL', name: 'Steady Hand', icon: '☉', desc: 'The sun swings 40% faster to your pointing.', },
  { id: 'slowdusk', fam: 'DIAL', name: 'Slow Hours', icon: '◔', desc: 'The drifting sun moves at half speed.', },
  { id: 'emberward', fam: 'DIAL', name: 'Ember Ward', icon: '◎', desc: "The Sunwraith's gaze shrinks by 25%.", },
];
export const SYNERGIES = {
  SHADE: { name: 'ETERNAL SHADE', desc: 'Shade +12% longer still, burn −15%.' },
  SPIRIT: { name: 'KINDRED SPIRIT', desc: '+8% speed, crystals +25% more.' },
  DIAL: { name: 'MASTER OF HOURS', desc: 'Sun drift halved again, swing +20%.' },
};

export const FEATS = [
  { id: 'first', name: 'First Shade', desc: 'Finish the first courtyard' },
  { id: 'untouched', name: 'Untouched', desc: 'Finish a courtyard with burn never above half' },
  { id: 'hoard', name: 'Crystal Hoard', desc: 'Gather 18 shade crystals in one run' },
  { id: 'watches', name: 'Four Watches Kept', desc: 'Complete all twelve courtyards' },
  { id: 'flawlessdusk', name: 'Flawless Dusk', desc: 'Cross the Dusk chapter without dying' },
  { id: 'wraithwalker', name: 'Wraithwalker', desc: 'Cross the final courtyard' },
  { id: 'seasonal', name: 'Child of Autumn', desc: 'Complete a run in Autumn' },
  { id: 'swift', name: 'Swifter than Light', desc: 'Complete a run in under 12 minutes' },
];

// Caster kinds: p = pillar (round), t = tree (round, sways at dusk),
// s = statue (square), m = movable statue, w = wall block (wide rect).
// x, y is the centre; r the radius (or half-size); h the height factor.
const C = (kind, x, y, r, h = 1) => ({ kind, x, y, r, h });
export const STAGES = [
  // — DAWN —
  { name: 'The Threshold', chapter: 0, par: 40, start: [90, 350], gate: [1110, 350], sun: -0.5,
    casters: [C('p', 215, 300, 18, 1.15), C('p', 350, 395, 20, 1.2), C('t', 600, 300, 26, 1.4), C('p', 830, 400, 18, 1.15), C('p', 1010, 290, 18, 1.1)],
    crystals: [[620, 350], [880, 200]], wraith: null },
  { name: 'Twin Sentinels', chapter: 0, par: 45, start: [90, 120], gate: [1110, 580], sun: 0.6,
    casters: [C('s', 300, 300, 24, 1.3), C('s', 300, 420, 24, 1.3), C('t', 520, 180, 26, 1.4), C('p', 520, 540, 20, 1.2), C('t', 740, 360, 28, 1.5), C('p', 950, 200, 18, 1.1), C('p', 950, 520, 18, 1.1)],
    crystals: [[410, 360], [740, 120], [1010, 360]], wraith: null },
  { name: 'The Long Garden', chapter: 0, par: 50, start: [90, 600], gate: [1110, 100], sun: 2.6,
    casters: [C('t', 260, 470, 26, 1.5), C('t', 430, 560, 24, 1.4), C('p', 430, 300, 20, 1.2), C('s', 620, 420, 24, 1.3), C('t', 620, 180, 26, 1.5), C('p', 820, 300, 20, 1.2), C('t', 980, 470, 26, 1.4), C('s', 980, 160, 22, 1.2)],
    crystals: [[520, 470], [720, 300], [900, 90]], wraith: null },
  // — NOON (short shade) —
  { name: 'The White Court', chapter: 1, par: 45, start: [90, 350], gate: [1110, 350], sun: -1.2,
    casters: [C('p', 280, 220, 20, 1.5), C('p', 280, 480, 20, 1.5), C('s', 470, 350, 26, 1.6), C('p', 650, 200, 20, 1.5), C('p', 650, 500, 20, 1.5), C('s', 830, 350, 26, 1.6), C('p', 990, 350, 20, 1.4)],
    crystals: [[560, 350], [740, 350], [920, 180]], wraith: null },
  { name: 'Idols That Walk', chapter: 1, par: 55, start: [90, 350], gate: [1110, 350], sun: 0.2,
    casters: [C('m', 330, 350, 24, 1.5), C('p', 520, 180, 20, 1.5), C('p', 520, 520, 20, 1.5), C('m', 700, 350, 24, 1.5), C('s', 890, 350, 26, 1.6), C('p', 1000, 180, 18, 1.4)],
    crystals: [[610, 350], [800, 520], [980, 470]], wraith: null },
  { name: 'The Meridian', chapter: 1, par: 55, start: [90, 90], gate: [1110, 610], sun: 1.9,
    casters: [C('w', 360, 350, 60, 1.7), C('p', 360, 130, 20, 1.5), C('p', 360, 570, 20, 1.5), C('w', 640, 350, 60, 1.7), C('t', 640, 120, 26, 1.6), C('s', 880, 240, 25, 1.6), C('s', 880, 470, 25, 1.6), C('p', 1020, 350, 20, 1.5)],
    crystals: [[500, 350], [760, 350], [880, 610]], wraith: null },
  // — DUSK (the sun drifts) —
  { name: 'The Turning Hour', chapter: 2, par: 50, start: [90, 350], gate: [1110, 350], sun: -2.4, drift: 0.055,
    casters: [C('t', 300, 350, 28, 1.6), C('p', 500, 220, 20, 1.4), C('p', 500, 480, 20, 1.4), C('t', 700, 350, 28, 1.6), C('s', 900, 350, 25, 1.5)],
    crystals: [[600, 350], [800, 160], [1000, 540]], wraith: null },
  { name: 'Swaying Giants', chapter: 2, par: 55, start: [90, 610], gate: [1110, 90], sun: 0.9, drift: 0.04,
    casters: [C('t', 280, 470, 30, 1.8), C('t', 470, 560, 28, 1.7), C('t', 470, 250, 28, 1.7), C('t', 680, 400, 30, 1.8), C('t', 880, 540, 28, 1.7), C('t', 880, 200, 28, 1.7), C('p', 1020, 370, 20, 1.4)],
    crystals: [[580, 400], [780, 90], [990, 610]], wraith: null },
  { name: 'Emberfall', chapter: 2, par: 60, start: [90, 350], gate: [1110, 350], sun: 2.9, drift: 0.07,
    casters: [C('s', 290, 180, 24, 1.5), C('s', 290, 520, 24, 1.5), C('m', 480, 350, 24, 1.5), C('t', 660, 200, 27, 1.6), C('t', 660, 500, 27, 1.6), C('s', 850, 350, 25, 1.6), C('p', 1000, 160, 18, 1.3), C('p', 1000, 540, 18, 1.3)],
    crystals: [[570, 350], [760, 350], [930, 350]], wraith: null },
  // — NIGHT (the wraith walks) —
  { name: 'First Gaze', chapter: 3, par: 55, start: [90, 350], gate: [1110, 350], sun: -0.8,
    casters: [C('p', 300, 240, 20, 1.4), C('p', 300, 460, 20, 1.4), C('t', 520, 350, 27, 1.6), C('s', 740, 240, 24, 1.5), C('s', 740, 460, 24, 1.5), C('p', 950, 350, 20, 1.4)],
    crystals: [[630, 160], [630, 540], [860, 350]],
    wraith: { path: [[600, 130], [600, 570]], speed: 0.55, radius: 120 } },
  { name: 'The Narrow Dark', chapter: 3, par: 60, start: [90, 90], gate: [1110, 610], sun: 1.4,
    casters: [C('w', 330, 300, 55, 1.7), C('p', 330, 560, 20, 1.4), C('t', 560, 160, 26, 1.6), C('w', 560, 430, 55, 1.7), C('s', 790, 250, 24, 1.5), C('t', 790, 520, 26, 1.6), C('p', 990, 380, 20, 1.4)],
    crystals: [[450, 430], [680, 300], [900, 610]],
    wraith: { path: [[450, 610], [450, 90], [760, 90], [760, 610]], speed: 0.5, radius: 115 } },
  { name: 'The Great Sunwraith', chapter: 3, par: 75, start: [90, 350], gate: [1110, 350], sun: -2.0,
    casters: [C('p', 280, 350, 20, 1.5), C('t', 450, 180, 27, 1.6), C('t', 450, 520, 27, 1.6), C('s', 620, 350, 26, 1.7), C('t', 790, 180, 27, 1.6), C('t', 790, 520, 27, 1.6), C('p', 960, 350, 20, 1.5)],
    crystals: [[535, 350], [705, 350], [620, 90]],
    wraith: { path: [[620, 350]], speed: 0.35, radius: 165, orbit: 190 } },
];

export const gradeFor = (frac) => (frac >= 0.92 ? 'S' : frac >= 0.78 ? 'A' : frac >= 0.6 ? 'B' : frac >= 0.4 ? 'C' : 'D');
