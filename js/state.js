// js/state.js
// Global game state and all static data constants.
// Everything lives here so any module can read G and the data arrays.

// ── Static data ───────────────────────────────────────────────

const CHARS = [
  { id:'lionel',     name:'LIONEL', title:'The Dribble King', emoji:'⚽', color:'#3a86ff', kart:'#1a5ab8', bg:'#0a1e4a', trait:'🔵 "Precise. Always on target."',    traitColor:'#3a86ff', stats:{spd:9,  acc:9,  hdl:8 } },
  { id:'jordan',     name:'JORDAN', title:'Air Supremacy',    emoji:'🏀', color:'#e63946', kart:'#9b1a22', bg:'#3a0a0a', trait:'🔴 "Nobody tells me no."',            traitColor:'#e63946', stats:{spd:10, acc:7,  hdl:8 } },
  { id:'alessandro', name:'SANDRO', title:'The Maestro',      emoji:'🎻', color:'#8338ec', kart:'#4a1a8a', bg:'#1a0a3a', trait:'🟣 "Every keystroke is a note."',     traitColor:'#8338ec', stats:{spd:7,  acc:10, hdl:9 } },
  { id:'kwan',       name:'KWAN',   title:'Ice & Fire',       emoji:'⛸️', color:'#06d6a0', kart:'#037a5c', bg:'#021a14', trait:'🟢 "Graceful. Ruthless. Fast."',      traitColor:'#06d6a0', stats:{spd:8,  acc:9,  hdl:10} },
  { id:'john',       name:'JOHN',   title:'The Everyman',     emoji:'🔧', color:'#fb8500', kart:'#a85200', bg:'#2a1400', trait:'🟠 "Built different. Works harder."', traitColor:'#fb8500', stats:{spd:7,  acc:8,  hdl:8 } },
  { id:'shin',       name:'SHIN',   title:'Cyber Ronin',      emoji:'⚔️', color:'#ef233c', kart:'#8a0f1e', bg:'#2a0008', trait:'🗡️ "Strike once. Strike true."',     traitColor:'#ef233c', stats:{spd:9,  acc:8,  hdl:7 } },
  { id:'ian',        name:'IAN',    title:'The Strategist',   emoji:'🧠', color:'#48cae4', kart:'#1a7a9a', bg:'#021820', trait:'🔷 "Three moves ahead, always."',    traitColor:'#48cae4', stats:{spd:6,  acc:10, hdl:9 } },
  { id:'jason',      name:'JASON',  title:'The Wildcard',     emoji:'🃏', color:'#ffd700', kart:'#9a7a00', bg:'#1a1400', trait:'🃏 "Rules? What rules?"',             traitColor:'#ffd700', stats:{spd:8,  acc:6,  hdl:10} },
];

const ITEMS = [
  { id:'nitro',     name:'NITRO',     emoji:'🚀', desc:'Speed boost for 5 seconds!',    eff:'nitro',     dur:5000 },
  { id:'overdrive', name:'OVERDRIVE', emoji:'⭐', desc:'Maximum speed for 8 seconds!',  eff:'overdrive', dur:8000 },
  { id:'magnet',    name:'MAGNET',    emoji:'🧲', desc:'Pulls you toward the leader!',  eff:'magnet',    dur:4000 },
  { id:'missile',   name:'MISSILE',   emoji:'🎯', desc:'Hits the kart directly ahead!', eff:'missile',   dur:3000 },
  { id:'emp',       name:'EMP BLAST', emoji:'⚡', desc:'Slows ALL opponents for 4s!',   eff:'emp',       dur:4000 },
  { id:'oilslick',  name:'OIL SLICK', emoji:'🛢️', desc:'Trips the kart behind you!',   eff:'oilslick',  dur:3000 },
];

const ITEM_BOX_POS = [25, 50, 75];

// Long texts — enough for 3+ min races at 60 WPM
const TEXTS = [
  "The quick brown fox jumps over the lazy dog near the riverbank every single morning before sunrise. Pack my box with five dozen liquor jugs and send them across the mountain pass before the storm arrives tonight. How vexingly quick daft zebras jump when startled by the sound of distant thunder rolling through the valley. The wind carried the scent of pine and rain across the open field where the horses grazed quietly in the afternoon. Every great story begins with a single word written in courage and finished with the wisdom gained along the way.",
  "It was the best of times it was the worst of times it was the age of wisdom it was the age of foolishness it was the epoch of belief it was the epoch of incredulity and it was the season of light and the season of darkness. We had everything before us we had nothing before us we were all going direct to heaven we were all going direct the other way and the noisiest authorities insisted on its being received for good or for evil in the superlative degree of comparison only.",
  "To be or not to be that is the question whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them. To die to sleep no more and by a sleep to say we end the heartache and the thousand natural shocks that flesh is heir to. Tis a consummation devoutly to be wished to die to sleep to sleep perchance to dream and in that sleep of death what dreams may come.",
  "All human beings are born free and equal in dignity and rights and should act towards one another in a spirit of brotherhood and mutual respect. Success is not final failure is not fatal it is the courage to continue that counts in every endeavor we undertake with purpose and determination. Every champion was once a contender who refused to quit when the odds were stacked against them and the crowd had turned away. The road to success is always under construction and the detours along the way are part of the journey that shapes who we become.",
  "In the beginning there was nothing which exploded outward into the vast cosmos that we now call home. The only way to do great work is to love what you do with every fiber of your being and never settle for anything less than your best. Life is what happens when you are busy making other plans and the most important moments often arrive without warning or invitation. In the middle of every difficulty lies opportunity waiting patiently for the person bold enough to reach out and take it with both hands firmly.",
  "The secret of getting ahead is getting started and the secret of getting started is breaking your complex overwhelming tasks into small manageable steps and then beginning on the first one immediately without hesitation. Believe you can and you are halfway there already because the mind is the most powerful tool any human being possesses and it shapes every outcome we experience in this life. You are never too old to set another goal or to dream a new dream because the capacity for growth lives within each one of us until our very last breath.",
  "Knowledge is power and the more you learn the more you realize how much there still is left to discover in this endlessly fascinating universe. The greatest glory in living lies not in never falling but in rising every time we fall because resilience is the true measure of character in any person. In three words I can sum up everything I have learned about life: it goes on regardless of whether we are ready for the next chapter to begin or not.",
  "Technology is best when it brings people together across the vast distances that once separated families and communities and cultures from one another. The future belongs to those who believe in the beauty of their dreams and who wake up every single day prepared to work toward making those dreams a living reality. Do not go where the path may lead instead go where there is no path and leave a trail for those who will follow in your footsteps long after you are gone from this world.",
];

const DIFFICULTIES = {
  easy:   { min:35, max:45,  variance:.20 },
  medium: { min:55, max:65,  variance:.18 },
  hard:   { min:90, max:110, variance:.15 },
};

const PLACE_LABELS  = ['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'];
const PLACE_CLASSES = ['p1','p2','p3','p4','p4','p4','p4','p4'];

// ── Global game state ─────────────────────────────────────────
// Single mutable object. All modules read and write G directly.
// Never replace G — mutate its properties.

const G = {
  screen:        'menu',
  mode:          'ai',        // 'ai' | 'online'
  selectedChar:  null,
  difficulty:    'medium',
  matchDuration: 300,         // seconds — default 5 min
  _returnToOnline: false,     // flag: char select should route back to lobby

  // Race state
  raceText:    '',
  charStates:  [],
  cursorPos:   0,
  correctChars:0,
  totalTyped:  0,
  wpm:         0,
  accuracy:    100,
  position:    0,
  finished:    false,
  finishTime:  null,
  customText:  null,          // F010: pending custom race text

  // Items & powerups
  heldItem:       null,
  speedMult:      1.0,
  slowed:         false,
  boosted:        false,
  collectedBoxes: [],

  // Bots (AI mode only)
  bots: [],

  // Race loop handles
  raceStartTime: null,
  raceLastFrame: null,
  raceRafId:     null,
  elapsedTimer:  null,
  finishOrder:   [],

  // Online
  onlinePlayers: {},
  peer:          null,
  connections:   [],
  isHost:        false,
  myPeerId:      null,
};
