// UMBRA input: WASD / arrows to walk, the pointer aims the sun (the light
// comes from where you point; shade falls away from it), Q/E nudge the sun,
// R restarts the courtyard, Esc pauses. Touch: left stick walks, a drag on
// the right half aims the sun.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0, moveY: 0,
    pointerAngle: null, // radians, direction the light comes FROM
    nudge: 0,           // -1..1 continuous Q/E rotation
    restart: false, pause: false,
    usingTouch: false,
    stick: null, sunTouch: null,
  };
  const press = (code, down) => {
    if (down) {
      if (code === 'KeyR') state.restart = true;
      if (code === 'Escape') state.pause = true;
      keys.add(code);
    } else keys.delete(code);
  };
  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    press(e.code, true);
  });
  addEventListener('keyup', (e) => press(e.code, false));

  const toLocal = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) * (canvas.width / r.width), y: (clientY - r.top) * (canvas.height / r.height), w: canvas.width, h: canvas.height };
  };
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const p = toLocal(e.clientX, e.clientY);
    state.pointerAngle = Math.atan2(p.y - p.h / 2, p.x - p.w / 2);
  });
  canvas.addEventListener('touchstart', (e) => {
    state.usingTouch = true;
    for (const t of e.changedTouches) {
      const p = toLocal(t.clientX, t.clientY);
      if (p.x < p.w / 2 && !state.stick) state.stick = { id: t.identifier, cx: p.x, cy: p.y, x: p.x, y: p.y };
      else if (!state.sunTouch) state.sunTouch = { id: t.identifier, cx: p.x, cy: p.y };
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      const p = toLocal(t.clientX, t.clientY);
      if (state.stick && t.identifier === state.stick.id) { state.stick.x = p.x; state.stick.y = p.y; }
      if (state.sunTouch && t.identifier === state.sunTouch.id) {
        state.pointerAngle = Math.atan2(p.y - state.sunTouch.cy, p.x - state.sunTouch.cx);
      }
    }
    e.preventDefault();
  }, { passive: false });
  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (state.stick && t.identifier === state.stick.id) state.stick = null;
      if (state.sunTouch && t.identifier === state.sunTouch.id) state.sunTouch = null;
    }
  };
  canvas.addEventListener('touchend', endTouch);
  canvas.addEventListener('touchcancel', endTouch);

  state.poll = () => {
    let x = 0, y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (state.stick) {
      const dx = (state.stick.x - state.stick.cx) / 46, dy = (state.stick.y - state.stick.cy) / 46;
      if (Math.hypot(dx, dy) > 0.18) { x += dx; y += dy; }
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    state.moveX = x; state.moveY = y;
    state.nudge = (keys.has('KeyQ') ? -1 : 0) + (keys.has('KeyE') ? 1 : 0);
    const out = { restart: state.restart, pause: state.pause };
    state.restart = false; state.pause = false;
    return out;
  };
  return state;
}
