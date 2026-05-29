const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const GAME_W = 1024;
const SHOP_W = W - GAME_W;

const TANK_SIZE = 48;
const BULLET_SIZE = 14;
const EXPLOSION_SIZE = 64;

const BASE_PLAYER_SPEED = 220;
const BASE_BULLET_SPEED = 380;
const BASE_PLAYER_FIRE_RATE = 0.25;

const ENEMY_BASE_SPEED = 70;
const ENEMY_BULLET_SPEED = 220;
const ENEMY_BASE_FIRE_RATE = 1.8;
const ENEMY_BASE_SPAWN_INTERVAL = 2.0;
const SCORE_PER_KILL = 10;
const LEVEL_SCORE = 1000;
const PLAYER_MAX_HP = 5;

const ASSET_DIR = 'as-s/PNG/Default size/';

const imageFiles = {
  player: ASSET_DIR + 'tanks_tankGreen1.png',
  playerGrey: ASSET_DIR + 'tanks_tankGrey1.png',
  playerDesert: ASSET_DIR + 'tanks_tankDesert1.png',
  playerNavy: ASSET_DIR + 'tanks_tankNavy1.png',
  enemyGrey: ASSET_DIR + 'tanks_tankGrey1.png',
  enemyDesert: ASSET_DIR + 'tanks_tankDesert1.png',
  enemyNavy: ASSET_DIR + 'tanks_tankNavy1.png',
  bullet: ASSET_DIR + 'tank_bulletFly1.png',
  bg: ASSET_DIR + 'tanks_crateWood.png',
  explosion: Array.from({ length: 12 }, (_, i) =>
    ASSET_DIR + 'tank_explosion' + (i + 1) + '.png'
  ),
};

const SKIN_MAP = {
  green: 'player',
  grey: 'playerGrey',
  desert: 'playerDesert',
  navy: 'playerNavy',
};

const ENEMY_TYPES = ['enemyGrey', 'enemyDesert', 'enemyNavy'];

const UPGRADE_POOL = [
  { id: 'hp', name: 'Броня', desc: '+1 макс. HP', icon: '🛡️' },
  { id: 'heal', name: 'Ремонт', desc: '+3 HP', icon: '🔧' },
  { id: 'speed', name: 'Форсаж', desc: '+15% скорости', icon: '⚡' },
  { id: 'rapid', name: 'Автомат', desc: '-15% перезарядка', icon: '🔫' },
  { id: 'bullet', name: 'Рельса', desc: '+20% скорость пуль', icon: '💥' },
  { id: 'maxhp', name: 'Укрепление', desc: '+2 макс. HP', icon: '🏗️' },
];

const SHOP_PERKS = [
  { id: 'healKit', name: 'Аптечка', desc: '+1 HP', price: 30, icon: '💊' },
  { id: 'armorUp', name: 'Броня', desc: '+1 макс. HP', price: 80, icon: '🛡️' },
  { id: 'speedBoost', name: 'Ускоритель', desc: '+10% скорости', price: 100, icon: '⚡' },
  { id: 'rapidFire', name: 'Автомат', desc: '-10% перезарядка', price: 120, icon: '🔫' },
];

const SHOP_AMMO = [
  { id: 'standard', name: 'Стандарт', desc: 'Обычные пули', price: 0, icon: '●' },
  { id: 'armorPiercing', name: 'Бронебойный', desc: 'Двойной урон', price: 150, icon: '⦿' },
  { id: 'explosive', name: 'Взрывной', desc: 'Взрыв при попадании', price: 250, icon: '💥' },
  { id: 'rapid', name: 'Быстрый', desc: '+50% скорость пуль', price: 200, icon: '➤' },
];

const SKINS = [
  { id: 'green', name: 'Зелёный', price: 0, desc: 'Классика' },
  { id: 'grey', name: 'Серый', price: 50, desc: 'Стальной волк' },
  { id: 'desert', name: 'Пустынный', price: 100, desc: 'Песчаный лис' },
  { id: 'navy', name: 'Морской', price: 150, desc: 'Глубинный ужас' },
];

const TICKER_NEWS = [
  'Генштаб сообщает: вражеские танки перекрашены в розовый — для маскировки в поле тюльпанов',
  'Солдат Коля случайно выиграл сражение, споткнувшись о пульт от вражеского дрона',
  'Разведка: враг перешёл на картофельное топливо — танки едут, но пахнет жареным',
  'Враг построил танк из картона — развалился от первого комплимента',
  'Шойгу: «Наши танки быстрее, потому что мы не наливаем полный бак — меньше вес»',
  'Танкист Петров сбил вражеский самолёт консервной банкой — меткость за 100!',
  'Главком приказал заряжать пушки не снарядами, а мемами — враг умрёт от смеха',
  'Солдат Иванов продал вражеский танк на Avito за 500 рублей и коробку печенья',
  'Вражеский шпион маскировался под куст — полито удобрениями, сбежал',
  'Наши войска перешли на подземные лодки — враги в панике, рыбы в восторге',
  'Военком начал призывать кактусы — «они тоже колючие и стойкие»',
  'Генерал приказал выдать всем солдатам по коту — для поднятия боевого духа',
];

const images = {};

function loadAssets(callback) {
  const allFiles = [
    imageFiles.player, imageFiles.playerGrey, imageFiles.playerDesert, imageFiles.playerNavy,
    imageFiles.enemyGrey, imageFiles.enemyDesert, imageFiles.enemyNavy,
    imageFiles.bullet, imageFiles.bg, ...imageFiles.explosion,
  ];
  let loaded = 0;
  const total = allFiles.length;
  allFiles.forEach((src) => {
    const img = new Image();
    img.onload = () => { images[src] = img; loaded++; if (loaded >= total) callback(); };
    img.onerror = () => { images[src] = null; loaded++; if (loaded >= total) callback(); };
    img.src = src;
  });
}

const keys = {};
const mouse = { x: GAME_W / 2, y: H / 2, down: false };

document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (W / rect.width);
  mouse.y = (e.clientY - rect.top) * (H / rect.height);
});
canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --- Persistent wallet ---
let wallet = { coins: 0, skin: 'green', ammoUnlocked: ['standard'], perks: {} };

function saveWallet() {
  try { localStorage.setItem('tankWallet', JSON.stringify(wallet)); } catch(e) {}
}

function loadWallet() {
  try {
    const d = JSON.parse(localStorage.getItem('tankWallet'));
    if (d) { wallet.coins = d.coins || 0; wallet.skin = d.skin || 'green';
      wallet.ammoUnlocked = d.ammoUnlocked || ['standard']; wallet.perks = d.perks || {}; }
  } catch(e) {}
}
loadWallet();

// --- Click handler ---
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (W / rect.width);
  const cy = (e.clientY - rect.top) * (H / rect.height);

  if (game && game.state === 'levelup') {
    const cards = getUpgradeCards();
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h) {
        const opt = game.upgradeOptions[i];
        if (opt.id === 'hp' || opt.id === 'maxhp') {
          if (opt.id === 'hp') { player.maxHp++; player.hp = Math.min(player.hp + 1, player.maxHp); }
          if (opt.id === 'maxhp') { player.maxHp += 2; player.hp = Math.min(player.hp + 2, player.maxHp); }
        } else if (opt.id === 'heal') { player.hp = Math.min(player.hp + 3, player.maxHp); }
        else if (opt.id === 'speed') { player.speedMult *= 1.15; }
        else if (opt.id === 'rapid') { player.fireRateMult *= 0.85; }
        else if (opt.id === 'bullet') { player.bulletSpeedMult *= 1.2; }
        game.state = 'playing'; game.spawnTimer = 1; break;
      }
    }
    return;
  }

  if (game && game.state === 'menu') {
    const bx = (GAME_W - 300) / 2;
    if (cy >= 340 && cy <= 400) { initGame(); return; }
    if (cy >= 420 && cy <= 480) { game.state = 'skinShop'; return; }
    if (cy >= 500 && cy <= 560) { game.state = 'donate'; return; }
    return;
  }

  if (game && game.state === 'skinShop') {
    if (cx >= GAME_W - 160 && cx <= GAME_W - 20 && cy >= 20 && cy <= 56) { game.state = 'menu'; return; }
    for (let i = 0; i < SKINS.length; i++) {
      const s = SKINS[i];
      const by = 120 + i * 70;
      if (cx >= 200 && cx <= 500 && cy >= by && cy <= by + 50) {
        if (wallet.skin === s.id) break;
        if (s.price === 0 || wallet.coins >= s.price) {
          if (s.price > 0) { wallet.coins -= s.price; }
          wallet.skin = s.id; saveWallet();
          game.state = 'menu';
        }
        break;
      }
    }
    return;
  }

  if (game && game.state === 'donate') {
    if (cx >= GAME_W - 160 && cx <= GAME_W - 20 && cy >= 20 && cy <= 56) { game.state = 'menu'; return; }
    return;
  }

  // In-game shop clicks (right panel)
  if (game && (game.state === 'playing' || game.state === 'gameover') && cx >= GAME_W) {
    const mx = cx - GAME_W;
    let yOff = 90;
    for (const perk of SHOP_PERKS) {
      if (mx >= 10 && mx <= SHOP_W - 10 && cy >= yOff && cy <= yOff + 44) {
        if (wallet.coins >= perk.price) {
          if (perk.id === 'healKit' && player.hp < player.maxHp) {
            player.hp = Math.min(player.hp + 1, player.maxHp);
            wallet.coins -= perk.price; saveWallet();
          } else if (perk.id === 'armorUp') {
            player.maxHp++; player.hp++;
            wallet.coins -= perk.price; saveWallet();
          } else if (perk.id === 'speedBoost') {
            player.speedMult *= 1.1;
            wallet.coins -= perk.price; saveWallet();
          } else if (perk.id === 'rapidFire') {
            player.fireRateMult *= 0.9;
            wallet.coins -= perk.price; saveWallet();
          }
        }
        break;
      }
      yOff += 48;
    }

    let aOff = 90 + SHOP_PERKS.length * 48 + 30;
    for (let i = 0; i < SHOP_AMMO.length; i++) {
      const ammo = SHOP_AMMO[i];
      if (mx >= 10 && mx <= SHOP_W - 10 && cy >= aOff && cy <= aOff + 34) {
        if (wallet.ammoUnlocked.includes(ammo.id)) {
          game.equippedAmmo = ammo.id;
        } else if (wallet.coins >= ammo.price) {
          wallet.coins -= ammo.price;
          wallet.ammoUnlocked.push(ammo.id);
          saveWallet();
          game.equippedAmmo = ammo.id;
        }
        break;
      }
      aOff += 38;
    }
    return;
  }
});

function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function angle(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2;
}

let game;
let player;
let enemies;
let bullets;
let enemyBullets;
let explosions;
let frameCount;
let ticker;

function initGame() {
  game = {
    score: 0, hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
    state: 'playing', spawnTimer: 0,
    spawnInterval: ENEMY_BASE_SPAWN_INTERVAL,
    level: 0, nextLevelAt: LEVEL_SCORE,
    upgradeOptions: [], difficultyTimer: 0,
    equippedAmmo: 'standard',
  };
  const skinKey = SKIN_MAP[wallet.skin] || 'player';
  player = {
    x: GAME_W / 2, y: H - 80,
    w: TANK_SIZE, h: TANK_SIZE,
    angle: -Math.PI / 2, fireCooldown: 0,
    speedMult: 1, fireRateMult: 1, bulletSpeedMult: 1,
    hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
    skinKey: skinKey,
  };
  ticker = { text: TICKER_NEWS[0], x: W, index: 0, speed: 70 };
  enemies = []; bullets = []; enemyBullets = []; explosions = []; frameCount = 0;
}

// --- Ammo helpers ---
function getBulletDamage() {
  if (game.equippedAmmo === 'armorPiercing') return 2;
  return 1;
}

function getBulletSpeedMult() {
  if (game.equippedAmmo === 'rapid') return 1.5;
  return 1;
}

function isExplosiveAmmo() {
  return game.equippedAmmo === 'explosive';
}

function getEnemyHp() { return 1 + game.level; }
function getEnemySpeed() { return ENEMY_BASE_SPEED + game.level * 8; }
function getSpawnInterval() { return Math.max(0.4, ENEMY_BASE_SPAWN_INTERVAL - game.level * 0.12); }
function getEnemyFireRate() { return Math.max(0.6, ENEMY_BASE_FIRE_RATE - game.level * 0.1); }
function getEnemyBulletSpeed() { return ENEMY_BULLET_SPEED + game.level * 10; }

function spawnEnemy() {
  const size = TANK_SIZE;
  const type = ENEMY_TYPES[randInt(0, ENEMY_TYPES.length - 1)];
  enemies.push({
    x: rand(size, GAME_W - size), y: -size,
    w: size, h: size, angle: Math.PI / 2,
    speed: getEnemySpeed(), hp: getEnemyHp(), maxHp: getEnemyHp(),
    fireCooldown: rand(0.5, getEnemyFireRate()), imageKey: type,
  });
}

function spawnExplosion(x, y, big) {
  explosions.push({
    x, y, w: big ? 80 : EXPLOSION_SIZE, h: big ? 80 : EXPLOSION_SIZE,
    frame: 0, maxFrames: 12, timer: 0, frameDuration: 0.04,
  });
}

function shootBullet(from, angleDeg, isEnemy = false) {
  const speed = isEnemy ? getEnemyBulletSpeed() : BASE_BULLET_SPEED * player.bulletSpeedMult * getBulletSpeedMult();
  const arr = isEnemy ? enemyBullets : bullets;
  arr.push({
    x: from.x, y: from.y, w: BULLET_SIZE, h: BULLET_SIZE,
    vx: Math.cos(angleDeg) * speed, vy: Math.sin(angleDeg) * speed,
    isEnemy, explosive: !isEnemy && isExplosiveAmmo(),
  });
}

function getUpgradeCards() {
  const count = game.upgradeOptions.length;
  const cw = 220, ch = 240, gap = 30;
  const totalW = count * cw + (count - 1) * gap;
  const startX = (GAME_W - totalW) / 2;
  const baseY = H / 2 - 60;
  return game.upgradeOptions.map((_, i) => ({
    x: startX + i * (cw + gap), y: baseY, w: cw, h: ch,
  }));
}

function pickUpgrades() {
  const pool = [...UPGRADE_POOL];
  const chosen = [];
  for (let i = 0; i < 3; i++) { const idx = randInt(0, pool.length - 1); chosen.push(pool[idx]); pool.splice(idx, 1); }
  game.upgradeOptions = chosen;
}

function levelUp() {
  game.level++;
  game.nextLevelAt = (game.level + 1) * LEVEL_SCORE;
  game.spawnInterval = getSpawnInterval();
  pickUpgrades();
  game.state = 'levelup';
}

function endGame() {
  game.state = 'gameover';
  spawnExplosion(player.x, player.y);
}

function update(dt) {
  if (game.state === 'gameover' || game.state === 'victory' || game.state === 'levelup' || game.state === 'menu' || game.state === 'skinShop' || game.state === 'donate') return;

  frameCount++;

  game.difficultyTimer += dt;
  if (game.difficultyTimer > 5) { game.difficultyTimer = 0; game.spawnInterval = Math.max(0.4, game.spawnInterval - 0.1); }

  let dx = 0, dy = 0;
  if (keys['w'] || keys['W'] || keys['ArrowUp']) dy = -1;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) dy = 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx = -1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) dx = 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    player.x += dx * BASE_PLAYER_SPEED * player.speedMult * dt;
    player.y += dy * BASE_PLAYER_SPEED * player.speedMult * dt;
  }

  player.angle = angle(player.x, player.y, mouse.x, mouse.y);
  player.x = clamp(player.x, player.w / 2, GAME_W - player.w / 2);
  player.y = clamp(player.y, player.h / 2, H - player.h / 2);

  player.fireCooldown -= dt;
  if (mouse.down && player.fireCooldown <= 0) {
    shootBullet(player, player.angle, false);
    player.fireCooldown = BASE_PLAYER_FIRE_RATE * player.fireRateMult;
  }

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) { spawnEnemy(); game.spawnTimer = game.spawnInterval; }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const ang = angle(e.x, e.y, player.x, player.y); e.angle = ang;
    e.x += Math.cos(ang) * e.speed * dt; e.y += Math.sin(ang) * e.speed * dt;
    const enemyFireRate = getEnemyFireRate();
    e.fireCooldown -= dt;
    if (e.fireCooldown <= 0 && dist(e.x, e.y, player.x, player.y) < 350) {
      shootBullet(e, ang, true); e.fireCooldown = enemyFireRate + rand(0, 0.5);
    }
    if (e.x < -100 || e.x > GAME_W + 100 || e.y < -100 || e.y > H + 100) { enemies.splice(i, 1); continue; }
    if (aabb(e.x, e.y, e.w, e.h, player.x, player.y, player.w, player.h)) {
      player.hp = Math.max(0, player.hp - 1); spawnExplosion(e.x, e.y); enemies.splice(i, 1);
      if (player.hp <= 0) { endGame(); return; }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -50 || b.x > GAME_W + 50 || b.y < -50 || b.y > H + 50) { bullets.splice(i, 1); continue; }
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (aabb(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
        e.hp -= getBulletDamage();
        if (e.hp <= 0) {
          spawnExplosion(e.x, e.y); game.score += SCORE_PER_KILL;
          const coinDrop = randInt(1, 3); wallet.coins += coinDrop; saveWallet();
          enemies.splice(j, 1);
        } else if (b.explosive) {
          spawnExplosion(b.x, b.y, true);
          for (let k = enemies.length - 1; k >= 0; k--) {
            if (k !== j && dist(b.x, b.y, enemies[k].x, enemies[k].y) < 60) {
              enemies[k].hp -= 1;
              if (enemies[k].hp <= 0) {
                spawnExplosion(enemies[k].x, enemies[k].y);
                game.score += SCORE_PER_KILL;
                wallet.coins += randInt(1, 3); saveWallet();
                enemies.splice(k, 1);
              }
            }
          }
        }
        hit = true; break;
      }
    }
    if (hit) { bullets.splice(i, 1); if (game.score >= game.nextLevelAt) { levelUp(); return; } }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -50 || b.x > GAME_W + 50 || b.y < -50 || b.y > H + 50) { enemyBullets.splice(i, 1); continue; }
    if (aabb(b.x, b.y, b.w, b.h, player.x, player.y, player.w, player.h)) {
      player.hp = Math.max(0, player.hp - 1); enemyBullets.splice(i, 1);
      if (player.hp <= 0) { endGame(); return; }
    }
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i]; ex.timer += dt;
    ex.frame = Math.floor(ex.timer / ex.frameDuration);
    if (ex.frame >= ex.maxFrames) explosions.splice(i, 1);
  }

  updateTicker(dt);
}

function updateTicker(dt) {
  ticker.x -= ticker.speed * dt;
  ctx.font = '14px "Segoe UI", sans-serif';
  const tw = ctx.measureText(ticker.text).width;
  if (ticker.x + tw < -20) {
    ticker.index = (ticker.index + 1) % TICKER_NEWS.length;
    ticker.text = TICKER_NEWS[ticker.index]; ticker.x = W + 10;
  }
}

// ============ DRAWING ============

let bgPatches = null;
function generateBgPatches() {
  bgPatches = [];
  for (let i = 0; i < 25; i++) {
    bgPatches.push({
      x: rand(0, GAME_W), y: rand(0, H),
      rx: rand(30, 120), ry: rand(15, 60),
      a: rand(0, Math.PI * 2),
      color: `hsla(${randInt(25, 40)}, ${randInt(30, 60)}%, ${randInt(15, 28)}%, ${rand(0.15, 0.35)})`,
    });
  }
}

function drawBg() {
  const bgImg = images[imageFiles.bg];
  ctx.fillStyle = '#3d6b1e';
  ctx.fillRect(0, 0, GAME_W, H);
  if (bgImg) {
    ctx.save(); ctx.globalAlpha = 0.15;
    ctx.fillStyle = ctx.createPattern(bgImg, 'repeat');
    ctx.fillRect(0, 0, GAME_W, H); ctx.restore();
  }
  ctx.fillStyle = 'rgba(45, 80, 20, 0.15)';
  for (let y = 0; y < H; y += 80) ctx.fillRect(0, y + 20, GAME_W, 30);
  if (!bgPatches) generateBgPatches();
  for (const p of bgPatches) {
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, p.a, 0, Math.PI * 2); ctx.fill();
  }
  const grad = ctx.createRadialGradient(GAME_W / 2, H / 2, 200, GAME_W / 2, H / 2, 500);
  grad.addColorStop(0, 'transparent'); grad.addColorStop(0.7, 'transparent');
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, GAME_W, H);
  // Separator line
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(GAME_W, 0); ctx.lineTo(GAME_W, H); ctx.stroke();
}

function drawTank(tank, isPlayer) {
  const src = isPlayer ? imageFiles[tank.skinKey] || imageFiles.player : imageFiles[tank.imageKey];
  const img = images[src];
  const hw = tank.w / 2, hh = tank.h / 2;
  ctx.save(); ctx.translate(tank.x, tank.y); ctx.rotate(tank.angle);
  if (img) {
    const s = Math.max(tank.w / img.naturalWidth, tank.h / img.naturalHeight);
    ctx.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
  } else {
    ctx.fillStyle = isPlayer ? '#2ecc40' : '#888';
    ctx.fillRect(-hw, -hh, tank.w, tank.h);
    ctx.fillStyle = isPlayer ? '#27ae30' : '#666';
    ctx.fillRect(-hw * 0.2, -hh * 0.1, hw * 0.4, hh * 0.5);
  }
  ctx.restore();
  if (!isPlayer && tank.hp < tank.maxHp) {
    const bw = tank.w, bh = 4, bx = tank.x - bw / 2, by = tank.y - tank.h / 2 - 8;
    ctx.fillStyle = '#c00'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#0c0'; ctx.fillRect(bx, by, bw * (tank.hp / tank.maxHp), bh);
  }
}

function drawBullet(b) {
  const img = images[imageFiles.bullet];
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
  if (img) {
    const s = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight);
    ctx.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
  } else {
    ctx.fillStyle = b.isEnemy ? '#ff4444' : '#ffee44';
    ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawExplosion(ex) {
  if (ex.frame >= 12) return;
  const img = images[imageFiles.explosion[ex.frame]];
  if (img) {
    const s = Math.max(ex.w / img.naturalWidth, ex.h / img.naturalHeight);
    ctx.drawImage(img, ex.x - img.naturalWidth * s / 2, ex.y - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
  } else {
    const alpha = 1 - (ex.frame / 12);
    ctx.fillStyle = `rgba(255, ${150 - ex.frame * 10}, 0, ${alpha})`;
    ctx.beginPath(); ctx.arc(ex.x, ex.y, 20 + ex.frame * 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHud() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(10, 10, 260, 36);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('Очки: ' + game.score, 20, 28);

  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(280, 10, 180, 36);
  ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Ур. ' + game.level + ' | ⦿ ' + wallet.coins, 370, 28);

  const bx = 10, by = H - 48, bw = 200, bh = 24;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, bh);
  const hpRatio = player.hp / player.maxHp;
  ctx.fillStyle = hpRatio > 0.5 ? '#2ecc40' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(bx + 2, by + 2, (bw - 4) * hpRatio, bh - 4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HP: ' + player.hp + '/' + player.maxHp, bx + bw / 2, by + bh / 2);

  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(GAME_W - 160, 10, 150, 36);
  ctx.fillStyle = '#ccc'; ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('Враги: ' + enemies.length, GAME_W - 18, 28);

  const vx = GAME_W / 2 - 150, vy = H - 60, vw = 300, vh = 16;
  const progress = Math.min((game.score % LEVEL_SCORE) / LEVEL_SCORE, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(vx, vy, vw, vh);
  ctx.fillStyle = '#2ecc71'; ctx.fillRect(vx + 2, vy + 2, (vw - 4) * progress, vh - 4);
  ctx.fillStyle = '#fff'; ctx.font = '10px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('След. уровень: ' + Math.floor(progress * 100) + '%', vx + vw / 2, vy + vh / 2);

  // Ammo indicator
  const ammoName = SHOP_AMMO.find(a => a.id === game.equippedAmmo)?.name || 'Стандарт';
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(GAME_W - 160, 50, 150, 26);
  ctx.fillStyle = '#8af'; ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('Снаряд: ' + ammoName, GAME_W - 18, 63);
}

function drawShopPanel() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(GAME_W, 0, SHOP_W, H);
  ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🛒 МАГАЗИН', GAME_W + SHOP_W / 2, 25);
  ctx.fillStyle = '#ffe066'; ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText('⦿ ' + wallet.coins, GAME_W + SHOP_W / 2, 52);

  // Perks
  ctx.fillStyle = '#aaa'; ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('— ПЕРКИ —', GAME_W + 10, 78);
  let yOff = 90;
  for (const perk of SHOP_PERKS) {
    const canBuy = wallet.coins >= perk.price;
    const x = GAME_W + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, yOff, SHOP_W - 20, 44);
    ctx.fillStyle = '#ddd'; ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(perk.icon + ' ' + perk.name, x + 8, yOff + 16);
    ctx.fillStyle = '#aaa'; ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText(perk.desc, x + 8, yOff + 34);
    ctx.fillStyle = canBuy ? '#ffe066' : '#666';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(canBuy ? ('⦿' + perk.price) : 'Куплено', x + SHOP_W - 30, yOff + 18);
    yOff += 48;
  }

  // Ammo
  yOff += 10;
  ctx.fillStyle = '#aaa'; ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('— СНАРЯДЫ —', GAME_W + 10, yOff);
  yOff += 20;
  for (const ammo of SHOP_AMMO) {
    const unlocked = wallet.ammoUnlocked.includes(ammo.id);
    const equipped = game.equippedAmmo === ammo.id;
    const canBuy = wallet.coins >= ammo.price;
    const x = GAME_W + 10;
    ctx.fillStyle = equipped ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, yOff, SHOP_W - 20, 34);
    ctx.fillStyle = '#ddd'; ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(ammo.icon + ' ' + ammo.name, x + 8, yOff + 12);
    ctx.fillStyle = '#888'; ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(ammo.desc, x + 8, yOff + 26);
    ctx.textAlign = 'right';
    if (equipped) { ctx.fillStyle = '#2ecc40'; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('ЭКИП', x + SHOP_W - 30, yOff + 17); }
    else if (unlocked) { ctx.fillStyle = '#8af'; ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('Надеть', x + SHOP_W - 30, yOff + 17); }
    else { ctx.fillStyle = canBuy ? '#ffe066' : '#666'; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('⦿' + ammo.price, x + SHOP_W - 30, yOff + 17); }
    yOff += 38;
  }
}

function drawUpgradeScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 48px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('УРОВЕНЬ ' + game.level + '!', GAME_W / 2, 120);
  ctx.fillStyle = '#ddd'; ctx.font = '22px "Segoe UI", sans-serif';
  ctx.fillText('Выбери улучшение:', GAME_W / 2, 180);

  const cards = getUpgradeCards();
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]; const opt = game.upgradeOptions[i];
    ctx.fillStyle = 'rgba(30,30,50,0.9)'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.font = '48px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opt.icon, c.x + c.w / 2, c.y + 70);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(opt.name, c.x + c.w / 2, c.y + 130);
    ctx.fillStyle = '#aaa'; ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText(opt.desc, c.x + c.w / 2, c.y + 165);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(c.x, c.y + 200, c.w, 40);
    ctx.fillStyle = '#888'; ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Кликни чтобы выбрать', c.x + c.w / 2, c.y + 220);
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ПОРАЖЕНИЕ', GAME_W / 2, H / 2 - 40);
  ctx.fillStyle = '#fff'; ctx.font = '28px "Segoe UI", sans-serif';
  ctx.fillText('Очки: ' + game.score + ' | Уровень: ' + game.level, GAME_W / 2, H / 2 + 40);
  ctx.font = '20px "Segoe UI", sans-serif'; ctx.fillStyle = '#aaa';
  ctx.fillText('Нажми ПРОБЕЛ чтобы начать заново', GAME_W / 2, H / 2 + 100);
}

function drawMenu() {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
  // Decorative background tanks
  for (let i = 0; i < 6; i++) {
    const x = 150 + i * 200, y = H - 60 + Math.sin(i * 1.3) * 30;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.sin(frameCount * 0.01 + i) * 0.02})`;
    ctx.fillRect(x, y, 60, 35);
    ctx.fillRect(x + 10, y - 20, 15, 20);
  }
  ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 72px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ТАНКОВЫЙ БОЙ', GAME_W / 2, 160);
  ctx.fillStyle = '#aaa'; ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillText('Уничтожай врагов, покупай улучшения, побеждай!', GAME_W / 2, 210);

  ctx.fillStyle = '#888'; ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText('⦿ ' + wallet.coins + ' монет | Скин: ' + SKINS.find(s => s.id === wallet.skin)?.name, GAME_W / 2, 260);

  const bx = (GAME_W - 300) / 2;
  const buttons = [
    { y: 340, label: '🎮  ИГРАТЬ', color: '#2ecc40' },
    { y: 420, label: '🎨  МАГАЗИН СКИНОВ', color: '#3498db' },
    { y: 500, label: '💰  ДОНАТ', color: '#e67e22' },
  ];
  for (const btn of buttons) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(bx, btn.y, 300, 60);
    ctx.strokeStyle = btn.color; ctx.lineWidth = 2; ctx.strokeRect(bx, btn.y, 300, 60);
    ctx.fillStyle = btn.color; ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, GAME_W / 2, btn.y + 30);
  }
}

function drawSkinShop() {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3498db'; ctx.font = 'bold 40px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🎨 МАГАЗИН СКИНОВ', GAME_W / 2, 60);

  for (let i = 0; i < SKINS.length; i++) {
    const s = SKINS[i]; const by = 120 + i * 70;
    const owned = wallet.skin === s.id;
    const canBuy = wallet.coins >= s.price || s.price === 0;
    ctx.fillStyle = owned ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(200, by, 300, 50);
    ctx.strokeStyle = owned ? '#2ecc40' : '#555'; ctx.lineWidth = owned ? 2 : 1;
    ctx.strokeRect(200, by, 300, 50);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(s.name, 215, by + 18);
    ctx.fillStyle = '#aaa'; ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(s.desc, 215, by + 38);

    ctx.textAlign = 'right';
    if (owned) { ctx.fillStyle = '#2ecc40'; ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('✓ НАДЕТ', 490, by + 25); }
    else if (s.price === 0) { ctx.fillStyle = '#8af'; ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('БЕСПЛАТНО', 490, by + 25); }
    else if (canBuy) { ctx.fillStyle = '#ffe066'; ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('⦿' + s.price, 490, by + 25); }
    else { ctx.fillStyle = '#666'; ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('⦿' + s.price, 490, by + 25); }
  }

  ctx.fillStyle = '#fff'; ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⦿ Монет: ' + wallet.coins, GAME_W / 2, 440);

  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(GAME_W - 160, 20, 140, 36);
  ctx.fillStyle = '#e74c3c'; ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('← Назад', GAME_W - 90, 38);
}

function drawDonate() {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e67e22'; ctx.font = 'bold 40px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💰 ДОНАТ', GAME_W / 2, 120);

  ctx.fillStyle = '#ddd'; ctx.font = '20px "Segoe UI", sans-serif';
  ctx.fillText('Поддержи разработку абсурдных танковых баталий!', GAME_W / 2, 190);

  const donates = [
    { name: 'Рядовой', price: '100₽', desc: 'Именной танк в игре (виртуально)' },
    { name: 'Сержант', price: '500₽', desc: 'Скидка 10% в магазине скинов' },
    { name: 'Генерал', price: '1000₽', desc: 'Личный повар в штабе' },
    { name: 'Маршал', price: '10000₽', desc: 'Звание «Легенда» + золотой танк' },
  ];
  let dy = 270;
  for (const d of donates) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(GAME_W / 2 - 200, dy, 400, 60);
    ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1; ctx.strokeRect(GAME_W / 2 - 200, dy, 400, 60);
    ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(d.name, GAME_W / 2 - 180, dy + 20);
    ctx.fillStyle = '#aaa'; ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(d.desc, GAME_W / 2 - 180, dy + 42);
    ctx.fillStyle = '#e67e22'; ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(d.price, GAME_W / 2 + 180, dy + 20);

    // Fake "Купить" button
    ctx.fillStyle = 'rgba(231,76,60,0.8)'; ctx.fillRect(GAME_W / 2 + 120, dy + 30, 70, 22);
    ctx.fillStyle = '#fff'; ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Купить', GAME_W / 2 + 155, dy + 41);
    dy += 75;
  }

  ctx.fillStyle = '#888'; ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('* все донаты абсурдны и существуют только для атмосферы *', GAME_W / 2, 610);

  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(GAME_W - 160, 20, 140, 36);
  ctx.fillStyle = '#e74c3c'; ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('← Назад', GAME_W - 90, 38);
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) {
    const sx = Math.sin(frameCount * 0.02 + i * 2.1) * 400 + GAME_W / 2;
    const sy = Math.cos(frameCount * 0.017 + i * 1.7) * 250 + H / 2 - 40;
    const size = 2 + Math.sin(frameCount * 0.05 + i) * 1.5;
    ctx.fillStyle = `rgba(255,255,${150 + Math.sin(i) * 50},${0.3 + Math.sin(frameCount * 0.03 + i) * 0.3})`;
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 72px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ПОБЕДА!', GAME_W / 2, H / 2 - 50);
  ctx.fillStyle = '#fff'; ctx.font = '32px "Segoe UI", sans-serif';
  ctx.fillText('Счёт: ' + game.score + ' | Уровень: ' + game.level, GAME_W / 2, H / 2 + 30);
  ctx.font = '22px "Segoe UI", sans-serif'; ctx.fillStyle = '#ddd';
  ctx.fillText('Ты уничтожил все вражеские силы!', GAME_W / 2, H / 2 + 90);
  ctx.font = '20px "Segoe UI", sans-serif'; ctx.fillStyle = '#aaa';
  ctx.fillText('Нажми ПРОБЕЛ чтобы сыграть снова', GAME_W / 2, H / 2 + 150);
}

function drawTicker() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H - 22, W, 22);
  ctx.fillStyle = '#ffe066'; ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('⚡ ' + ticker.text + ' ⚡', ticker.x, H - 11);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  if (game.state === 'menu') { drawMenu(); return; }
  if (game.state === 'skinShop') { drawSkinShop(); return; }
  if (game.state === 'donate') { drawDonate(); return; }

  drawBg();

  for (const ex of explosions) drawExplosion(ex);
  for (const b of bullets) drawBullet(b);
  for (const b of enemyBullets) drawBullet(b);
  for (const e of enemies) drawTank(e, false);

  if (game.state === 'playing') drawTank(player, true);

  drawShopPanel();

  if (game.state !== 'victory' && game.state !== 'levelup') {
    drawHud(); drawTicker();
  }

  if (game.state === 'gameover') drawGameOver();
  else if (game.state === 'victory') drawVictory();
  else if (game.state === 'levelup') drawUpgradeScreen();
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp; dt = Math.min(dt, 0.05);
  update(dt); draw();
  requestAnimationFrame(gameLoop);
}

let lastTime = 0;

loadAssets(() => {
  game = { state: 'menu', score: 0, level: 0 };
  frameCount = 0;
  requestAnimationFrame(gameLoop);
});

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && game && (game.state === 'gameover' || game.state === 'victory')) {
    initGame();
  }
});
