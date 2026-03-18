// js/ui.js
// Screen navigation, notifications, splash messages, stars background,
// and shared render helpers (kart position, place badge, stats bar).

// ── Screen routing ────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  G.screen = name;
}

// ── Stars background ─────────────────────────────────────────

function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.5 + .5;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${2+Math.random()*4}s;--del:${Math.random()*4}s`;
    container.appendChild(s);
  }
}

// ── Notifications ─────────────────────────────────────────────

let notifTO = null;

function showNotif(msg) {
  document.querySelector('.notif')?.remove();
  if (notifTO) clearTimeout(notifTO);
  const el = document.createElement('div');
  el.className = 'notif';
  el.textContent = msg;
  document.body.appendChild(el);
  notifTO = setTimeout(() => el?.remove(), 3500);
}

function showSplash(item) {
  document.querySelector('.powerup-splash')?.remove();
  const el = document.createElement('div');
  el.className = 'powerup-splash';
  el.innerHTML = `<span class="splash-icon">${item.emoji}</span><div class="splash-name">${item.name}</div><div class="splash-desc">${item.desc}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 2400);
}

// ── Kart & race render helpers ────────────────────────────────

function setKartPos(id, pct) {
  const k = document.getElementById('kart-' + id);
  if (k) k.style.left = Math.min(97, Math.max(2, pct)) + '%';
}

function setKartFX(id, boosted, slowed) {
  const k = document.getElementById('kart-' + id);
  if (!k) return;
  k.classList.toggle('boosted', boosted);
  k.classList.toggle('slowed', slowed);
}

function updateStatsBar() {
  document.getElementById('stat-wpm').textContent = G.wpm;
  document.getElementById('stat-acc').textContent = G.accuracy + '%';
  document.getElementById('progress-bar').style.width = G.position.toFixed(1) + '%';
}

function updatePlaceBadge() {
  const onlineRacers = Object.entries(G.onlinePlayers).map(([pid, p]) => ({ id:pid, pos:p.position }));
  const all = [
    { id:'player', pos:G.position },
    ...G.bots.map(b => ({ id:b.char.id, pos:b.position })),
    ...onlineRacers,
  ].sort((a, b) => b.pos - a.pos);

  const pi = all.findIndex(p => p.id === 'player');
  const badge = document.getElementById('place-badge');
  badge.textContent = PLACE_LABELS[pi] || `${pi+1}TH`;
  badge.className = 'place-badge ' + (PLACE_CLASSES[pi] || 'p4');

  all.forEach((p, i) => {
    const k = document.getElementById('kart-' + p.id);
    if (!k) return;
    let pip = k.querySelector('.place-pip');
    if (!pip) { pip = document.createElement('div'); pip.className = 'place-pip'; k.appendChild(pip); }
    pip.textContent = PLACE_LABELS[i] || `${i+1}`;
    pip.style.background = i===0 ? '#ffd700' : i===1 ? '#b0b0b0' : i===2 ? '#cd7f32' : '#333';
    pip.style.color = i < 2 ? '#000' : '#fff';
  });
}

function updateElapsed() {
  if (!G.raceStartTime) return;
  document.getElementById('race-elapsed').textContent = formatTime((performance.now() - G.raceStartTime) / 1000);
}

function updateTimerBar(elapsed) {
  const remaining = Math.max(0, G.matchDuration - elapsed);
  const pct = (remaining / G.matchDuration) * 100;
  const bar = document.getElementById('race-timer-bar');
  const lbl = document.getElementById('race-timer-label');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = remaining < 30 ? '#e74c3c' : '#4a9fe0'; }
  if (lbl) lbl.textContent = 'TIME LEFT: ' + formatTime(remaining);
}

function updateItemDisplay() {
  const s = document.getElementById('item-slot');
  if (!s) return;
  if (G.heldItem) {
    s.className = 'item-slot';
    s.textContent = G.heldItem.emoji;
    s.title = G.heldItem.name + ' — ' + G.heldItem.desc;
  } else {
    s.className = 'item-slot empty';
    s.textContent = 'ITEM';
    s.title = 'No item';
  }
}

function markBoxUsed(rid, idx) {
  const el = document.getElementById(`ibox-${rid}-${idx}`);
  if (el) el.classList.add('used');
}

// ── Fireworks ─────────────────────────────────────────────────

function launchFireworks(place) {
  const emojis = ['🎆','🎇','✨','🎉','🌟','💥','🎊'];
  const count = Math.max(3, 10 - place * 2);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const fw = document.createElement('div');
      fw.className = 'fw';
      fw.style.cssText = `left:${10+Math.random()*80}vw;top:${10+Math.random()*60}vh;--fy:${-(60+Math.random()*80)}px;--fy2:${-(130+Math.random()*100)}px`;
      fw.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      document.body.appendChild(fw);
      setTimeout(() => fw.remove(), 2500);
    }, i * 160);
  }
}
