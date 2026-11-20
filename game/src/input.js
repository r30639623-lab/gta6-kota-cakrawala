// input.js — Keyboard + mouse state.
export function createInput() {
  const keys = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;
  let wheelDelta = 0;

  function onKeyDown(e) {
    if (e.code === 'Tab') e.preventDefault();
    keys.add(e.code);
  }
  function onKeyUp(e) { keys.delete(e.code); }
  function onMouseMove(e) { mouseX = e.clientX; mouseY = e.clientY; }
  function onMouseDown(e) { mouseDown = true; }
  function onMouseUp(e) { mouseDown = false; }
  function onWheel(e) { wheelDelta += e.deltaY; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('wheel', onWheel);

  return {
    isDown(code) { return keys.has(code); },
    pressed(code) {
      if (keys.has(code)) { keys.delete(code); return true; }
      return false;
    },
    get mouse() { return { x: mouseX, y: mouseY, down: mouseDown }; },
    takeWheel() { const d = wheelDelta; wheelDelta = 0; return d; },
    clear() { keys.clear(); },
  };
}
