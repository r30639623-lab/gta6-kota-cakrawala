// input.js — Keyboard + mouse Kota Cakrawala.
// Bedakan tombol yang masih ditekan (down) dari yang BARU ditekan di
// frame ini (pressed) — pressed dikonsumsi sekali, lalu dibersihkan
// tiap akhir frame supaya satu tekanan tidak memicu aksi dua kali.

export function createInput() {
  const held = new Set();
  const fresh = new Set();
  let moveX = 0;
  let moveY = 0;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    held.add(e.code);
    fresh.add(e.code);
    if (e.code === 'Space' || e.code === 'Tab' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
  });
  window.addEventListener('blur', () => {
    held.clear();
    fresh.clear();
  });
  window.addEventListener('mousemove', (e) => {
    moveX += e.movementX || 0;
    moveY += e.movementY || 0;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) fresh.add('MouseLeft');
  });

  return {
    isDown(code) {
      return held.has(code);
    },
    pressed(code) {
      return fresh.has(code);
    },
    // Arah gerak pejalan kaki: W/S maju-mundur, A/D geser (relatif kamera).
    moveAxes() {
      const f = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0) - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0);
      const s = (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0);
      return { f, s };
    },
    mouseDelta() {
      const out = { dx: moveX, dy: moveY };
      moveX = 0;
      moveY = 0;
      return out;
    },
    endFrame() {
      fresh.clear();
    },
  };
}
