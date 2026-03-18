// js/items.js
// Item pickup, use, effect application for player and bots.

function useItem() {
  if (!G.heldItem || G.screen !== 'race') return;
  const item = G.heldItem;
  G.heldItem = null;
  updateItemDisplay();
  SFX.item();
  applyItemEffect(item, true);
  showSplash(item);
}

function applyItemEffect(item, isPlayer) {
  const slowPlayer = (mult, dur) => {
    G.slowed = true;
    G.speedMult = mult;
    SFX.hit();
    SFX.slow();
    setTimeout(() => { G.slowed = false; G.speedMult = 1; }, dur);
  };

  switch (item.eff) {
    case 'nitro':
      if (isPlayer) {
        G.speedMult = 1.5; G.boosted = true; SFX.boost();
        setTimeout(() => { G.speedMult = 1; G.boosted = false; }, item.dur);
      }
      break;

    case 'overdrive':
      if (isPlayer) {
        G.speedMult = 2.2; G.boosted = true; SFX.star();
        setTimeout(() => { G.speedMult = 1; G.boosted = false; }, item.dur);
      }
      break;

    case 'magnet':
      if (isPlayer) {
        G.speedMult = 1.8; G.boosted = true; SFX.boost();
        setTimeout(() => { G.speedMult = 1; G.boosted = false; }, item.dur);
      } else {
        slowPlayer(.3, item.dur);
      }
      break;

    case 'missile':
      if (isPlayer) {
        // Hit the nearest bot ahead of the player
        const ahead = G.bots
          .filter(b => !b.finished && b.position > G.position)
          .sort((a, b) => a.position - b.position)[0];
        if (ahead) {
          ahead.slowed = true; ahead.speedMult = .35; SFX.hit();
          setTimeout(() => { ahead.slowed = false; ahead.speedMult = 1; }, item.dur);
        }
      } else if (G.position > 0) {
        slowPlayer(.35, item.dur);
      }
      break;

    case 'emp':
      if (isPlayer) {
        G.bots.filter(b => !b.finished).forEach(b => {
          b.slowed = true; b.speedMult = .45;
          setTimeout(() => { b.slowed = false; b.speedMult = 1; }, item.dur);
        });
        SFX.hit();
      } else {
        slowPlayer(.45, item.dur);
      }
      break;

    case 'oilslick':
      if (isPlayer) {
        // Slow the nearest bot behind the player
        const behind = G.bots
          .filter(b => !b.finished && b.position < G.position)
          .sort((a, b) => b.position - a.position)[0];
        if (behind) {
          behind.slowed = true; behind.speedMult = .55; SFX.hit();
          setTimeout(() => { behind.slowed = false; behind.speedMult = 1; }, item.dur);
        }
      } else if (G.position > 0) {
        slowPlayer(.55, item.dur);
      }
      break;
  }
}

function applyBotItem(bot, item) {
  const isOffensive = ['magnet','missile','emp','oilslick'].includes(item.eff);
  if (isOffensive) {
    applyItemEffect(item, false);
  } else {
    bot.speedMult = 1.45; bot.boosted = true;
    setTimeout(() => { bot.speedMult = 1; bot.boosted = false; }, item.dur);
  }
}
