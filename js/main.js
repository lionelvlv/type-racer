// js/main.js
// Entry point. DOMContentLoaded init, navigation, shared utilities.
// Loaded last — all other modules must be loaded before this.

// ── Init ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  createStars();
  buildCharGrid();
  handleInviteLinkOnLoad();

  // SPACE = use item during race (only when not actively typing)
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && G.screen === 'race') {
      const inp = document.getElementById('real-input');
      if (document.activeElement !== inp) {
        e.preventDefault();
        useItem();
      }
    }
  });
});

// ── Navigation ────────────────────────────────────────────────

// Show/hide AI-only sections based on current mode, and rebuild char grid
function updateCharScreenForMode() {
  const isOnline = G.mode === 'online';
  document.querySelectorAll('.ai-only').forEach(el => el.classList.toggle('hidden', isOnline));
  const subtitle = document.getElementById('char-screen-subtitle');
  if (subtitle) {
    subtitle.style.display = isOnline ? 'block' : 'none';
    subtitle.textContent   = isOnline ? '🌐 Online mode — pick your racer, then confirm.' : '';
  }
  rebuildCharGrid();
}

// Back button on character select — routes to menu or online lobby
function charScreenBack() {
  if (G._returnToOnline) { G._returnToOnline = false; showScreen('online'); }
  else                   { showScreen('menu'); }
}

function startVsAI() {
  SFX.select(); ctx();
  G.mode = 'ai'; G._returnToOnline = false; G.selectedChar = null;
  const b = document.getElementById('race-btn');
  b.disabled = true; b.textContent = 'SELECT A RACER FIRST';
  updateCharScreenForMode();
  showScreen('character');
}

function gotoOnlineMenu() { SFX.select(); G.mode = 'online'; showScreen('online'); }
function gotoHowToPlay()  { SFX.select(); showScreen('howto'); }

// Called from the "PICK CHARACTER" button in the online lobby
function pickCharForOnline() {
  G._returnToOnline = true; G.mode = 'online';
  const b = document.getElementById('race-btn');
  if (G.selectedChar) { b.disabled = false; b.textContent = `▶ CONFIRM ${G.selectedChar.name}`; }
  else                { b.disabled = true;  b.textContent = 'SELECT A RACER FIRST'; }
  updateCharScreenForMode();
  showScreen('character');
}

function setDiff(d) {
  G.difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === d));
  SFX.select();
}

function setMatchDuration(secs) {
  G.matchDuration = secs;
  document.querySelectorAll('.match-cfg-btn').forEach(b => b.classList.toggle('active', +b.dataset.dur === secs));
  SFX.select();
}

// ── In-race controls ──────────────────────────────────────────

// Quit mid-race — confirms, broadcasts quit if online, returns to menu
function confirmExitRace() {
  if (!confirm('Quit the race? Your progress will be lost.')) return;
  if (G.raceRafId)    cancelAnimationFrame(G.raceRafId);
  if (G.elapsedTimer) clearInterval(G.elapsedTimer);
  if (G.mode === 'online') {
    broadcast({ type:'quit', peerId:G.myPeerId });
    disconnectOnline();
  }
  showScreen('menu');
}

// Leave from results screen without waiting for other players
function leaveOnlineRace() {
  disconnectOnline();
  showScreen('menu');
}

// Play again — restart solo race or go back to AI setup
function playAgain() {
  G.mode === 'ai' && G.selectedChar ? startRace() : startVsAI();
}

// ── Utilities ─────────────────────────────────────────────────

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
