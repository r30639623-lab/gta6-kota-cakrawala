// phone.js — HP Raka (tombol P): Peta besar + waypoint (klik),
// daftar Job sampingan + balapan, Bank (uang & total), dan Pesan dari
// Bu Sari & kru. Panel dibuka di atas game; dunia dijeda saat HP terbuka.

import { SIDE_JOBS, RACE } from './sidejobs.js';

export function createPhone(save, api) {
  const panel = document.getElementById('phone-panel');
  const mapCanvas = document.getElementById('phone-map');
  const mapCtx = mapCanvas.getContext('2d');
  const jobsPage = document.getElementById('phone-page-jobs');
  const bankPage = document.getElementById('phone-page-bank');
  const msgsPage = document.getElementById('phone-page-msgs');
  let opened = false;
  let tab = 'map';
  const messages = [
    { from: 'Bu Sari', text: 'Raka, selamat datang di Kota Cakrawala! Bicara sama aku di depan bengkel buat mulai misi. Kru bengkel siap bantu: Yoga, Lia, Bima.' },
    { from: 'Yoga (Montir)', text: 'Mobil rusak? Tekan Z, aku perbaiki dari jauh. Jangan lupa servis di garasi juga.' },
    { from: 'Lia (Supir)', text: 'Polisi nempel terus? Tekan X, aku gantiin plat nomormu. Wanted langsung turun.' },
    { from: 'Bima (Pengintai)', text: 'Tekan C dan aku tandai semua polisi di peta selama 20 detik. Jangan kejar-kejaran buta!' },
  ];

  function addMessage(from, text) {
    messages.unshift({ from, text });
    if (messages.length > 12) messages.pop();
    if (opened && tab === 'msgs') renderMsgs();
  }

  function drawMap(snap) {
    const W = 400;
    const H = 400;
    const scale = W / 680;
    const toMap = (x, z) => [200 + x * scale, 200 + z * scale];
    mapCtx.fillStyle = 'rgba(10,16,10,0.9)';
    mapCtx.fillRect(0, 0, W, H);
    mapCtx.fillStyle = '#1e6f8e';
    mapCtx.fillRect(0, toMap(0, 300)[1], W, H - toMap(0, 300)[1]);
    mapCtx.fillStyle = '#d9c28a';
    mapCtx.fillRect(0, toMap(0, 290)[1], W, toMap(0, 300)[1] - toMap(0, 290)[1]);
    mapCtx.strokeStyle = '#5a6068';
    mapCtx.lineWidth = 4;
    for (const s of [-280, -200, -120, -40, 40, 120, 200, 280]) {
      const [x1] = toMap(s, 0);
      mapCtx.beginPath();
      mapCtx.moveTo(x1, 0);
      mapCtx.lineTo(x1, H);
      mapCtx.stroke();
      const [, y1] = toMap(0, s);
      mapCtx.beginPath();
      mapCtx.moveTo(0, y1);
      mapCtx.lineTo(W, y1);
      mapCtx.stroke();
    }
    mapCtx.fillStyle = 'rgba(255,255,255,0.65)';
    mapCtx.font = '12px sans-serif';
    mapCtx.textAlign = 'center';
    for (const [name, x, z] of [
      ['Pusat', 0, -30], ['Pasar', -120, 60], ['Pelabuhan', 250, 330],
      ['Pantai', 0, 318], ['Bengkel', -222, 252],
    ]) {
      const [mx, my] = toMap(x, z);
      mapCtx.fillText(name, mx, my - 10);
    }
    const drawDot = (x, z, color, r = 4) => {
      const [mx, my] = toMap(x, z);
      mapCtx.fillStyle = color;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, r, 0, Math.PI * 2);
      mapCtx.fill();
    };
    drawDot(0, -30, '#ffd23f', 5);
    drawDot(-120, 60, '#ff7fa8');
    drawDot(120, -120, '#ffffff');
    drawDot(-222, 252, '#2ec4b6');
    drawDot(250, 360, '#ff9e57');
    mapCtx.fillStyle = '#2ee6ff';
    mapCtx.font = 'bold 13px sans-serif';
    for (const g of snap.garages || []) {
      const [mx, my] = toMap(g.x, g.z);
      mapCtx.fillText('G', mx, my + 4);
    }
    if (snap.relicDots) {
      mapCtx.fillStyle = '#ffd23f';
      for (const [x, z] of snap.relicDots) {
        const [mx, my] = toMap(x, z);
        mapCtx.fillRect(mx - 1.5, my - 1.5, 3, 3);
      }
    }
    if (snap.missionTarget) {
      const [mx, my] = toMap(snap.missionTarget.x, snap.missionTarget.z);
      mapCtx.strokeStyle = '#ffd23f';
      mapCtx.lineWidth = 3;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 10, 0, Math.PI * 2);
      mapCtx.stroke();
    }
    if (snap.jobTarget) {
      const [mx, my] = toMap(snap.jobTarget.x, snap.jobTarget.z);
      mapCtx.strokeStyle = '#2ee6ff';
      mapCtx.lineWidth = 3;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 10, 0, Math.PI * 2);
      mapCtx.stroke();
    }
    if (snap.policeCars) {
      mapCtx.fillStyle = snap.reveal ? '#ff2222' : '#4488ff';
      for (const c of snap.policeCars) {
        const [mx, my] = toMap(c.x, c.z);
        mapCtx.beginPath();
        mapCtx.arc(mx, my, 4, 0, Math.PI * 2);
        mapCtx.fill();
      }
    }
    if (snap.heli) {
      const [mx, my] = toMap(snap.heli.x, snap.heli.z);
      mapCtx.fillStyle = '#ff4444';
      mapCtx.font = 'bold 15px sans-serif';
      mapCtx.fillText('H', mx, my + 5);
    }
    if (snap.waypoint) {
      const [px, py] = toMap(snap.playerPos.x, snap.playerPos.z);
      const [wx, wy] = toMap(snap.waypoint.x, snap.waypoint.z);
      mapCtx.strokeStyle = '#ffd23f';
      mapCtx.lineWidth = 2;
      mapCtx.setLineDash([6, 4]);
      mapCtx.beginPath();
      mapCtx.moveTo(px, py);
      mapCtx.lineTo(wx, wy);
      mapCtx.stroke();
      mapCtx.setLineDash([]);
      mapCtx.fillStyle = '#ffd23f';
      mapCtx.beginPath();
      mapCtx.arc(wx, wy, 5, 0, Math.PI * 2);
      mapCtx.fill();
    }
    const [px, py] = toMap(snap.playerPos.x, snap.playerPos.z);
    mapCtx.save();
    mapCtx.translate(px, py);
    mapCtx.rotate(snap.heading);
    mapCtx.fillStyle = '#ffffff';
    mapCtx.beginPath();
    mapCtx.moveTo(0, -8);
    mapCtx.lineTo(6, 7);
    mapCtx.lineTo(-6, 7);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();
  }

  function renderJobs() {
    let html = '<h3>Side Job</h3>';
    for (const j of SIDE_JOBS) {
      const done = save.sideJobsDone.includes(j.id);
      const busy = api.sideJobActive();
      html += `<div class="phone-job"><span>${done ? '✓ ' : ''}${j.name}<br><small>${j.desc} — $${j.reward} • ${j.time} dtk</small></span><button data-job="${j.id}" ${done || busy ? 'disabled' : ''}>${done ? 'Selesai' : 'Ambil'}</button></div>`;
    }
    html += '<h3>Balapan Jalanan</h3>';
    const best = save.raceBest === null ? 'belum ada rekor' : `rekor ${Math.floor(save.raceBest)} dtk`;
    html += `<div class="phone-job"><span>🏁 ${RACE.name}<br><small>5 checkpoint • $${RACE.reward} • ${best}</small></span><button data-race="1" ${api.sideJobActive() ? 'disabled' : ''}>Mulai</button></div>`;
    jobsPage.innerHTML = html;
    jobsPage.querySelectorAll('button[data-job]').forEach((b) => {
      b.addEventListener('click', () => {
        if (api.startJob(b.dataset.job)) {
          close();
        }
      });
    });
    const raceBtn = jobsPage.querySelector('button[data-race]');
    if (raceBtn) {
      raceBtn.addEventListener('click', () => {
        if (api.startRace()) close();
      });
    }
  }

  function renderBank() {
    bankPage.innerHTML = `
      <h3>Bank Cakrawala</h3>
      <p>Saldo: <b style="color:#7dff9a">$${save.money}</b></p>
      <p>Total penghasilan: $${save.totalEarned || 0}</p>
      <p>Ditangkap polisi: ${save.busted || 0}x</p>
      <p>Rekor ${RACE.name}: ${save.raceBest === null ? '—' : Math.floor(save.raceBest) + ' dtk'}</p>
      <p>Side job selesai: ${save.sideJobsDone.length}/3</p>`;
  }

  function renderMsgs() {
    let html = '<h3>Pesan</h3>';
    for (const m of messages) {
      html += `<div class="msg"><b>${m.from}:</b><br>${m.text}</div>`;
    }
    msgsPage.innerHTML = html;
  }

  function showTab(name) {
    tab = name;
    document.querySelectorAll('.phone-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.getElementById('phone-page-map').style.display = name === 'map' ? 'block' : 'none';
    jobsPage.style.display = name === 'jobs' ? 'block' : 'none';
    bankPage.style.display = name === 'bank' ? 'block' : 'none';
    msgsPage.style.display = name === 'msgs' ? 'block' : 'none';
    if (name === 'jobs') renderJobs();
    if (name === 'bank') renderBank();
    if (name === 'msgs') renderMsgs();
    if (name === 'map' && api.getSnapshot) {
      const s = api.getSnapshot();
      if (s) drawMap(s);
    }
  }

  document.querySelectorAll('.phone-tab').forEach((t) => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
  });
  document.getElementById('btn-close-phone').addEventListener('click', () => close());
  mapCanvas.addEventListener('click', (e) => {
    const rect = mapCanvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 400;
    const py = ((e.clientY - rect.top) / rect.height) * 400;
    const wx = Math.round((px - 200) / (400 / 680));
    const wz = Math.round((py - 200) / (400 / 680));
    const cur = api.getWaypoint();
    if (cur && Math.hypot(cur.x - wx, cur.z - wz) < 20) {
      api.setWaypoint(null);
    } else {
      api.setWaypoint({ x: wx, z: wz });
    }
    if (api.onWaypoint) api.onWaypoint();
  });

  function open() {
    opened = true;
    showTab('map');
    panel.style.display = 'block';
    // Dunia beku saat HP terbuka, jadi gambar peta sekali dari snapshot terakhir.
    if (api.getSnapshot) {
      const s = api.getSnapshot();
      if (s) drawMap(s);
    }
  }
  function close() {
    opened = false;
    panel.style.display = 'none';
  }

  return {
    get isOpen() {
      return opened;
    },
    open,
    close,
    addMessage,
    drawMap,
    renderJobs,
  };
}
