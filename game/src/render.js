// UMBRA renderer: a courtyard of light and shade. The ground is drawn lit,
// the shade layer (built by the simulation) is blurred over it, then the
// court itself — casters with sunlit caps, the moon gate, crystals, the
// spirit, and the wraith with its burning gaze.

import { WORLD, CHAPTERS } from './config.js';

export function createRenderer(canvas, G) {
  const ctx = canvas.getContext('2d');
  const W = WORLD.w, H = WORLD.h;
  const shadeView = document.createElement('canvas');
  shadeView.width = W / 2; shadeView.height = H / 2;
  const svctx = shadeView.getContext('2d');
  let motes = [];
  for (let i = 0; i < 70; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 1.6, ph: Math.random() * 6.28, sp: 4 + Math.random() * 9 });

  function drawCaster(c, t) {
    const p = G.casterPos(c, t);
    const ch = CHAPTERS[G.S.stage.chapter];
    const lift = c.h * 13;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (c.kind === 'w') {
      ctx.fillStyle = '#4a3f55';
      ctx.fillRect(-c.r * 1.5, -c.r * 0.55 - lift * 0.4, c.r * 3, c.r * 1.1);
      ctx.fillStyle = '#5d5069';
      ctx.fillRect(-c.r * 1.5, -c.r * 0.55 - lift * 0.4, c.r * 3, 7);
      ctx.fillStyle = 'rgba(255,220,160,0.25)';
      ctx.fillRect(-c.r * 1.5, -c.r * 0.55 - lift * 0.4, c.r * 3, 3);
    } else if (c.kind === 's' || c.kind === 'm') {
      ctx.fillStyle = c.kind === 'm' ? '#5a4a68' : '#4a3f55';
      ctx.fillRect(-c.r, -c.r - lift * 0.5, c.r * 2, c.r * 2);
      ctx.fillStyle = c.kind === 'm' ? '#6d5a80' : '#5d5069';
      ctx.fillRect(-c.r, -c.r - lift * 0.5, c.r * 2, 8);
      ctx.fillStyle = ch.accent;
      ctx.beginPath(); ctx.arc(0, -lift * 0.5, 4.5, 0, 6.2832); ctx.fill();
      if (c.kind === 'm') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('↔', 0, c.r + 12); }
    } else if (c.kind === 't') {
      ctx.fillStyle = '#3d2c22';
      ctx.fillRect(-3.5, -4, 7, 14);
      const g = ctx.createRadialGradient(0, -lift, 2, 0, -lift, c.r + 8);
      g.addColorStop(0, '#3f5a3a'); g.addColorStop(0.75, '#2c4429'); g.addColorStop(1, 'rgba(30,46,28,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, -lift, c.r + 8, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,225,160,0.20)';
      ctx.beginPath(); ctx.arc(-c.r * 0.3, -lift - c.r * 0.3, c.r * 0.45, 0, 6.2832); ctx.fill();
    } else {
      ctx.fillStyle = '#4a3f55';
      ctx.beginPath(); ctx.arc(0, 0, c.r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#66587a';
      ctx.beginPath(); ctx.arc(0, -lift * 0.55, c.r * 0.82, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,225,160,0.30)';
      ctx.beginPath(); ctx.arc(-c.r * 0.25, -lift * 0.55 - c.r * 0.25, c.r * 0.3, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  function draw(t, dt) {
    const S = G.S;
    const stage = S.stage ?? { chapter: 0, gate: [1110, 350], name: '' };
    const ch = CHAPTERS[stage.chapter];
    ctx.clearRect(0, 0, W, H);
    // sky-glow backdrop beyond the court
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, ch.sky[0]); sky.addColorStop(0.55, ch.sky[1]); sky.addColorStop(1, ch.sky[2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // the lit court
    const sunSide = ctx.createLinearGradient(Math.cos(S.sun) * -W / 2 + W / 2, Math.sin(S.sun) * -H / 2 + H / 2, Math.cos(S.sun) * W / 2 + W / 2, Math.sin(S.sun) * H / 2 + H / 2);
    sunSide.addColorStop(0, ch.litEdge); sunSide.addColorStop(1, ch.lit);
    ctx.fillStyle = sunSide;
    ctx.fillRect(28, 28, W - 56, H - 56);
    // stone speckle
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let i = 0; i < 130; i++) {
      const x = 40 + ((i * 173) % (W - 90)), y = 40 + ((i * 289) % (H - 90));
      ctx.fillRect(x, y, 3, 2);
    }
    ctx.strokeStyle = 'rgba(255,235,190,0.20)'; ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    {
      // shade layer: tint the simulation's alpha mask with the chapter's
      // shade colour, blur it, and lay it over the lit court
      const src = G.shadeCanvas;
      if (src) {
        svctx.clearRect(0, 0, W / 2, H / 2);
        svctx.globalCompositeOperation = 'source-over';
        svctx.drawImage(src, 0, 0);
        svctx.globalCompositeOperation = 'source-in';
        svctx.fillStyle = ch.shade;
        svctx.fillRect(0, 0, W / 2, H / 2);
        svctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.filter = 'blur(5px)';
        ctx.drawImage(shadeView, -6, -6, W + 12, H + 12);
        ctx.restore();
      }
    }

    // crystals
    for (const c of S.crystals) {
      if (c.got) continue;
      const bob = Math.sin(t * 2.4 + c.bob) * 3;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#bfe0ff';
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(6, 0); ctx.lineTo(0, 10); ctx.lineTo(-6, 0);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(0, -2, 2, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    // the moon gate
    const [gx, gy] = stage.gate;
    ctx.save();
    ctx.translate(gx, gy);
    const pulse = 0.75 + Math.sin(t * 2.2) * 0.25;
    ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 22 * pulse;
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 21, 0, 6.2832); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(6, -5, 12, 0, 6.2832); ctx.fill();
    ctx.fillStyle = ch.ground;
    ctx.globalAlpha = 0.0; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '10px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('THE GATE', 0, 38);
    ctx.restore();

    // casters, depth sorted with the actors
    const drawables = [];
    for (const c of S.casters) drawables.push({ y: c.y + c.r, fn: () => drawCaster(c, t) });
    if (S.wraith) drawables.push({ y: S.wraith.y + 16, fn: () => drawWraith(t) });
    if (S.player) drawables.push({ y: S.player.y + 12, fn: () => drawSpirit(t) });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.fn();

    // particles
    for (const p of S.particles) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // drifting motes in the light
    ctx.fillStyle = ch.mote;
    for (const m of motes) {
      m.x += Math.cos(m.ph) * m.sp * dt * 0.4; m.y += Math.sin(m.ph * 1.3) * m.sp * dt * 0.3 + dt * 2;
      if (m.x > W) m.x = 0; if (m.y > H) m.y = 0;
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 1.4 + m.ph);
      ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // burn vignette
    if (S.burn > 0.03 && S.mode === 'playing') {
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.85);
      v.addColorStop(0, 'rgba(255,90,30,0)');
      v.addColorStop(1, `rgba(255,80,25,${0.45 * S.burn})`);
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    // letterbox vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.02);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function drawSpirit(t) {
    const S = G.S, p = S.player;
    const bob = Math.sin(p.walk) * 2;
    ctx.save();
    ctx.translate(p.x, p.y + bob * 0.4);
    // cloak
    ctx.fillStyle = S.inShade ? '#241d4d' : '#3a2a63';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(11, -6, 9, 10);
    ctx.quadraticCurveTo(4, 13, 0, 12);
    ctx.quadraticCurveTo(-4, 13, -9, 10);
    ctx.quadraticCurveTo(-11, -6, 0, -14);
    ctx.fill();
    // face
    ctx.fillStyle = '#f2e7c9';
    ctx.beginPath(); ctx.arc(p.face * 2.5, -6, 5.2, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#241d4d';
    ctx.beginPath(); ctx.arc(p.face * 2.5 + 1.8, -6.5, 1.1, 0, 6.2832); ctx.arc(p.face * 2.5 - 1.8, -6.5, 1.1, 0, 6.2832); ctx.fill();
    // the shade-aura when safe, embers when burning
    if (S.inShade) {
      ctx.strokeStyle = 'rgba(168,216,255,0.5)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, 17 + Math.sin(t * 3) * 1.5, 0, 6.2832); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,150,70,0.75)';
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, 6.2832); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWraith(t) {
    const S = G.S, w = S.wraith, e = G.eff();
    const r = w.radius * e.gazeRadius;
    ctx.save();
    ctx.translate(w.x, w.y);
    // gaze disc
    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, r);
    g.addColorStop(0, 'rgba(255,170,60,0.30)');
    g.addColorStop(0.8, 'rgba(255,120,40,0.13)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,170,80,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r * (0.92 + Math.sin(t * 2.6) * 0.03), 0, 6.2832); ctx.stroke();
    // body: a hooded sun
    const bob = Math.sin(t * 1.8) * 3;
    ctx.translate(0, bob);
    ctx.shadowColor = '#ffb050'; ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffca7a';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7a3405';
    ctx.beginPath(); ctx.arc(-4.5, -2, 2.2, 0, 6.2832); ctx.arc(4.5, -2, 2.2, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 4.5, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = '#7a3405'; ctx.lineWidth = 1.8; ctx.stroke();
    // rays
    ctx.strokeStyle = 'rgba(255,190,90,0.8)'; ctx.lineWidth = 2.4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832 + t * 0.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
      ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
      ctx.stroke();
    }
    ctx.restore();
    if (w.orbit) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,190,90,0.18)'; ctx.setLineDash([4, 7]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(w.path[0][0], w.path[0][1], w.orbit, w.orbit * 0.72, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }
  }

  return { draw };
}
