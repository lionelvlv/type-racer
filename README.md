# Type Racer

**Play:** https://lionelvlv.github.io/type-racer/

## Documentation
- [Technical Specification](docs/SPEC.md)
- [AI Disclosure](docs/AI_DISCLOSURE.md)

## Features
- Race against bots or friends through an invite link
- Live WPM and accuracy stats, playable characters, power-up items
- Custom practice text
- Sound effects generated with the Web Audio API

## How the multiplayer works
Rooms use [PeerJS](https://peerjs.com/) (WebRTC data channels) in a **star topology**:
- The host creates a room and shares its peer ID as an invite link.
- Every guest connects only to the host, and the host relays each player's progress to everyone else.
- Rooms cap at 8 players. The host is the single source of truth for race start and finish.

## Code layout
| File | Responsibility |
|---|---|
| `js/state.js` | Global game state |
| `js/typing.js` | Input handling and per-keystroke correctness |
| `js/race.js` | Race loop, bots, finish order |
| `js/online.js` | PeerJS rooms, relaying, joins and leaves |
| `js/items.js`, `js/characters.js` | Power-ups and characters |
| `js/stats.js` | WPM and accuracy history |
| `js/ui.js`, `js/audio.js` | Rendering and sound |

## Run locally
Static site: open `index.html` or run `npx serve .`
