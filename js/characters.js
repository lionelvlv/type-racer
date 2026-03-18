// js/characters.js
// Character grid rendering, unlock system (F012), and character selection logic.

// ── Unlock requirements ───────────────────────────────────────
// charId → number of wins needed. 0 = always available.

const UNLOCK_REQUIREMENTS = {
  lionel:     0,   // starter — always unlocked
  jordan:     1,   // win your first race
  kwan:       3,   // win 3 races
  john:       5,   // win 5 races
  shin:       8,   // win 8 races
  sandro:     12,  // win 12
  ian:        18,  // win 18
  jason:      25,  // win 25
};

const UNLOCK_LABELS = {
  lionel:     'Always unlocked',
  jordan:     'Win 1 race',
  kwan:       'Win 3 races',
  john:       'Win 5 races',
  shin:       'Win 8 races',
  sandro:     'Win 12 races',
  ian:        'Win 18 races',
  jason:      'Win 25 races',
};

function isCharUnlocked(charId, stats) {
  const req = UNLOCK_REQUIREMENTS[charId] ?? 0;
  if (req === 0) return true;
  return (stats?.global?.wins ?? 0) >= req;
}

function getUnlockRequirement(charId) {
  return UNLOCK_LABELS[charId] || 'Win races to unlock';
}

// Notify the player when a character unlocks after a race
function checkNewUnlocks(winsBeforeRace, winsAfterRace) {
  CHARS.forEach(ch => {
    const req = UNLOCK_REQUIREMENTS[ch.id] ?? 0;
    if (req > 0 && winsBeforeRace < req && winsAfterRace >= req) {
      setTimeout(() => showNotif(`🔓 UNLOCKED: ${ch.emoji} ${ch.name}!`), 1800);
    }
  });
}

// ── Character grid ────────────────────────────────────────────

// Called on init and whenever mode/stats change.
// Clears and rebuilds every card with correct locked/unlocked state.
function rebuildCharGrid() {
  const grid = document.getElementById('char-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const stats = loadStats();

  CHARS.forEach(ch => {
    const unlocked = isCharUnlocked(ch.id, stats);
    const card = document.createElement('div');
    card.className = 'char-card' + (unlocked ? '' : ' locked');
    card.id = 'char-' + ch.id;
    if (unlocked) card.onclick = () => selectChar(ch.id);

    const bar = v => `<div class="stat-bar"><div class="stat-fill" style="width:${v*10}%;background:${ch.color}"></div></div>`;
    const lockOverlay = unlocked ? '' : `
      <div class="char-lock-overlay">
        <div class="char-lock-icon">🔒</div>
        <div class="char-lock-req">${getUnlockRequirement(ch.id)}</div>
      </div>`;

    card.innerHTML = `
      <div class="char-avatar" style="background:${ch.bg};border-color:${ch.color}33">
        <span>${unlocked ? ch.emoji : '❓'}</span>
      </div>
      <div class="char-name">${unlocked ? ch.name : '???'}</div>
      <div class="char-title" style="color:${unlocked ? ch.traitColor : '#555'}">${unlocked ? ch.title : 'LOCKED'}</div>
      <div class="char-stats">
        <div class="stat-row"><span class="stat-lbl">SPD</span>${bar(unlocked ? ch.stats.spd : 0)}</div>
        <div class="stat-row"><span class="stat-lbl">ACC</span>${bar(unlocked ? ch.stats.acc : 0)}</div>
        <div class="stat-row"><span class="stat-lbl">HDL</span>${bar(unlocked ? ch.stats.hdl : 0)}</div>
      </div>
      <div class="char-trait" style="color:${unlocked ? ch.traitColor : '#444'};background:${unlocked ? ch.bg : '#0a0a0a'}">
        ${unlocked ? ch.trait : '🔒 Win races to unlock'}
      </div>
      ${lockOverlay}`;

    // Re-highlight previously selected char
    if (G.selectedChar?.id === ch.id && unlocked) card.classList.add('selected');
    grid.appendChild(card);
  });
}

// Alias used in main.js on DOMContentLoaded
function buildCharGrid() {
  rebuildCharGrid();
}

// ── Character selection ───────────────────────────────────────

function selectChar(id) {
  // Guard: reject locked characters
  const stats = loadStats();
  if (!isCharUnlocked(id, stats)) {
    showNotif(`🔒 ${UNLOCK_LABELS[id] || 'Win more races to unlock!'}`);
    return;
  }

  SFX.coin();
  G.selectedChar = CHARS.find(c => c.id === id);
  document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('char-' + id).classList.add('selected');

  const b = document.getElementById('race-btn');
  b.disabled = false;
  b.textContent = G._returnToOnline
    ? `▶ CONFIRM ${G.selectedChar.name}`
    : `▶ RACE AS ${G.selectedChar.name}!`;

  // Broadcast character update if already in a live lobby
  if (G.peer && G.connections.length) {
    broadcast({
      type:   'charSelect',
      name:   G.selectedChar.name,
      emoji:  G.selectedChar.emoji,
      charId: G.selectedChar.id,
      peerId: G.myPeerId,
    });
    updateLobby();
  }
}
