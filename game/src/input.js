// input.js — keyboard + mouse state for Kota Cakrawala.
// Tracks held keys and edge-triggered presses so the game loop can poll
// without juggling DOM listeners everywhere else.
export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') e.preventDefault();
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mousedown', () => {
    mouse.down = true;
    mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });

  return {
    held,
    mouse,
    isDown(code) { return held.has(code); },
    // True once, on the frame the key went down. Consumed by the caller.
    wasPressed(code) { return pressed.has(code); },
    consume(code) { pressed.delete(code); },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
