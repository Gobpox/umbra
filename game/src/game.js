// UMBRA simulation: the sun, the shade layer, the spirit, the wraith.
// Shade is computed honestly: every caster's silhouette is extruded along
// the sun direction onto an offscreen layer, and the spirit is safe exactly
// where that layer is dark at its feet.

import { WORLD, CHAPTERS, SEASONS, GIFTS, SYNERGIES, FEATS, STAGES, gradeFor } from './config.js';

const SAVE_KEY = 'umbra-save-v1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export function defaultSave() {
  return { best: {}, feats: {}, lastRuns: [], settings: { music: 0.7, sfx: 0.9 } };
}
export function loadSave() {
  try { return Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}')); }
  catch { return defaultSave(); }
}

export function createGame(audio) {
  const save = loadSave();
  const shadeCv = document.createElement('canvas');
  shadeCv.width = WORLD.w / 2; shadeCv.height = WORLD.h / 2;
  const sctx = shadeCv.getContext('2d', { willReadFrequently: true });

  const S = {
    mode: 'title', // title | playing | draft | over | paused
    season: SEASONS[1], seasonIdx: 1,
    stageIdx: 0, stage: null, casters: [], crystals: [],
    player: null, wraith: null,
    sun: 0, sunTarget: 0, time: 0, stageTime: 0, runTime: 0,
    burn: 0, burnPeak: 0, inShade: true, inGaze: false,
    deaths: 0, score: 0, embers: 10, crystalsGot: 0,
    gifts: [], synergies: [], secondBreath: true,
    stageStats: [], notes: [], particles: [],
    draftChoices: null, rerolled: false,
    over: null, shake: 0, newFeats: [],
  };

  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} };
  const giftCount = (fam) => S.gifts.filter((g) => g.fam === fam).length;
  const has = (id) => S.gifts.some((g) => g.id === id);
  const hasSyn = (fam) => giftCount(fam) >= 2;

  function eff() {
    return {
      shadeLen: (1 + (has('longshade') ? 0.18 : 0) + (hasSyn('SHADE') ? 0.12 : 0)),
      burnRate: S.season.burn * (1 - (has('deepumbra') ? 0.35 : 0)) * (1 - (hasSyn('SHADE') ? 0.15 : 0)),
      burnDrain: 1 + (has('coolheart') ? 0.6 : 0),
      speed: 218 * (1 + (has('swift') ? 0.14 : 0) + (hasSyn('SPIRIT') ? 0.08 : 0)),
      sunSwing: 3.4 * (1 + (has('steadyhand') ? 0.4 : 0) + (hasSyn('DIAL') ? 0.2 : 0)),
      drift: (S.season.drift) * (has('slowdusk') ? 0.5 : 1) * (hasSyn('DIAL') ? 0.5 : 1),
      crystalMult: (1 + (has('crystalsense') ? 0.5 : 0)) * (1 + (hasSyn('SPIRIT') ? 0.25 : 0)),
      gazeRadius: 1 - (has('emberward') ? 0.25 : 0),
    };
  }

  function loadStage(idx) {
    const def = STAGES[idx];
    S.stage = def; S.stageIdx = idx;
    S.casters = def.casters.map((c) => ({ ...c, ox: c.x, oy: c.y, swayPhase: Math.random() * 6.28 }));
    S.crystals = def.crystals.map(([x, y]) => ({ x, y, got: false, bob: Math.random() * 6.28 }));
    S.player = { x: def.start[0], y: def.start[1], r: 13, face: 1, walk: 0 };
    S.sun = def.sun; S.sunTarget = def.sun;
    S.stageTime = 0; S.burn = 0; S.burnPeak = 0;
    S.wraith = def.wraith ? { ...def.wraith, x: def.wraith.path[0][0], y: def.wraith.path[0][1], seg: 0, t: 0, angle: 0 } : null;
    audio.setChapter(def.chapter);
    audio.setHum(!!S.wraith);
  }

  function startRun(seasonIdx) {
    S.seasonIdx = seasonIdx; S.season = SEASONS[seasonIdx];
    S.score = 0; S.deaths = 0; S.crystalsGot = 0; S.embers = 10;
    S.gifts = []; S.synergies = []; S.secondBreath = true;
    S.stageStats = []; S.runTime = 0; S.newFeats = [];
    S.duskDeathsAtStart = 0;
    loadStage(0);
    S.mode = 'playing';
  }

  // — the shade layer —
  function casterPos(c, t) {
    let { x, y } = c;
    if (c.kind === 't' && S.stage && S.stage.chapter >= 2) {
      const sway = Math.sin(t * 0.9 + c.swayPhase) * 7;
      x += sway; y += Math.cos(t * 0.7 + c.swayPhase) * 3;
    }
    return { x, y };
  }
  function drawSilhouette(ctx, c, x, y, scale = 0.5) {
    // silhouettes are drawn fat like a soft penumbra: the band ends up a
    // little wider than the caster's collision, so the spirit can squeeze
    // around a pillar inside its own shade
    const pad = 12;
    ctx.beginPath();
    if (c.kind === 'w') ctx.rect((x - c.r * 1.5 - pad) * scale, (y - c.r * 0.55 - pad) * scale, (c.r * 3 + pad * 2) * scale, (c.r * 1.1 + pad * 2) * scale);
    else if (c.kind === 's' || c.kind === 'm') ctx.rect((x - c.r - pad) * scale, (y - c.r - pad) * scale, (c.r * 2 + pad * 2) * scale, (c.r * 2 + pad * 2) * scale);
    else ctx.arc(x * scale, y * scale, (c.r + pad) * scale, 0, 6.2832);
    ctx.fill();
  }
  function rebuildShade() {
    const e = eff();
    const ch = CHAPTERS[S.stage.chapter];
    const len = (150 / ch.elev) * e.shadeLen;
    const dx = -Math.cos(S.sun), dy = -Math.sin(S.sun);
    sctx.clearRect(0, 0, shadeCv.width, shadeCv.height);
    sctx.fillStyle = 'rgba(0,0,0,0.92)';
    // Each silhouette must clear the shadeAt threshold ON ITS OWN: the discs
    // near the caster barely overlap, so a faint alpha there would leave a
    // light gap exactly where the spirit rounds the caster. Steps are spaced
    // ~7px apart so long shadows stay smooth instead of scalloped.
    for (const c of S.casters) {
      const p = casterPos(c, S.time);
      const L = len * c.h * 0.62;
      const steps = Math.max(14, Math.min(90, Math.ceil(L / 7)));
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        sctx.globalAlpha = 0.34;
        drawSilhouette(sctx, c, p.x + dx * L * f, p.y + dy * L * f);
      }
    }
    sctx.globalAlpha = 1;
  }
  function shadeAt(x, y) {
    const px = clamp((x / 2) | 0, 0, shadeCv.width - 1), py = clamp((y / 2) | 0, 0, shadeCv.height - 1);
    try { return sctx.getImageData(px, py, 1, 1).data[3] > 70; } catch { return false; }
  }

  function notify(text, color = '#ffe9a8') {
    S.notes.unshift({ text, color, t: 4 });
    if (S.notes.length > 5) S.notes.pop();
  }
  function burst(x, y, color, n = 10, speed = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = speed * (0.3 + Math.random() * 0.7);
      S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.5 + Math.random() * 0.5, t: 0, color, size: 1.5 + Math.random() * 2.5 });
    }
  }
  function unlockFeat(id) {
    if (save.feats[id]) return;
    save.feats[id] = true; S.newFeats.push(id);
    const f = FEATS.find((x) => x.id === id);
    if (f) notify(`✦ Feat: ${f.name}`, '#a8ffd8');
    persist();
  }

  function die() {
    if (has('secondbreath') && S.secondBreath) {
      S.secondBreath = false;
      S.burn = 0;
      S.player.x = S.stage.start[0]; S.player.y = S.stage.start[1];
      notify('✦ Second Breath — rekindled at the gate', '#a8d8ff');
      burst(S.player.x, S.player.y, '#a8d8ff', 22, 130);
      audio.pick();
      return;
    }
    S.deaths++;
    audio.die();
    burst(S.player.x, S.player.y, '#ff9a5c', 26, 150);
    S.shake = 0.35;
    S.player.x = S.stage.start[0]; S.player.y = S.stage.start[1];
    S.burn = 0; S.burnPeak = 0;
    notify('The light takes you. Begin the courtyard again.', '#ff9a5c');
  }

  function finishStage() {
    const def = S.stage;
    const timeBonus = Math.max(0, Math.round((def.par - S.stageTime) * 10));
    const crys = S.crystals.filter((c) => c.got).length;
    const gained = Math.round((1000 + timeBonus + crys * 250 * eff().crystalMult) * S.season.mult);
    S.score += gained;
    S.embers += 10 + crys * 5;
    S.stageStats.push({ name: def.name, chapter: def.chapter, time: S.stageTime, crystals: crys, ofCrystals: S.crystals.length, score: gained });
    audio.gate();
    if (S.stageIdx === 0) unlockFeat('first');
    if (S.burnPeak <= 0.5) unlockFeat('untouched');
    if (S.crystalsGot >= 18) unlockFeat('hoard');
    if (S.stageIdx === 11) unlockFeat('wraithwalker');
    if (S.stageIdx === 8 && S.deaths === (S.duskDeathsAtStart ?? 0)) unlockFeat('flawlessdusk');
    if (S.stageIdx === 5) S.duskDeathsAtStart = S.deaths;
    if (S.stageIdx >= STAGES.length - 1) return finishRun(true);
    // draft between courtyards — while gifts remain unclaimed
    const owned = new Set(S.gifts.map((g) => g.id));
    if (GIFTS.every((g) => owned.has(g.id))) {
      notify('All nine gifts are yours. The road is bare and bright.', '#ffd76b');
      loadStage(S.stageIdx + 1);
      S.mode = 'playing';
      return;
    }
    S.mode = 'draft';
    S.rerolled = false;
    rollDraft();
    audio.draft();
  }
  function rollDraft() {
    const owned = new Set(S.gifts.map((g) => g.id));
    const pool = GIFTS.filter((g) => !owned.has(g.id));
    const picks = [];
    const byFam = {};
    for (const g of pool) (byFam[g.fam] ??= []).push(g);
    const fams = Object.keys(byFam).sort(() => Math.random() - 0.5);
    for (const fam of fams) if (picks.length < 3 && byFam[fam].length) picks.push(byFam[fam].splice((Math.random() * byFam[fam].length) | 0, 1)[0]);
    while (picks.length < 3 && pool.length) {
      const g = pool[(Math.random() * pool.length) | 0];
      if (!picks.includes(g)) picks.push(g); else break;
    }
    S.draftChoices = picks.slice(0, 3);
  }
  function pickGift(id) {
    const g = GIFTS.find((x) => x.id === id);
    if (!g) return;
    S.gifts.push(g);
    audio.pick();
    if (giftCount(g.fam) === 2) {
      S.synergies.push(g.fam);
      notify(`☉ Synergy wakes: ${SYNERGIES[g.fam].name}`, '#ffd76b');
      audio.synergy();
    } else notify(`Gift taken: ${g.name}`, '#ffe9a8');
    S.draftChoices = null;
    loadStage(S.stageIdx + 1);
    S.mode = 'playing';
  }
  function reroll() {
    if (S.rerolled || S.embers < 20) { audio.error(); return; }
    S.embers -= 20; S.rerolled = true;
    rollDraft(); audio.draft();
  }
  function finishRun(won) {
    S.mode = 'over';
    audio.setHum(false);
    if (won) audio.dawn();
    const maxScore = STAGES.reduce((a, s) => a + 1000 + s.par * 10 + s.crystals.length * 250, 0) * S.season.mult;
    const frac = clamp(S.score / maxScore, 0, 1);
    const grade = gradeFor(frac);
    if (won) {
      unlockFeat('watches');
      if (S.seasonIdx === 2) unlockFeat('seasonal');
      if (S.runTime < 720) unlockFeat('swift');
    }
    const run = { score: S.score, grade, won, season: S.season.name, time: S.runTime, deaths: S.deaths, crystals: S.crystalsGot, at: Date.now() };
    save.lastRuns = [run, ...(save.lastRuns ?? [])].slice(0, 3);
    const prevBest = save.best[S.season.id]?.score ?? 0;
    if (S.score > prevBest) save.best[S.season.id] = { score: S.score, grade };
    persist();
    S.over = { won, grade, frac, maxScore, isBest: S.score >= prevBest && S.score > 0 };
  }

  function updateWraith(dt) {
    const w = S.wraith;
    if (!w) return;
    if (w.orbit) {
      w.angle += dt * w.speed;
      w.x = w.path[0][0] + Math.cos(w.angle) * w.orbit;
      w.y = w.path[0][1] + Math.sin(w.angle) * w.orbit * 0.72;
      return;
    }
    const path = w.path;
    const [tx, ty] = path[(w.seg + 1) % path.length];
    const d = dist(w.x, w.y, tx, ty);
    const step = w.speed * 100 * dt;
    if (d < step) { w.x = tx; w.y = ty; w.seg = (w.seg + 1) % path.length; }
    else { w.x += (tx - w.x) / d * step; w.y += (ty - w.y) / d * step; }
  }

  function update(dt, input) {
    S.time += dt;
    for (const n of S.notes) n.t -= dt;
    S.notes = S.notes.filter((n) => n.t > 0);
    for (const p of S.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; }
    S.particles = S.particles.filter((p) => p.t < p.life);
    if (S.shake > 0) S.shake -= dt;
    if (S.mode !== 'playing') {
      // the court stays alive behind the title, draft and end screens
      if (S.stage) rebuildShade();
      return;
    }
    S.stageTime += dt; S.runTime += dt;
    const e = eff();
    const def = S.stage;

    // sun: pointer aims, Q/E nudges, dusk drifts
    if (input.pointerAngle !== null && input.pointerAngle !== undefined) {
      let target = input.pointerAngle;
      let diff = target - S.sunTarget;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      S.sunTarget += clamp(diff, -0.6, 0.6);
    }
    if (input.nudge) S.sunTarget += input.nudge * dt * 1.6;
    if (def.drift) S.sunTarget += def.drift * e.drift * dt;
    let sd = S.sunTarget - S.sun;
    while (sd > Math.PI) sd -= Math.PI * 2;
    while (sd < -Math.PI) sd += Math.PI * 2;
    S.sun += sd * Math.min(1, dt * e.sunSwing * 2.2);

    // movement with axis-separated collision, so the spirit slides around
    // casters instead of sticking to them; statues ('m') are pushed instead
    const p = S.player;
    const hitsCaster = (tx, ty, skip) => {
      for (const c of S.casters) {
        if (c === skip) continue;
        const cp = casterPos(c, S.time);
        if (c.kind === 'w') {
          const qx = clamp(tx, cp.x - c.r * 1.5, cp.x + c.r * 1.5);
          const qy = clamp(ty, cp.y - c.r * 0.55, cp.y + c.r * 0.55);
          if (dist(tx, ty, qx, qy) < p.r - 2) return c;
        } else if (dist(tx, ty, cp.x, cp.y) < c.r + p.r - 2) return c;
      }
      return null;
    };
    const stepMove = (dx, dy) => {
      const tx = clamp(p.x + dx, 26, WORLD.w - 26), ty = clamp(p.y + dy, 26, WORLD.h - 26);
      const hit = hitsCaster(tx, ty, null);
      if (!hit) { p.x = tx; p.y = ty; return true; }
      if (hit.kind === 'm') {
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) hit.x = clamp(hit.x + Math.sign(dx) * Math.abs(dx), 40, WORLD.w - 40);
        else if (dy !== 0) hit.y = clamp(hit.y + Math.sign(dy) * Math.abs(dy), 40, WORLD.h - 40);
        else return false;
        if (!hitsCaster(tx, ty, null)) { p.x = tx; p.y = ty; return true; }
      }
      return false;
    };
    const mx = input.moveX * e.speed * dt, my = input.moveY * e.speed * dt;
    if (mx !== 0 || my !== 0) {
      if (!stepMove(mx, my)) if (!stepMove(mx, 0)) stepMove(0, my);
    }
    if (Math.abs(input.moveX) > 0.1) p.face = Math.sign(input.moveX);
    if (Math.hypot(input.moveX, input.moveY) > 0.1) { p.walk += dt * 10; audio.step(false); }

    updateWraith(dt);
    rebuildShade();

    // light exposure
    S.inShade = shadeAt(p.x, p.y);
    S.inGaze = false;
    if (S.wraith) {
      const gr = S.wraith.radius * e.gazeRadius;
      if (dist(p.x, p.y, S.wraith.x, S.wraith.y) < gr && !S.inShade) S.inGaze = true;
    }
    const burning = !S.inShade;
    if (burning) {
      S.burn += dt * 0.42 * e.burnRate * (S.inGaze ? 1.5 : 1);
      if (Math.random() < dt * 8) { audio.burn(); burst(p.x, p.y - 8, '#ffb37a', 1, 40); }
      if (S.burn >= 1) { die(); return; }
    } else {
      S.burn = Math.max(0, S.burn - dt * 0.8 * e.burnDrain);
    }
    S.burnPeak = Math.max(S.burnPeak, S.burn);

    // crystals
    for (const c of S.crystals) {
      if (!c.got && dist(p.x, p.y, c.x, c.y) < 24) {
        c.got = true; S.crystalsGot++;
        burst(c.x, c.y, '#a8d8ff', 12, 80);
        audio.crystal();
        notify('◆ Shade crystal gathered', '#a8d8ff');
      }
    }
    // the gate
    if (dist(p.x, p.y, def.gate[0], def.gate[1]) < 30) finishStage();
  }

  return { S, save, shadeCanvas: shadeCv, startRun, loadStage, pickGift, reroll, update, eff, shadeAt, casterPos, finishRun, notify,
    stageScene(name) {
      // deterministic staging for screenshots
      if (name === 'dusk') { startRun(1); loadStage(6); S.mode = 'playing'; S.sun = 2.4; S.sunTarget = 2.4; S.player.x = 430; S.player.y = 430; S.burn = 0.25; }
      if (name === 'wraith') { startRun(1); loadStage(11); S.mode = 'playing'; S.sun = -2.0; S.sunTarget = -2.0; S.player.x = 350; S.player.y = 300; if (S.wraith) { S.wraith.x = 700; S.wraith.y = 200; } S.gifts = [GIFTS[0], GIFTS[3]]; }
      if (name === 'draft') { startRun(1); loadStage(2); S.gifts = [GIFTS[0]]; S.mode = 'draft'; S.draftChoices = [GIFTS[1], GIFTS[4], GIFTS[6]]; }
      if (name === 'over') { startRun(1); for (let i = 0; i < 12; i++) S.stageStats.push({ name: STAGES[i].name, chapter: STAGES[i].chapter, time: 30 + i * 3, crystals: 2, ofCrystals: 3, score: 1400 }); S.score = 16800; S.deaths = 2; S.crystalsGot = 24; S.runTime = 512; S.gifts = [GIFTS[0], GIFTS[1], GIFTS[3]]; S.synergies = ['SHADE']; finishRun(true); }
    } };
}
