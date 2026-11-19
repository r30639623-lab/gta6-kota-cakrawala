// input.js — Keyboard + mouse untuk Kota Cakrawala.
// WASD gerak, Shift lari, E masuk/keluar mobil & interaksi, F pukul,
// Spasi rem tangan, Esc/P pause, M bisu. Mouse: drag untuk mengorbit kamera.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // tombol yang baru ditekan sejak frame terakhir
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.anyGesture = false; // true setelah interaksi pertama (untuk menyalakan audio)

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      this.anyGesture = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.anyGesture = true;
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      this.mouseDX += e.clientX - this.lastX;
      this.mouseDY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      this.dragging = true;
      this.lastX = t.clientX;
      this.lastY = t.clientY;
      this.anyGesture = true;
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.dragging) return;
      const t = e.touches[0];
      this.mouseDX += t.clientX - this.lastX;
      this.mouseDY += t.clientY - this.lastY;
      this.lastX = t.clientX;
      this.lastY = t.clientY;
    }, { passive: true });
    canvas.addEventListener('touchend', () => { this.dragging = false; });
  }

  down(code) { return this.keys.has(code); }
  /** True hanya pada frame saat tombol ditekan (sekali per tekanan). */
  tapped(code) { return this.pressed.has(code); }

  /** Gerak maju/mundur dari tombol (W/S atau panah), -1..1. */
  moveAxis() {
    let v = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) v += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) v -= 1;
    return v;
  }

  /** Gerak kiri/kanan (A/D atau panah), -1..1. */
  strafeAxis() {
    let v = 0;
    if (this.down('KeyD') || this.down('ArrowRight')) v += 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) v -= 1;
    return v;
  }

  /** Ambil & nol-kan delta mouse sejak frame terakhir. */
  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  /** Dipanggil akhir tiap frame: tombol "baru ditekan" hanya berlaku satu frame. */
  endFrame() { this.pressed.clear(); }
}
