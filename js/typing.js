// js/typing.js
// Handles all keyboard input during a race.
// Manages the hidden textarea, char state transitions, and WPM calculation.

let lastProcessedLength = 0;

function focusTyping() {
  const inp = document.getElementById('real-input');
  if (inp) inp.focus();
  ctx(); // wake up AudioContext on user gesture
}

function onTypingFocus() {
  const ind   = document.getElementById('focus-indicator');
  const panel = document.getElementById('typing-panel');
  if (ind)   { ind.classList.add('on'); ind.textContent = '⌨️ Typing active!'; }
  if (panel) panel.classList.add('focused');
}

function onTypingBlur() {
  const ind   = document.getElementById('focus-indicator');
  const panel = document.getElementById('typing-panel');
  if (ind)   { ind.classList.remove('on'); ind.textContent = '👆 Click here to start typing!'; }
  if (panel) panel.classList.remove('focused');
}

function onTypingKeydown(e) {
  if (G.screen !== 'race' || G.finished || !G.raceStartTime) return;

  // SPACE: use held item (don't type the space)
  if (e.code === 'Space' && G.heldItem) {
    e.preventDefault();
    useItem();
    const inp = e.target;
    inp.value = inp.value.trimEnd(); // discard the space character
    lastProcessedLength = inp.value.length;
    return;
  }

  // BACKSPACE: step back one character
  if (e.key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
    const inp = e.target;
    if (inp.value.length > 0) inp.value = inp.value.slice(0, -1);
    lastProcessedLength = inp.value.length;
    return;
  }
}

function onTextareaInput(e) {
  if (G.screen !== 'race' || G.finished || !G.raceStartTime) return;
  ctx();
  const inp = e.target;
  const val = inp.value;

  if (val.length > lastProcessedLength) {
    for (let i = lastProcessedLength; i < val.length; i++) {
      if (G.finished || G.cursorPos >= G.raceText.length) break;
      handleChar(val[i]);
    }
  }

  lastProcessedLength = val.length;
  // Prevent textarea from growing unbounded
  if (val.length > 200) {
    inp.value = val.slice(val.length - 100);
    lastProcessedLength = inp.value.length;
  }
}

function handleBackspace() {
  // If current character is an error, clear it without stepping back
  if (G.charStates[G.cursorPos] === 'err') {
    G.charStates[G.cursorPos] = 'rem';
    setCharClass(G.cursorPos, 'cur');
    return;
  }
  if (G.cursorPos <= 0) return;
  setCharClass(G.cursorPos, 'rem');
  G.cursorPos--;
  if (G.charStates[G.cursorPos] === 'ok') G.correctChars = Math.max(0, G.correctChars - 1);
  G.charStates[G.cursorPos] = 'rem';
  setCharClass(G.cursorPos, 'cur');
}

function handleChar(key) {
  if (G.cursorPos >= G.raceText.length) return;
  // Block typing until error is cleared
  if (G.charStates[G.cursorPos] === 'err') { SFX.error(); return; }

  const expected = G.raceText[G.cursorPos];
  G.totalTyped++;

  if (key === expected) {
    G.correctChars++;
    G.charStates[G.cursorPos] = 'ok';
    setCharClass(G.cursorPos, 'ok');
    SFX.correct();
    G.cursorPos++;
    if (G.cursorPos >= G.raceText.length) { playerFinished(); return; }
    setCharClass(G.cursorPos, 'cur');
    // Scroll the next character into view
    const el = document.getElementById('rc-' + G.cursorPos);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } else {
    G.charStates[G.cursorPos] = 'err';
    setCharClass(G.cursorPos, 'err');
    SFX.error();
  }
}

function setCharClass(i, cls) {
  const el = document.getElementById('rc-' + i);
  if (el) el.className = 'ch-' + cls;
}
