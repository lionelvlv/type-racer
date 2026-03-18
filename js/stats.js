// js/stats.js
// F009 — Personal best & stats tracking via localStorage.
//
// Schema (key: 'ttr_stats'):
// {
//   global: { races, wins, bestWpm, bestAcc, totalWpm, totalAcc },
//   chars:  { [charId]: { races, wins, bestWpm, bestAcc } }
// }

const STATS_KEY = 'ttr_stats';

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    global: { races:0, wins:0, bestWpm:0, bestAcc:0, totalWpm:0, totalAcc:0 },
    chars:  {},
  };
}

function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {}
}

// Record a completed race. Returns { pbWpm, pbAcc } booleans.
function recordRaceStats(wpm, accuracy, place) {
  if (!G.selectedChar) return null;
  const stats   = loadStats();
  const charId  = G.selectedChar.id;
  const won     = place === 0;
  const winsBefore = stats.global.wins;

  // Global
  stats.global.races++;
  if (won) stats.global.wins++;
  stats.global.totalWpm += wpm;
  stats.global.totalAcc += accuracy;
  const pbWpm = wpm      > stats.global.bestWpm ? (stats.global.bestWpm = wpm,      true) : false;
  const pbAcc = accuracy > stats.global.bestAcc ? (stats.global.bestAcc = accuracy, true) : false;

  // Per-character
  if (!stats.chars[charId]) stats.chars[charId] = { races:0, wins:0, bestWpm:0, bestAcc:0 };
  stats.chars[charId].races++;
  if (won) stats.chars[charId].wins++;
  if (wpm      > stats.chars[charId].bestWpm) stats.chars[charId].bestWpm = wpm;
  if (accuracy > stats.chars[charId].bestAcc) stats.chars[charId].bestAcc = accuracy;

  saveStats(stats);
  checkNewUnlocks(winsBefore, stats.global.wins); // F012 integration
  return { pbWpm, pbAcc };
}

// ── Stats screen ──────────────────────────────────────────────

function gotoStats() {
  SFX.select();
  buildStatsScreen();
  showScreen('stats');
}

function buildStatsScreen() {
  const stats = loadStats();

  // Global overview grid
  const grid    = document.getElementById('stats-global-grid');
  const avgWpm  = stats.global.races > 0 ? Math.round(stats.global.totalWpm / stats.global.races) : 0;
  const avgAcc  = stats.global.races > 0 ? Math.round(stats.global.totalAcc / stats.global.races) : 0;
  const winRate = stats.global.races > 0 ? Math.round((stats.global.wins / stats.global.races) * 100) : 0;
  grid.innerHTML = `
    <div class="gstat-box"><div class="gstat-num">${stats.global.races}</div><div class="gstat-lbl">Races</div></div>
    <div class="gstat-box"><div class="gstat-num">${stats.global.wins}</div><div class="gstat-lbl">Wins</div></div>
    <div class="gstat-box"><div class="gstat-num">${stats.global.bestWpm}</div><div class="gstat-lbl">Best WPM</div></div>
    <div class="gstat-box"><div class="gstat-num">${avgWpm}</div><div class="gstat-lbl">Avg WPM</div></div>
    <div class="gstat-box"><div class="gstat-num">${stats.global.bestAcc}%</div><div class="gstat-lbl">Best ACC</div></div>
    <div class="gstat-box"><div class="gstat-num">${avgAcc}%</div><div class="gstat-lbl">Avg ACC</div></div>
    <div class="gstat-box"><div class="gstat-num">${winRate}%</div><div class="gstat-lbl">Win Rate</div></div>
    <div class="gstat-box"><div class="gstat-num">${stats.global.races - stats.global.wins}</div><div class="gstat-lbl">Losses</div></div>
  `;

  // Per-character breakdown
  const list = document.getElementById('stats-char-list');
  list.innerHTML = '';

  const entries = CHARS
    .map(ch => ({ ch, s: stats.chars[ch.id] || null, unlocked: isCharUnlocked(ch.id, stats) }))
    .sort((a, b) => {
      const scoreA = a.s?.races > 0 ? 2 : a.unlocked ? 1 : 0;
      const scoreB = b.s?.races > 0 ? 2 : b.unlocked ? 1 : 0;
      return scoreB !== scoreA ? scoreB - scoreA : (b.s?.races || 0) - (a.s?.races || 0);
    });

  entries.forEach(({ ch, s, unlocked }) => {
    const wr  = s && s.races > 0 ? Math.round((s.wins / s.races) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'char-stat-row';

    if (!unlocked) {
      const req  = UNLOCK_REQUIREMENTS[ch.id] ?? 0;
      const wins = stats.global.wins;
      row.innerHTML = `
        <span class="char-stat-emoji" style="opacity:.4">🔒</span>
        <span class="char-stat-name" style="color:#555">${ch.name}</span>
        <div class="char-stat-detail"><span>Locked — <b>${UNLOCK_LABELS[ch.id]}</b> (${wins}/${req} wins)</span></div>`;
    } else if (!s || s.races === 0) {
      row.innerHTML = `
        <span class="char-stat-emoji">${ch.emoji}</span>
        <span class="char-stat-name" style="color:${ch.color}">${ch.name}</span>
        <div class="char-stat-detail"><span style="color:#555">No races yet</span></div>`;
    } else {
      row.innerHTML = `
        <span class="char-stat-emoji">${ch.emoji}</span>
        <span class="char-stat-name" style="color:${ch.color}">${ch.name}</span>
        <div class="char-stat-detail">
          <span>Races <b>${s.races}</b></span>
          <span>Wins <b>${s.wins}</b></span>
          <span>Win% <b>${wr}%</b></span>
          <span>Best WPM <b>${s.bestWpm}</b></span>
          <span>Best ACC <b>${s.bestAcc}%</b></span>
        </div>`;
    }
    list.appendChild(row);
  });
}

function confirmClearStats() {
  if (!confirm('Reset all stats? This cannot be undone. (Characters will re-lock!)')) return;
  localStorage.removeItem(STATS_KEY);
  G.selectedChar = null; // deselect in case active char is now locked
  buildStatsScreen();
  showNotif('Stats cleared. Fresh start! 🏁');
}

// Show personal best banner on results screen
function showPBBanner(pbWpm, pbAcc) {
  const banner = document.getElementById('pb-banner');
  if (!banner) return;
  if (pbWpm || pbAcc) {
    const parts = [];
    if (pbWpm) parts.push('🏆 NEW BEST WPM!');
    if (pbAcc) parts.push('🎯 NEW BEST ACCURACY!');
    banner.textContent  = parts.join('  ·  ');
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}
