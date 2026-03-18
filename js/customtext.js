// js/customtext.js
// F010 — Custom text input. Players paste any text to race against.
// Minimum 80 characters. Live word count, char count, and time estimate.

const TEXT_PRESETS = [
  { label:'🎓 Inspirational', text:"The only way to do great work is to love what you do. If you haven't found it yet keep looking. Don't settle. As with all matters of the heart you'll know when you find it. Stay hungry stay foolish and never stop asking questions because curiosity is the engine of achievement." },
  { label:'🖥 Tech Wisdom',   text:"Any fool can write code that a computer can understand. Good programmers write code that humans can understand. First make it work then make it right then make it fast. Simplicity is the soul of efficiency and the best code is the code you never have to write at all." },
  { label:'🎮 Gaming Quotes', text:"It's dangerous to go alone take this. The cake is a lie. Stay a while and listen. War never changes. A man chooses a slave obeys. The right man in the wrong place can make all the difference in the world. Thank you Mario but our princess is in another castle." },
  { label:'🌊 Chill Vibes',   text:"The ocean knows no favorites and neither does the wind. Every wave that breaks on the shore has traveled thousands of miles to reach you. The sky at dusk holds every color you have ever loved and every color you have never seen. There is peace in the sound of water and truth in the silence between the waves." },
  { label:'🔢 Numbers',       text:"One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety one hundred two hundred three hundred four hundred five hundred six hundred seven hundred eight hundred nine hundred one thousand." },
];

function gotoCustomText() {
  SFX.select();
  buildPresetButtons();
  // Restore any previously entered text
  const ta = document.getElementById('custom-text-input');
  if (ta && G.customText) { ta.value = G.customText; onCustomTextInput(); }
  showScreen('customtext');
}

// Build preset buttons once — idempotent (safe to call multiple times)
function buildPresetButtons() {
  const wrap = document.getElementById('preset-btns');
  if (!wrap || wrap.children.length > 0) return;
  TEXT_PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = p.label;
    btn.onclick = () => {
      document.getElementById('custom-text-input').value = p.text;
      onCustomTextInput();
      SFX.select();
    };
    wrap.appendChild(btn);
  });
}

// Called on every keystroke in the custom text textarea
function onCustomTextInput() {
  const ta    = document.getElementById('custom-text-input');
  const text  = ta.value.trim();
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const estSecs = words > 0 ? Math.round((words / 60) * 60) : 0;

  document.getElementById('custom-word-count').textContent = words;
  document.getElementById('custom-char-count').textContent = chars;
  document.getElementById('custom-est-time').textContent   = estSecs > 0 ? formatTime(estSecs) : '—';

  const btn   = document.getElementById('custom-race-btn');
  const valid = chars >= 80;
  btn.disabled   = !valid;
  btn.textContent = valid
    ? `▶ RACE THIS TEXT (${words} words)`
    : `⚠️ NEED ${Math.max(0, 80 - chars)} MORE CHARS`;

  G.customText = valid ? text : null;
}

function startWithCustomText() {
  if (!G.customText)    { showNotif('Text too short — need at least 80 characters.'); return; }
  if (!G.selectedChar)  { showNotif('Pick a character first!'); showScreen('character'); return; }
  SFX.select();
  G.raceText   = G.customText;
  G.customText = null; // consume — one race per submission
  initRaceState();
  buildTrack();
  buildRaceText();
  showScreen('countdown');
  runCountdown();
}
