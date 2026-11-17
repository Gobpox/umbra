// UMBRA bootstrap: wires the simulation, renderer, screens and HUD, and
// runs the fixed-step loop. Also stages deterministic scenes for the
// maker's screenshots under ?shot=<name>.

import { createGame } from './game.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { CHAPTERS, SEASONS, STAGES, GIFTS, SYNERGIES, FEATS } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cv');
const audio = createAudio();
const G = createGame(audio);
const renderer = createRenderer(canvas, G);
const input = createInput(canvas);
const S = G.S;
const save = G.save;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const fmtTime = (s) => `${(s / 60) | 0}:${String((s % 60) | 0).padStart(2, '0')}`;
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
let selectedSeason = save.best && Object.keys(save.best).length ? 1 : 1;
let bannerT = 0, lastStageIdx = -1, soundOn = true;

audio.setVolumes(save.settings.music, save.settings.sfx);
$('vol-music').value = save.settings.music * 100;
$('vol-sfx').value = save.settings.sfx * 100;

// ————— title —————
function renderSeasons() {
  $('season-row').innerHTML = SEASONS.map((s, i) => {
    const best = save.best[s.id];
    return `<button class="season ${i === selectedSeason ? 'sel' : ''}" data-season="${i}">
      <div class="stag">${s.tag} · SCORE ×${s.mult}</div>
      <div class="sname">${s.name}</div>
      <div class="sdesc">${s.desc}</div>
      <div class="sbest">${best ? `BEST ◆ ${fmtNum(best.score)} · GRADE ${best.grade}` : 'NO CROSSING YET'}</div>
    </button>`;
  }).join('');
  for (const el of document.querySelectorAll('[data-season]')) el.onclick = () => { selectedSeason = +el.dataset.season; audio.unlock(); audio.click(); renderSeasons(); };
}
function renderTitleStrip() {
  const featsGot = FEATS.filter((f) => save.feats[f.id]).length;
  const last = save.lastRuns?.[0];
  $('title-strip').innerHTML =
    `FEATS <b>${featsGot}/${FEATS.length}</b>` +
    (last ? ` · LAST CROSSING <b>${fmtNum(last.score)}</b> (${last.season}, grade ${last.grade})` : ' · NO CROSSING YET — THE COURT WAITS');
}
function showTitle() {
  S.mode = 'title';
  $('title').classList.remove('hidden');
  $('hud').classList.add('hidden');
  $('draft').classList.add('hidden');
  $('over').classList.add('hidden');
  renderSeasons(); renderTitleStrip();
  // a living diorama behind the poster: stage 1 with a slow sun
  if (!S.stage) G.loadStage(0);
}
$('btn-play').onclick = () => { audio.unlock(); audio.click(); startRun(); };
function startRun() {
  $('title').classList.add('hidden');
  $('over').classList.add('hidden');
  $('hud').classList.remove('hidden');
  G.startRun(selectedSeason);
  lastStageIdx = -1;
  bannerT = 2.6;
}
$('btn-how').onclick = () => { audio.unlock(); $('howto').classList.remove('hidden'); };
$('btn-how-back').onclick = () => $('howto').classList.add('hidden');
$('btn-sound').onclick = (e) => {
  soundOn = !soundOn;
  audio.setVolumes(soundOn ? save.settings.music : 0, soundOn ? save.settings.sfx : 0);
  e.target.textContent = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
};

// ————— draft —————
function renderDraft() {
  $('draft').classList.remove('hidden');
  const next = STAGES[S.stageIdx + 1];
  $('draft-head').textContent = `${CHAPTERS[S.stage.chapter].name} · COURTYARD ${ROMAN[S.stageIdx]} KEPT`;
  $('draft-embers').textContent = S.embers;
  $('draft-cards').innerHTML = (S.draftChoices ?? []).map((g) => {
    const famCount = S.gifts.filter((x) => x.fam === g.fam).length;
    const wakes = famCount === 1 ? `☉ WAKES ${SYNERGIES[g.fam].name}` : famCount >= 2 ? 'family awake' : 'first of its family';
    return `<button class="dcard" data-gift="${g.id}">
      <div class="fam ${g.fam}">${g.fam} · ${famCount}/2</div>
      <div class="icon">${g.icon}</div>
      <div class="gname">${g.name}</div>
      <div class="gdesc">${g.desc}</div>
      <div class="wakes">${wakes}</div>
      <div class="take">TAKE · CLICK</div>
    </button>`;
  }).join('');
  for (const el of document.querySelectorAll('[data-gift]')) el.onclick = () => { G.pickGift(el.dataset.gift); bannerT = 2.2; };
  $('draft-next').innerHTML = next
    ? `Next · <b>${next.name}</b> — ${CHAPTERS[next.chapter].name} · par ${next.par}s · ${next.crystals.length} crystals${next.wraith ? ' · <span style="color:#ffab6b">the Sunwraith walks</span>' : ''}${next.drift ? ' · <span style="color:#ffab6b">the sun drifts</span>' : ''}`
    : '';
  $('btn-reroll').textContent = S.rerolled ? 'REROLLED' : `↻ REROLL · 20 ✦ (you hold ${S.embers})`;
  $('btn-reroll').style.opacity = S.rerolled || S.embers < 20 ? 0.45 : 1;
}
$('btn-reroll').onclick = () => { G.reroll(); renderDraft(); };

// ————— end screen —————
function renderOver() {
  const o = S.over;
  if (!o) return;
  $('over-title').textContent = o.won ? 'THE LAST GATE OPENS' : 'THE LIGHT PREVAILS';
  $('over-sub').textContent = o.won
    ? `Twelve courtyards crossed on the ${S.season.name} season. The shade road is walked.`
    : 'The run ends in the light.';
  $('over-grade').textContent = o.grade;
  $('over-season').textContent = S.season.name;
  $('over-score').textContent = fmtNum(S.score);
  $('over-best').textContent = o.isBest ? '★ NEW BEST' : '';
  $('ov-courts').textContent = `${S.stageStats.length}/12`;
  $('ov-crystals').textContent = S.crystalsGot;
  $('ov-time').textContent = fmtTime(S.runTime);
  $('ov-deaths').textContent = S.deaths;
  $('ov-gifts').textContent = S.gifts.length;
  $('ov-syn').textContent = S.synergies.length;
  const maxBar = Math.max(1, ...S.stageStats.map((s) => s.score));
  const chColors = ['#ffcf87', '#fff3c4', '#ffab6b', '#a8d8ff'];
  $('chart').innerHTML = S.stageStats.map((s) => `<div class="bar" style="height:${Math.max(4, (s.score / maxBar) * 100)}%;background:${chColors[s.chapter]}" title="${s.name}"><span>${fmtNum(s.score)}</span></div>`).join('');
  $('over-build').innerHTML =
    S.gifts.map((g) => `<span class="chip">${g.icon} ${g.name}</span>`).join('') +
    S.synergies.map((f) => `<span class="chip syn">☉ ${SYNERGIES[f].name}</span>`).join('') ||
    '<span class="chip">no gifts — the bare road</span>';
  const featsNew = S.newFeats.length ? `<br>✦ New feats: ${S.newFeats.map((id) => FEATS.find((f) => f.id === id)?.name).join(' · ')}` : '';
  $('over-runs').innerHTML =
    (save.lastRuns ?? []).map((r) => `<b>${r.grade}</b> ${fmtNum(r.score)} · ${r.season} · ${fmtTime(r.time)}`).join(' &nbsp;·&nbsp; ') + featsNew;
  $('draft').classList.add('hidden');
  $('over').classList.remove('hidden');
}
$('btn-again').onclick = () => { audio.click(); startRun(); };
$('btn-menu').onclick = () => { audio.click(); showTitle(); };

// ————— pause —————
function togglePause(force) {
  const show = force ?? $('pause').classList.contains('hidden');
  if (S.mode !== 'playing' && show) return;
  $('pause').classList.toggle('hidden', !show);
  S.paused = show;
}
$('btn-resume').onclick = () => togglePause(false);
$('btn-restart-run').onclick = () => { togglePause(false); startRun(); };
$('btn-quit').onclick = () => { togglePause(false); audio.setHum(false); showTitle(); };
$('btn-wipe').onclick = (e) => {
  if (e.target.dataset.armed) { localStorage.removeItem('umbra-save-v1'); location.reload(); }
  e.target.dataset.armed = '1'; e.target.textContent = 'ARE YOU SURE? CLICK AGAIN';
};
$('vol-music').oninput = (e) => { save.settings.music = e.target.value / 100; audio.setVolumes(save.settings.music, save.settings.sfx); localStorage.setItem('umbra-save-v1', JSON.stringify(save)); };
$('vol-sfx').oninput = (e) => { save.settings.sfx = e.target.value / 100; audio.setVolumes(save.settings.music, save.settings.sfx); localStorage.setItem('umbra-save-v1', JSON.stringify(save)); };
$('t-pause').onclick = () => togglePause();
$('t-restart').onclick = () => { if (S.mode === 'playing') { G.loadStage(S.stageIdx); S.deaths++; } };

// ————— HUD —————
const dial = $('sun-dial').getContext('2d');
function renderHUD() {
  if (!S.stage) return;
  $('hud-watch').textContent = `WATCH ${ROMAN[S.stageIdx]} · ${S.stage.name.toUpperCase()}`;
  $('hud-score').textContent = fmtNum(S.score);
  $('hud-crystals').textContent = S.crystalsGot;
  $('hud-embers').textContent = S.embers;
  $('hud-time').textContent = fmtTime(S.stageTime);
  $('hud-season').textContent = `${S.season.name} · score ×${S.season.mult}`;
  const burnPct = Math.round(S.burn * 100);
  $('burnfill').style.width = burnPct + '%';
  $('burnlabel').textContent = S.inGaze ? 'THE GAZE — BURNING FAST' : S.inShade ? 'SHADE — SAFE' : S.burn > 0.02 ? `IN THE LIGHT — BURNING ${burnPct}%` : 'IN THE LIGHT — BURNING';
  $('burnlabel').style.color = S.inShade ? '#a8ffd8' : '#ff9a5c';
  const boss = $('hud-boss');
  if (S.wraith) {
    boss.classList.remove('hidden');
    $('boss-name').textContent = S.stageIdx === 11 ? 'THE GREAT SUNWRAITH' : 'THE SUNWRAITH WALKS';
    $('boss-note').textContent = S.stageIdx === 11 ? 'It circles the court forever. Cross between its sweeps.' : 'Its gaze burns in the open — stay in shade when it nears.';
  } else boss.classList.add('hidden');
  $('gifts-row').innerHTML = S.gifts.map((g) => `<div class="gift-chip ${S.synergies.includes(g.fam) ? 'syn' : ''}" title="${g.name}">${g.icon}</div>`).join('');
  $('notes').innerHTML = S.notes.map((n) => `<div class="note" style="border-left-color:${n.color};color:${n.color}">${n.text}</div>`).join('');
  // sun dial
  dial.clearRect(0, 0, 64, 64);
  dial.strokeStyle = 'rgba(255,207,135,0.4)'; dial.lineWidth = 1.5;
  dial.beginPath(); dial.arc(32, 32, 26, 0, 6.2832); dial.stroke();
  const sx = 32 + Math.cos(S.sun) * 20, sy = 32 + Math.sin(S.sun) * 20;
  dial.strokeStyle = '#ffcf87'; dial.lineWidth = 2;
  dial.beginPath(); dial.moveTo(32, 32); dial.lineTo(sx, sy); dial.stroke();
  dial.fillStyle = '#ffdf9e';
  dial.beginPath(); dial.arc(sx, sy, 5, 0, 6.2832); dial.fill();
  dial.fillStyle = 'rgba(242,231,201,0.75)'; dial.font = '8px Georgia'; dial.textAlign = 'center';
  dial.fillText('SUN', 32, 60);
  // stage banner
  if (bannerT > 0 && S.mode === 'playing') {
    $('stage-banner').classList.remove('hidden');
    $('sb-name').textContent = S.stage.name;
    $('sb-sub').textContent = `${CHAPTERS[S.stage.chapter].name} · ${CHAPTERS[S.stage.chapter].sub.toUpperCase()} · PAR ${S.stage.par}s`;
  } else $('stage-banner').classList.add('hidden');
}

// ————— loop —————
let last = performance.now(), acc = 0, hudClock = 0, wasMode = 'title';
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  acc += dt;
  const flags = input.poll();
  if (flags.pause && S.mode === 'playing') togglePause();
  if (flags.restart && S.mode === 'playing' && !S.paused) { G.loadStage(S.stageIdx); S.deaths++; }
  if (!S.paused) {
    while (acc > 1 / 120) { G.update(1 / 120, input); acc -= 1 / 120; }
  }
  if (bannerT > 0) bannerT -= dt;
  if (S.mode === 'title' && S.stage) { S.time += dt; S.sunTarget += dt * 0.05; let sd = S.sunTarget - S.sun; S.sun += sd * Math.min(1, dt * 2); G.update(0, input); }
  if (S.mode === 'draft' && wasMode !== 'draft') renderDraft();
  if (S.mode !== 'draft' && wasMode === 'draft') $('draft').classList.add('hidden');
  if (S.mode === 'over' && wasMode !== 'over') renderOver();
  if (S.mode === 'playing' && S.stageIdx !== lastStageIdx) { lastStageIdx = S.stageIdx; }
  wasMode = S.mode;
  hudClock += dt;
  if (hudClock > 0.12 && S.mode !== 'title') { renderHUD(); hudClock = 0; }
  renderer.draw(S.time, dt);
  if (S.shake > 0) canvas.style.transform = `translate(${(Math.random() - 0.5) * 7 * S.shake}px, ${(Math.random() - 0.5) * 7 * S.shake}px)`;
  else canvas.style.transform = '';
}
showTitle();
requestAnimationFrame(frame);

// ————— screenshot staging —————
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  localStorage.removeItem('umbra-save-v1');
  if (shot === 'title') { /* poster over the living court */ G.loadStage(0); S.sun = -0.5; }
  else {
    $('title').classList.add('hidden');
    $('hud').classList.remove('hidden');
    G.stageScene(shot);
    if (shot === 'draft') renderDraft(), $('draft').classList.remove('hidden'), $('hud').classList.add('hidden');
    if (shot === 'over') renderOver();
    bannerT = 0;
    renderHUD();
  }
}
if (new URLSearchParams(location.search).get('debug')) window.__umbra = G;
