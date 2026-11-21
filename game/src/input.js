// input.js — Keyboard + mouse untuk Kota Cakrawala.
// Melacak tombol yang sedang ditekan (down) dan yang baru ditekan
// (pressed, edge-triggered, dikonsumsi sekali per frame).

export function createInput() {
  const down = new Set();
  const pressedQueue = new Set();
  let mouseDX = 0;
  let mouseDY = 0;
  let wheelDelta = 0;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    down.add(e.code);
    pressedQueue.add(e.code);
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    down.delete(e.code);
  });
  window.addEventListener('blur', () => {
    down.clear();
    pressedQueue.clear();
  });
  window.addEventListener('mousemove', (e) => {
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  });
  window.addEventListener('wheel', (e) => {
    wheelDelta += e.deltaY;
  }, { passive: true });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) pressedQueue.add('MouseLeft');
  });

  return {
    isDown(code) {
      return down.has(code);
    },
    pressed(code) {
      return pressedQueue.has(code);
    },
    // Arah jalan: W/S maju-mundur, A/D kiri-kanan (relatif kamera).
    moveAxes() {
      const f = (down.has('KeyW') || down.has('ArrowUp') ? 1 : 0) - (down.has('KeyS') || down.has('ArrowDown') ? 1 : 0);
      const s = (down.has('KeyD') ? 1 : 0) - (down.has('KeyA') ? 1 : 0);
      return { f, s };
    },
    mouseDelta() {
      const out = { dx: mouseDX, dy: mouseDY };
      mouseDX = 0;
      mouseDY = 0;
      return out;
    },
    takeWheel() {
      const w = wheelDelta;
      wheelDelta = 0;
      return w;
    },
    endFrame() {
      pressedQueue.clear();
    },
  };
}
