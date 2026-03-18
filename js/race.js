// js/race.js
// Race lifecycle: setup → countdown → game loop → end → results.

// ── Setup ─────────────────────────────────────────────────────

function startRace() {
  if (!G.selectedChar) return;
  SFX.select();

  // Coming from online lobby — return there instead of starting solo race
  if (G._returnToOnline) {
    G._returnToOnline = false;
    showScreen('online');
    updateLobby();
    return;
  }

  // F010: use custom text if set, otherwise pick a random built-in text
  G.raceText = G.customText || TEXTS[Math.floor(Math.random() * TEXTS.length)];
  G.customText = null; // consume — one race per custom text

  initRaceState();
  buildTrack();
  buildRaceText();
  showScreen('countdown');
  runCountdown();
}

function initRaceState() {
  G.charStates  = Array(G.raceText.length).fill('rem');
  G.cursorPos   = 0;
  G.correctChars= 0;
  G.totalTyped  = 0;
  G.wpm         = 0;
  G.accuracy    = 100;
  G.position    = 0;
  G.finished    = false;
  G.finishTime  = null;
  G.heldItem    = null;
  G.speedMult   = 1.0;
  G.slowed      = false;
  G.boosted     = false;
  G.collectedBoxes = [];
  G.finishOrder    = [];
  G.raceStartTime  = null;
  G.raceLastFrame  = null;

  if (G.raceRafId)    cancelAnimationFrame(G.raceRafId);
  if (G.elapsedTimer) clearInterval(G.elapsedTimer);
  G.raceRafId    = null;
  G.elapsedTimer = null;

  // Online mode: no bots — race is humans only
  if (G.mode === 'online') {
    G.bots = [];
    return;
  }

  // AI mode: pick 3 opponents, excluding the player's chosen character
  const diff = DIFFICULTIES[G.difficulty];
  const pool  = G.selectedChar
    ? CHARS.filter(c => c.id !== G.selectedChar.id)
    : [...CHARS];
  G.bots = shuffle([...pool]).slice(0, 3).map(ch => ({
    char:      ch,
    name:      ch.name,
    emoji:     ch.emoji,
    targetWpm: diff.min + Math.random() * (diff.max - diff.min),
    variance:  diff.variance,
    charsTyped:    0,
    position:      0,
    finished:      false,
    finishTime:    null,
    speedMult:     1.0,
    slowed:        false,
    boosted:       false,
    collectedBoxes:[],
  }));
}

function buildTrack() {
  const container = document.getElementById('track-lanes');
  container.innerHTML = '';
  const racers = [
    { id:'player', name:G.selectedChar.name, emoji:G.selectedChar.emoji, color:G.selectedChar.kart, init:G.selectedChar.name[0] },
    ...G.bots.map(b => ({ id:b.char.id, name:b.name, emoji:b.emoji, color:b.char.kart, init:b.name[0] })),
  ];
  racers.forEach(r => addLane(container, r));
}

function buildTrackWithOnlinePlayers() {
  const container = document.getElementById('track-lanes');
  container.innerHTML = '';
  const racers = [
    {
      id:    'player',
      name:  G.selectedChar?.name  || 'YOU',
      emoji: G.selectedChar?.emoji || '🏎️',
      color: G.selectedChar?.kart  || '#c0392b',
      init:  (G.selectedChar?.name || 'Y')[0],
    },
    // Bots (empty in online mode — kept here for completeness)
    ...G.bots.map(b => ({ id:b.char.id, name:b.name, emoji:b.emoji, color:b.char.kart, init:b.name[0] })),
    // Online human players — look up their char data for kart color
    ...Object.entries(G.onlinePlayers).map(([pid, p]) => {
      const charData = p.charId ? CHARS.find(c => c.id === p.charId) : null;
      return { id:pid, name:p.name, emoji:p.emoji, color:charData?.kart || '#1a6eb5', init:p.name[0] };
    }),
  ];
  racers.forEach(r => addLane(container, r));
}

// Shared lane builder — avoids duplicating the lane HTML
function addLane(container, r) {
  const w = document.createElement('div');
  w.className = 'lane-wrap';
  w.innerHTML = `
    <div class="lane">
      <div class="lane-info">
        <div class="lane-char">${r.emoji}</div>
        <div class="lane-name">${r.name}</div>
      </div>
      <div class="lane-track" id="lanetrack-${r.id}">
        ${ITEM_BOX_POS.map((p, j) => `<div class="item-box-track" id="ibox-${r.id}-${j}" style="left:calc(${p}% - 11px)">📦</div>`).join('')}
        <div class="kart" id="kart-${r.id}" style="left:2%">
          <div class="kart-body" style="background:${r.color}">
            <span class="kart-init">${r.init}</span>
          </div>
        </div>
        <span class="finish-flag-icon">🏁</span>
      </div>
    </div>`;
  container.appendChild(w);
}

function buildRaceText() {
  const el = document.getElementById('race-text');
  el.innerHTML = G.raceText.split('').map((ch, i) => {
    const cls = i === 0 ? 'ch-cur' : 'ch-rem';
    const d   = ch === ' ' ? '&nbsp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
    return `<span id="rc-${i}" class="${cls}">${d}</span>`;
  }).join('');
}

// ── Countdown ─────────────────────────────────────────────────

function runCountdown() {
  const disp  = document.getElementById('countdown-display');
  const cchar = document.getElementById('countdown-char');
  let n = 3;

  function tick() {
    disp.className = 'countdown-num';
    void disp.offsetWidth; // force reflow for animation restart
    if (n > 0) {
      disp.textContent = n;
      disp.classList.add('cd-' + n);
      cchar.textContent = G.selectedChar ? `${G.selectedChar.emoji} ${G.selectedChar.name}` : '';
      SFX.beep(false);
      n--;
      setTimeout(tick, 950);
    } else {
      disp.textContent = 'GO!';
      disp.classList.add('cd-go');
      cchar.textContent = '⌨️ START TYPING!';
      SFX.go();
      setTimeout(beginRace, 850);
    }
  }
  tick();
}

function beginRace() {
  showScreen('race');
  G.raceStartTime = performance.now();
  G.raceLastFrame = G.raceStartTime;
  updateItemDisplay();
  const inp = document.getElementById('real-input');
  inp.value = '';
  inp.disabled = false;
  setTimeout(() => inp.focus(), 80);
  G.raceRafId    = requestAnimationFrame(gameLoop);
  G.elapsedTimer = setInterval(updateElapsed, 500);
}

// ── Game loop ─────────────────────────────────────────────────

function gameLoop(now) {
  if (G.screen !== 'race') return;
  const elapsed = (now - G.raceStartTime) / 1000;
  const dt      = Math.min((now - G.raceLastFrame) / 1000, .1);
  G.raceLastFrame = now;

  // Update player stats
  if (!G.finished) {
    G.wpm      = elapsed > 1 ? Math.round((G.correctChars / 5) / (elapsed / 60)) : 0;
    G.accuracy = G.totalTyped > 0 ? Math.round((G.correctChars / G.totalTyped) * 100) : 100;
    G.position = (G.cursorPos / G.raceText.length) * 100;

    // Check item boxes
    ITEM_BOX_POS.forEach((pos, i) => {
      if (!G.collectedBoxes.includes(i) && G.position >= pos && !G.heldItem) {
        G.collectedBoxes.push(i);
        G.heldItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        SFX.coin();
        showNotif(`${G.heldItem.emoji} Got ${G.heldItem.name}! SPACE to use.`);
        markBoxUsed('player', i);
        updateItemDisplay();
      }
    });

    setKartPos('player', Math.min(G.position, 99));
    setKartFX('player', G.boosted, G.slowed);
    updateStatsBar();
    updatePlaceBadge();
  }

  // Advance bots
  G.bots.forEach(bot => {
    if (bot.finished) return;
    const w = bot.targetWpm * bot.speedMult * (1 - bot.variance / 2 + Math.random() * bot.variance);
    bot.charsTyped += (w * 5 / 60) * dt;
    bot.position    = Math.min(100, (bot.charsTyped / G.raceText.length) * 100);

    ITEM_BOX_POS.forEach((pos, j) => {
      if (!bot.collectedBoxes.includes(j) && bot.position >= pos) {
        bot.collectedBoxes.push(j);
        markBoxUsed(bot.char.id, j);
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        setTimeout(() => applyBotItem(bot, item), 400 + Math.random() * 800);
      }
    });

    if (bot.position >= 100 && !bot.finished) {
      bot.finished   = true;
      bot.finishTime = elapsed;
      G.finishOrder.push({ id:bot.char.id, name:bot.name, emoji:bot.emoji, isPlayer:false, time:elapsed, wpm:Math.round(bot.targetWpm) });
    }

    setKartPos(bot.char.id, Math.min(bot.position, 99));
    setKartFX(bot.char.id, bot.boosted, bot.slowed);
  });

  if (G.mode === 'online') broadcastProgress();

  updateTimerBar(elapsed);

  // End conditions
  const timeUp           = elapsed >= G.matchDuration;
  const botsAllDone      = G.bots.every(b => b.finished);
  const playerAndBotsDone = G.finished && botsAllDone;

  if (timeUp || (G.mode !== 'online' && playerAndBotsDone)) { endRace(); return; }
  if (G.mode === 'online' && G.finished) { endRace(); return; }

  G.raceRafId = requestAnimationFrame(gameLoop);
}

// ── Finish & end ──────────────────────────────────────────────

function playerFinished() {
  G.finished  = true;
  G.position  = 100;
  const elapsed = (performance.now() - G.raceStartTime) / 1000;
  G.finishTime = elapsed;
  setKartPos('player', 99);
  G.finishOrder.push({
    id: G.selectedChar.id, name: G.selectedChar.name, emoji: G.selectedChar.emoji,
    isPlayer: true, time: elapsed, wpm: G.wpm,
  });
  for (let i = G.cursorPos; i < G.raceText.length; i++) setCharClass(i, 'ok');
  const place = G.finishOrder.length;
  if (place === 1) { SFX.winner(); showNotif('🏆 1ST PLACE! WINNER!'); }
  else             { SFX.finish(); showNotif(`🏁 ${PLACE_LABELS[place-1]}! ${formatTime(elapsed)}`); }
  document.getElementById('real-input').disabled = true;
}

function endRace() {
  cancelAnimationFrame(G.raceRafId);
  clearInterval(G.elapsedTimer);
  const elapsed = (performance.now() - G.raceStartTime) / 1000;

  if (!G.finished) {
    G.finished   = true;
    G.finishTime = elapsed;
    G.finishOrder.push({
      id: G.selectedChar.id, name: G.selectedChar.name, emoji: G.selectedChar.emoji,
      isPlayer: true, time: elapsed, wpm: G.wpm,
    });
  }

  G.bots.forEach(b => {
    if (!b.finished) {
      b.finished   = true;
      b.finishTime = elapsed;
      G.finishOrder.push({ id:b.char.id, name:b.name, emoji:b.emoji, isPlayer:false, time:elapsed, wpm:Math.round(b.targetWpm) });
    }
  });

  G.finishOrder.sort((a, b) => a.time - b.time);
  setTimeout(showResults, 1400);
}

// ── Results ───────────────────────────────────────────────────

function showResults() {
  showScreen('results');
  const pi    = G.finishOrder.findIndex(f => f.isPlayer);
  const words = ['🏆 WINNER!','🥈 2ND PLACE','🥉 3RD PLACE','4TH PLACE','5TH PLACE','6TH PLACE','7TH PLACE','8TH PLACE'];
  document.getElementById('results-title').textContent = `${G.selectedChar.emoji} ${words[Math.min(pi, words.length - 1)]}`;

  buildPodium();
  buildResultsList();
  launchFireworks(pi);
  pi === 0 ? SFX.winner() : SFX.finish();

  // F009: record stats and show PB banner
  const pbs = recordRaceStats(G.wpm, G.accuracy, pi);
  if (pbs) showPBBanner(pbs.pbWpm, pbs.pbAcc);

  // Online: show waiting banner and leave button; hide Race Again
  const waitBanner = document.getElementById('results-waiting-banner');
  const leaveBtn   = document.getElementById('results-leave-btn');
  const againBtn   = document.getElementById('results-race-again-btn');
  if (G.mode === 'online') {
    waitBanner.style.display = 'block';
    leaveBtn.style.display   = 'inline-block';
    againBtn.style.display   = 'none';
  } else {
    waitBanner.style.display = 'none';
    leaveBtn.style.display   = 'none';
    againBtn.style.display   = 'inline-block';
  }
}

function buildPodium() {
  const p = document.getElementById('podium');
  p.innerHTML = '';
  const o = G.finishOrder.slice(0, 3);
  [o[1], o[0], o[2]].filter(Boolean).forEach((r, di) => {
    const rp  = G.finishOrder.indexOf(r);
    const col = document.createElement('div');
    col.className = 'pod-col';
    col.innerHTML = `
      <div class="pod-emoji ${['second','','third'][di]}" style="--del:${di*.15}s">${r.emoji}</div>
      <div class="pod-name">${r.name}${r.isPlayer ? '<br><span style="color:#ffd700">(YOU)</span>' : ''}</div>
      <div class="pod-time">${formatTime(r.time)}</div>
      <div class="pod-wpm">${r.wpm} WPM</div>
      <div class="pod-block pod-${rp+1}">${PLACE_LABELS[rp]}</div>`;
    p.appendChild(col);
  });
}

function buildResultsList() {
  document.getElementById('results-list').innerHTML = G.finishOrder.map((r, i) => `
    <div class="res-row">
      <span class="res-place">${PLACE_LABELS[i]}</span>
      <span class="res-emoji">${r.emoji}</span>
      <span class="res-name">${r.name}${r.isPlayer ? '<span class="res-you">YOU</span>' : ''}</span>
      <span class="res-time">${formatTime(r.time)}</span>
      <span class="res-wpm">${r.wpm} WPM</span>
    </div>`).join('');
}
