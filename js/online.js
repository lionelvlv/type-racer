// js/online.js
// P2P multiplayer via PeerJS. Star topology: all peers connect to host.
// Host relays all messages so every peer sees every other peer.

const MAX_PLAYERS = 8;

function currentPlayerCount() {
  return 1 + Object.keys(G.onlinePlayers).length;
}

function isRoomFull() {
  return currentPlayerCount() >= MAX_PLAYERS;
}

// ── Room creation ─────────────────────────────────────────────

function createRoom() {
  if (!window.Peer) { setOnlineStatus('⚠️ PeerJS not loaded'); return; }
  G.mode = 'online'; // CRITICAL: set before race starts so bots are zeroed
  setOnlineStatus('⏳ Creating room...');
  try {
    G.peer   = new Peer();
    G.isHost = true;

    G.peer.on('open', id => {
      G.myPeerId = id;
      setOnlineStatus('✅ Room ready! Share the invite link below.');
      document.getElementById('room-code-wrap').style.display  = 'block';
      document.getElementById('room-code-val').textContent     = id.slice(0, 14).toUpperCase();
      document.getElementById('invite-link-wrap').style.display = 'block';
      document.getElementById('lobby-wrap').classList.add('visible');
      document.getElementById('lobby-start-btn').style.display = 'inline-block';
      updateLobby();
    });

    G.peer.on('connection', conn => {
      if (isRoomFull()) {
        conn.on('open', () => { conn.send({ type:'full', max:MAX_PLAYERS }); setTimeout(() => conn.close(), 500); });
        return;
      }
      G.connections.push(conn);
      setupConn(conn);
      setOnlineStatus(`${currentPlayerCount()} / ${MAX_PLAYERS} players`);
      updateLobby();
    });

    G.peer.on('error', err => setOnlineStatus('⚠️ ' + err.type));
  } catch (e) { setOnlineStatus('⚠️ ' + e.message); }
}

// ── Joining a room ────────────────────────────────────────────

function joinRoom() {
  const code = document.getElementById('join-code-input').value.trim().toLowerCase();
  if (!code) { setOnlineStatus('Enter a room code or paste the invite link!'); return; }
  if (!window.Peer) { setOnlineStatus('⚠️ PeerJS not loaded'); return; }
  G.mode = 'online'; // CRITICAL: set before race starts so bots are zeroed
  setOnlineStatus('⏳ Joining...');
  try {
    G.peer   = new Peer();
    G.isHost = false;

    G.peer.on('open', id => {
      G.myPeerId = id;
      const conn = G.peer.connect(code, { reliable: true });
      G.connections.push(conn);
      setupConn(conn);
    });

    G.peer.on('error', err => setOnlineStatus('⚠️ Could not connect: ' + err.type));
  } catch (e) { setOnlineStatus('⚠️ ' + e.message); }
}

// ── Connection setup ──────────────────────────────────────────

function setupConn(conn) {
  conn.on('open', () => {
    setOnlineStatus('✅ Connected!');
    if (!G.isHost) document.getElementById('lobby-wrap').classList.add('visible');

    // Introduce ourselves with current character selection
    conn.send({
      type:   'hello',
      name:   G.selectedChar?.name  || 'RACER',
      emoji:  G.selectedChar?.emoji || '🏎️',
      charId: G.selectedChar?.id    || null,
      peerId: G.myPeerId,
    });
    updateLobby();
  });

  conn.on('data',  d   => handleOnlineMsg(d, conn));
  conn.on('close', ()  => {
    G.connections = G.connections.filter(c => c !== conn);
    const pid = Object.keys(G.onlinePlayers).find(p => G.onlinePlayers[p]._conn === conn);
    if (pid) delete G.onlinePlayers[pid];
    const count = currentPlayerCount();
    setOnlineStatus(`${count} / ${MAX_PLAYERS} player${count === 1 ? '' : 's'}`);
    updateLobby();
  });
  conn.on('error', err => setOnlineStatus('⚠️ Conn error: ' + err));
}

// ── Message handling ──────────────────────────────────────────

function handleOnlineMsg(data, conn) {
  switch (data.type) {

    case 'full': {
      setOnlineStatus(`⛔ Room is full (max ${data.max || MAX_PLAYERS} players).`);
      showNotif(`⛔ Room full! Max ${data.max || MAX_PLAYERS} players.`);
      G.peer?.destroy(); G.peer = null; G.connections = [];
      break;
    }

    case 'hello': {
      if (G.isHost && currentPlayerCount() >= MAX_PLAYERS) {
        conn.send({ type:'full', max:MAX_PLAYERS });
        setTimeout(() => conn.close(), 500);
        break;
      }
      G.onlinePlayers[data.peerId] = {
        name: data.name, emoji: data.emoji, charId: data.charId || null,
        position: 0, wpm: 0, finished: false, _conn: conn,
      };
      updateLobby();
      if (G.isHost) {
        // Relay to all other peers
        broadcastExcept({ type:'hello', name:data.name, emoji:data.emoji, charId:data.charId||null, peerId:data.peerId }, conn);
        // Send host identity back to the new joiner
        conn.send({ type:'hello', name:G.selectedChar?.name||'HOST', emoji:G.selectedChar?.emoji||'🏎️', charId:G.selectedChar?.id||null, peerId:G.myPeerId });
        // Send full existing player list to the new joiner
        Object.entries(G.onlinePlayers).forEach(([pid, p]) => {
          if (pid !== data.peerId) conn.send({ type:'hello', name:p.name, emoji:p.emoji, charId:p.charId||null, peerId:pid });
        });
        setOnlineStatus(`${currentPlayerCount()} / ${MAX_PLAYERS} players`);
      }
      break;
    }

    case 'charSelect': {
      if (G.onlinePlayers[data.peerId]) {
        G.onlinePlayers[data.peerId].name   = data.name;
        G.onlinePlayers[data.peerId].emoji  = data.emoji;
        G.onlinePlayers[data.peerId].charId = data.charId;
      }
      if (G.isHost) broadcastExcept({ type:'charSelect', name:data.name, emoji:data.emoji, charId:data.charId, peerId:data.peerId }, conn);
      updateLobby();
      break;
    }

    case 'start': {
      G.matchDuration = data.matchDuration || 300;
      G.raceText      = data.text; // must be set BEFORE initRaceState

      // Apply authoritative player list from host
      if (data.players) {
        data.players.forEach(p => {
          if (G.onlinePlayers[p.peerId]) {
            G.onlinePlayers[p.peerId].name   = p.name;
            G.onlinePlayers[p.peerId].emoji  = p.emoji;
            G.onlinePlayers[p.peerId].charId = p.charId;
          }
        });
      }

      // Auto-assign character if joiner never picked one
      if (!G.selectedChar) {
        G.selectedChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        showNotif(`⚠️ Auto-assigned ${G.selectedChar.name} — pick a char next time!`);
      }

      initRaceState();
      G.raceText    = data.text; // restore after initRaceState
      G.charStates  = Array(G.raceText.length).fill('rem');

      buildTrackWithOnlinePlayers();
      buildRaceText();
      showScreen('countdown');
      runCountdown();
      break;
    }

    case 'progress': {
      if (G.onlinePlayers[data.peerId]) {
        G.onlinePlayers[data.peerId].position = data.position;
        G.onlinePlayers[data.peerId].wpm      = data.wpm;
        G.onlinePlayers[data.peerId].finished = data.finished || false;
        setKartPos(data.peerId, data.position);
      }
      // HOST RELAY: forward to all other peers so P3-P8 see each other move
      if (G.isHost) {
        broadcastExcept({ type:'progress', peerId:data.peerId, position:data.position, wpm:data.wpm, finished:data.finished||false }, conn);
      }
      break;
    }

    case 'quit': {
      if (G.onlinePlayers[data.peerId]) {
        G.onlinePlayers[data.peerId].finished = true;
        G.onlinePlayers[data.peerId].quit     = true;
      }
      if (G.isHost) broadcastExcept({ type:'quit', peerId:data.peerId }, conn);
      break;
    }
  }
}

// ── Host start ────────────────────────────────────────────────

function hostStartRace() {
  if (!G.selectedChar) { showNotif('Pick a character first!'); return; }
  const text = TEXTS[Math.floor(Math.random() * TEXTS.length)];

  const playerList = Object.entries(G.onlinePlayers).map(([pid, p]) => ({
    peerId: pid, name: p.name, emoji: p.emoji, charId: p.charId,
  }));

  broadcast({ type:'start', text, matchDuration:G.matchDuration, players:playerList });

  G.raceText = text;
  initRaceState();
  G.raceText   = text;
  G.charStates = Array(G.raceText.length).fill('rem');
  buildTrackWithOnlinePlayers();
  buildRaceText();
  showScreen('countdown');
  runCountdown();
}

// ── Broadcast helpers ─────────────────────────────────────────

function broadcast(d) {
  G.connections.forEach(c => c.open && c.send(d));
}

function broadcastExcept(d, exclude) {
  G.connections.filter(c => c !== exclude && c.open).forEach(c => c.send(d));
}

function broadcastProgress() {
  if (!G.connections.length) return;
  broadcast({ type:'progress', peerId:G.myPeerId, position:G.position, wpm:G.wpm, finished:G.finished });
}

// ── Disconnect ────────────────────────────────────────────────

function disconnectOnline() {
  G.peer?.destroy();
  G.peer = null; G.connections = []; G.onlinePlayers = {};
  document.getElementById('room-code-wrap').style.display   = 'none';
  document.getElementById('invite-link-wrap').style.display = 'none';
  document.getElementById('lobby-wrap').classList.remove('visible');
  document.getElementById('lobby-start-btn').style.display  = 'none';
  setOnlineStatus('Disconnected.');
  showScreen('online');
}

// ── Lobby UI ──────────────────────────────────────────────────

function setOnlineStatus(m) {
  const e = document.getElementById('online-status');
  if (e) e.textContent = m;
}

function updateLobby() {
  const g = document.getElementById('lobby-grid');
  if (!g) return;
  g.innerHTML = '';

  const add = (em, nm, you, isHost = false) => {
    const s = document.createElement('div');
    s.className = 'lobby-slot filled';
    const badge = isHost ? ' <span style="font-size:.35rem;color:#4a9fe0;vertical-align:middle">HOST</span>' : '';
    s.innerHTML = `<span class="lobby-slot-emoji">${em}</span><span class="lobby-slot-name${you?' lobby-slot-you':''}">${nm}${you?' ★':''}${badge}</span>`;
    g.appendChild(s);
  };

  // Our own slot
  add(G.selectedChar?.emoji || '❓', G.selectedChar?.name || 'PICK A CHAR', true, G.isHost);

  // Other players — resolve charId for correct emoji
  Object.values(G.onlinePlayers).forEach(p => {
    const charData = p.charId ? CHARS.find(c => c.id === p.charId) : null;
    add(charData?.emoji || p.emoji || '❓', charData?.name || p.name, false, false);
  });

  // Empty slots
  const filled = currentPlayerCount();
  const isFull = filled >= MAX_PLAYERS;
  for (let i = filled; i < MAX_PLAYERS; i++) {
    const s = document.createElement('div');
    s.className = 'lobby-slot';
    s.innerHTML = `<span class="lobby-slot-emoji" style="opacity:.25">👤</span><span class="lobby-slot-name" style="color:#444">Waiting...</span>`;
    g.appendChild(s);
  }

  const heading = document.querySelector('#lobby-wrap .lobby-heading');
  if (heading) {
    heading.innerHTML = `LOBBY &nbsp;<span style="font-size:.52rem;color:${isFull?'#e74c3c':'#4a9fe0'}">${filled} / ${MAX_PLAYERS}${isFull?' · FULL':''}</span>`;
  }
  if (G.isHost) {
    setOnlineStatus(isFull
      ? `⛔ Room full — ${MAX_PLAYERS}/${MAX_PLAYERS}. Start when ready!`
      : `✅ ${filled} / ${MAX_PLAYERS} players — waiting for more...`);
  }
}

// ── Invite link ───────────────────────────────────────────────

function copyInviteLink() {
  if (!G.myPeerId) { showNotif('Room not ready yet!'); return; }
  const url = `${location.origin}${location.pathname}?join=${G.myPeerId}`;
  navigator.clipboard.writeText(url)
    .then(() => showNotif('📋 Invite link copied! Send it to your friends.'))
    .catch(() => prompt('Copy this invite link:', url));
}

// Auto-fill join code if page was loaded with ?join= param
function handleInviteLinkOnLoad() {
  const joinCode = new URLSearchParams(location.search).get('join');
  if (joinCode) {
    G.mode = 'online'; // CRITICAL: set mode before any race can start
    showScreen('online');
    const inp = document.getElementById('join-code-input');
    if (inp) inp.value = joinCode;
    setOnlineStatus('Invite detected! Pick a character, then click JOIN.');
  }
}
