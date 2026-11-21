// dialogue.js — Dialog misi berwajah Kota Cakrawala (round 8 rebuild).
// Kotak dialog di bawah layar + portrait prosedural di kanvas
// (Bu Sari, Raka, Yoga, Lia, Bima). show(name, text, durasiMs) antre;
// E / klik lanjut; durasi habis = lanjut otomatis. Timer misi dijeda
// saat dialog terbuka. Semua wajah digambar dari bentuk sederhana
// (kerudung, topi, kacamata, kumis) — tanpa foto atau aset luar.

export function createDialogue() {
  const box = document.getElementById('dialogue');
  const faceCanvas = document.getElementById('dialogue-face');
  const nameEl = document.getElementById('dialogue-name');
  const textEl = document.getElementById('dialogue-text');
  const ctx = faceCanvas ? faceCanvas.getContext('2d') : null;
  let open = false;
  let queue = [];
  let timer = Infinity;

  function drawFace(name) {
    if (!ctx) return;
    ctx.clearRect(0, 0, 72, 72);
    const faces = {
      'Bu Sari': { bg: '#7b2d8b', skin: '#e8b98a', top: 'scarf', topColor: '#5b2d8a' },
      Raka: { bg: '#123a5c', skin: '#e8b98a', top: 'cap', topColor: '#c0392b' },
      Yoga: { bg: '#1d5c2e', skin: '#d9a06b', top: 'cap', topColor: '#2ec4b6' },
      Lia: { bg: '#8a2d5c', skin: '#f0c090', top: 'hair', topColor: '#2b1a12' },
      Bima: { bg: '#1d3a5c', skin: '#d9a06b', top: 'cap', topColor: '#111111' },
    };
    const f = faces[name] || faces['Bu Sari'];
    ctx.fillStyle = f.bg;
    ctx.fillRect(0, 0, 72, 72);
    // Wajah.
    ctx.fillStyle = f.skin;
    ctx.beginPath();
    ctx.arc(36, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    // Rambut / penutup kepala.
    ctx.fillStyle = f.topColor;
    if (f.top === 'scarf') {
      ctx.beginPath();
      ctx.arc(36, 32, 21, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(15, 30, 42, 9);
    } else if (f.top === 'cap') {
      ctx.beginPath();
      ctx.arc(36, 32, 20, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(36, 30, 22, 6);
    } else {
      ctx.beginPath();
      ctx.arc(36, 30, 20, Math.PI, 0);
      ctx.fill();
    }
    // Mata.
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(28, 40, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(44, 40, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (name === 'Bima') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(20, 36, 14, 7);
      ctx.fillRect(38, 36, 14, 7);
    }
    if (name === 'Yoga') {
      ctx.fillStyle = '#222222';
      ctx.fillRect(28, 50, 16, 3);
    }
    // Senyum.
    ctx.strokeStyle = '#7a3b1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(36, 48, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  function showNext() {
    if (queue.length === 0) {
      open = false;
      if (box) box.style.display = 'none';
      return;
    }
    const next = queue.shift();
    drawFace(next.name);
    if (nameEl) nameEl.textContent = next.name;
    if (textEl) textEl.textContent = next.text;
    if (box) box.style.display = 'block';
    open = true;
    timer = next.durationMs / 1000;
  }

  return {
    get isOpen() {
      return open;
    },
    show(name, text, durationMs = Infinity) {
      queue.push({ name, text, durationMs });
      if (!open) showNext();
    },
    advance() {
      if (open) showNext();
    },
    update(dt) {
      if (!open) return;
      timer -= dt;
      if (timer <= 0) showNext();
    },
  };
}
