const game = document.getElementById("game");
const startScene = document.getElementById("scene-start");
const gameScene = document.getElementById("scene-gameplay");
const endScene = document.getElementById("scene-end");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const endMessage = document.getElementById("endMessage");
const hudMoney = document.getElementById("moneyVal");
const hudLives = document.getElementById("livesVal");
const hudWave = document.getElementById("waveVal");
const hudWaveTotal = document.getElementById("waveTotal");
const COLS = 16;
const ROWS = 9;
const TILE = 60;

const path = [
  { x: -2, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 7, y: 3 },
  { x: 7, y: 5 },
  { x: 1, y: 5 },
  { x: 1, y: 7 },
  { x: 4, y: 7 },
  { x: 4, y: 8 },
];

const enemies = [];

let currentWave = 0;
let currentBatch = 0;
let remaining = 0;
let spawnTimer = 0;
let spawning = false;

let money = 100;
let lives = 20;

const enemyTypes = {
  small: { hp: 100, speed: 90, lives: 1, class: "enemy small" },
  medium: { hp: 225, speed: 60, lives: 5, class: "enemy medium" },
  quick: { hp: 100, speed: 150, lives: 3, class: "enemy quick" },
  boss: { hp: 666, speed: 35, lives: 999, class: "enemy boss" },
};

const waves = [
  [
    { type: "small", count: 10, interval: 1, startDelay: 5 },
    { type: "medium", count: 5, interval: 3, startDelay: 0 },
  ],
  [
    { type: "medium", count: 10, interval: 1, startDelay: 5 },
    { type: "quick", count: 12, interval: 1, startDelay: 0.1 },
  ],
  [
    { type: "small", count: 3, interval: 1, startDelay: 3 },
    { type: "medium", count: 3, interval: 1, startDelay: 3 },
    { type: "quick", count: 3, interval: 1, startDelay: 3 },
    { type: "boss", count: 1, interval: 0.5, startDelay: 0.1 },
    { type: "medium", count: 8, interval: 2, startDelay: 5 },
    { type: "quick", count: 5, interval: 4, startDelay: 0.1 },
  ],
];

const towerTypes = {
  blade: { cost: 30, class: "tower blade", damage: 5, range: 1, rate: 0.5 },
  arrow: {
    cost: 40,
    class: "tower arrow",
    damage: 25,
    range: 5,
    rate: 1,
    pierce: 2,
  },
};

const towers = [];
let selectedTowerType = null;

let lastTime;

function updateHUD() {
  hudMoney.textContent = money;
  hudLives.textContent = lives;
  hudWave.textContent = Math.max(1, Math.min(currentWave + 1, waves.length));
  hudWaveTotal.textContent = waves.length;
}

function showScene(name, result) {
  startScene.classList.add("hidden");
  gameScene.classList.add("hidden");
  endScene.classList.add("hidden");

  if (name === "start") startScene.classList.remove("hidden");
  if (name === "gameplay") gameScene.classList.remove("hidden");
  if (name === "end") {
    endScene.classList.remove("hidden");
    endMessage.textContent = result === "win" ? "You Win!" : "Game Over!";
  }
}

startBtn.addEventListener("click", () => {
  showScene("gameplay");
  updateHUD();
  startWave(0);

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener("click", () => {
  location.reload();
});

function buildGrid(cols = COLS, rows = ROWS) {
  game.style.setProperty("--cols", cols);
  game.style.setProperty("--rows", rows);

  const frag = document.createDocumentFragment();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.x = x;
      tile.dataset.y = y;
      frag.appendChild(tile);
    }
  }
  game.replaceChildren(frag);
}

function markPathTiles() {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];

    if (a.y === b.y) {
      const startX = Math.min(a.x, b.x);
      const endX = Math.max(a.x, b.x);
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && a.y >= 0 && x < COLS && a.y < ROWS) {
          const selector = '.tile[data-x="' + x + '"][data-y="' + a.y + '"]';
          const tile = game.querySelector(selector);
          if (tile) {
            tile.classList.add("path");
          }
        }
      }
    }

    if (a.x === b.x) {
      const startY = Math.min(a.y, b.y);
      const endY = Math.max(a.y, b.y);
      for (let y = startY; y <= endY; y++) {
        if (a.x >= 0 && y >= 0 && a.x < COLS && y < ROWS) {
          const selector = '.tile[data-x="' + a.x + '"][data-y="' + y + '"]';
          const tile = game.querySelector(selector);
          if (tile) {
            tile.classList.add("path");
          }
        }
      }
    }
  }
}

markPathTiles();

function spawnEnemy(type) {
  const stats = enemyTypes[type];
  const enemyElem = document.createElement("div");
  enemyElem.className = stats.class;

  const hpbar = document.createElement("div");
  hpbar.className = "hpbar";
  const hpfill = document.createElement("div");
  hpfill.className = "hpbar-fill";
  hpbar.appendChild(hpfill);
  enemyElem.appendChild(hpbar);

  game.appendChild(enemyElem);

  const enemy = {
    x: path[0].x * TILE,
    y: path[0].y * TILE,
    targetIndex: 1,
    speed: stats.speed,
    hp: stats.hp,
    maxHp: stats.hp,
    lives: stats.lives,
    enemyElem: enemyElem,
    hpFill: hpfill,
  };

  enemies.push(enemy);
}

function startWave(waveIndex) {
  if (waveIndex !== undefined) {
    currentWave = waveIndex;
  }

  currentBatch = 0;
  const batch = waves[currentWave][currentBatch];
  remaining = batch.count;
  spawnTimer = batch.startDelay ? batch.startDelay : 0;
  spawning = true;
  updateHUD();
  console.log("Starting wave:", currentWave + 1);
}

function showDamage(enemy, dmg) {
  const dmgElem = document.createElement("div");
  dmgElem.className = "dmg";
  dmgElem.textContent = dmg;
  dmgElem.style.left = enemy.x + 20 + "px";
  dmgElem.style.top = enemy.y - 10 + "px";
  game.appendChild(dmgElem);
  setTimeout(() => dmgElem.remove(), 600);
}

function damageEnemy(enemy, dmg) {
  enemy.hp -= dmg;
  if (enemy.hpFill) {
    enemy.hpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  }
  enemy.enemyElem.classList.add("hit");
  setTimeout(() => enemy.enemyElem.classList.remove("hit"), 120);
  showDamage(enemy, dmg);
}

function bladeEffect(tower) {
  const pulse = document.createElement("div");
  pulse.className = "pulse";
  pulse.style.width = TILE * 3 + "px";
  pulse.style.height = TILE * 3 + "px";
  pulse.style.left = tower.x * TILE + 30 + "px";
  pulse.style.top = tower.y * TILE + 30 + "px";
  game.appendChild(pulse);
  setTimeout(() => pulse.remove(), 400);
}

function arrowEffect(tower) {
  const h = document.createElement("div");
  h.className = "beam";
  h.style.left = "0px";
  h.style.top = tower.y * TILE + 25 + "px";
  h.style.width = COLS * TILE + "px";
  h.style.height = "10px";
  game.appendChild(h);

  const v = document.createElement("div");
  v.className = "beam";
  v.style.left = tower.x * TILE + 25 + "px";
  v.style.top = "0px";
  v.style.width = "10px";
  v.style.height = ROWS * TILE + "px";
  game.appendChild(v);

  setTimeout(() => {
    h.remove();
    v.remove();
  }, 200);
}

function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (spawning) {
    spawnTimer -= delta;

    if (spawnTimer <= 0 && remaining > 0) {
      const batch = waves[currentWave][currentBatch];
      spawnEnemy(batch.type);
      remaining--;
      spawnTimer = batch.interval;
    }
    if (remaining === 0) {
      if (currentBatch < waves[currentWave].length - 1) {
        currentBatch++;
        const nextBatch = waves[currentWave][currentBatch];
        remaining = nextBatch.count;
        spawnTimer = nextBatch.startDelay ? nextBatch.startDelay : 0;
      } else if (enemies.length === 0) {
        spawning = false;
        currentWave++;
        if (currentWave < waves.length) {
          startWave(currentWave);
        } else {
          showScene("end", "win");
          console.log("All waves finished!");
        }
      }
    }
  }

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.targetIndex < path.length) {
      const target = path[enemy.targetIndex];
      const targetX = target.x * TILE;
      const targetY = target.y * TILE;

      const distX = targetX - enemy.x;
      const distY = targetY - enemy.y;
      const dist = Math.hypot(distX, distY);

      if (dist < 1) {
        enemy.targetIndex++;
      } else {
        enemy.x += (distX / dist) * enemy.speed * delta;
        enemy.y += (distY / dist) * enemy.speed * delta;
      }
      enemy.enemyElem.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.targetIndex >= path.length) {
      lives = Math.max(0, lives - (enemy.lives || 1));
      updateHUD();

      enemy.enemyElem.remove();
      enemies.splice(i, 1);
      if (lives <= 0) {
        showScene("end", "lose");
        return;
      }
      if (
        enemies.length === 0 &&
        !spawning &&
        currentWave >= waves.length - 1
      ) {
        showScene("end", "win");
        return;
      }
      continue;
    }

    if (enemy.hp <= 0) {
      money += 3;
      updateHUD();
      enemy.enemyElem.remove();
      enemies.splice(i, 1);
    }
  }

  for (let tower of towers) {
    const tData = towerTypes[tower.type];
    tower.cooldown -= delta;
    if (tower.cooldown <= 0) {
      if (tower.type === "blade") {
        let hit = false;
        for (let enemy of enemies) {
          const ex = Math.round(enemy.x / TILE);
          const ey = Math.round(enemy.y / TILE);
          const dx = Math.abs(tower.x - ex);
          const dy = Math.abs(tower.y - ey);
          if (dx <= 1 && dy <= 1) {
            damageEnemy(enemy, tData.damage);
            hit = true;
          }
        }
        if (hit) bladeEffect(tower);
      }
      if (tower.type === "arrow") {
        let hit = false;
        let hits = 0;
        for (let enemy of enemies) {
          if (hits >= tData.pierce) break;

          const ex = enemy.x / TILE;
          const ey = enemy.y / TILE;
          const dx = Math.abs(ex - tower.x);
          const dy = Math.abs(ey - tower.y);

          if (
            (dy < 0.5 && dx <= tData.range) ||
            (dx < 0.5 && dy <= tData.range)
          ) {
            damageEnemy(enemy, tData.damage);
            hit = true;
            hits++;
          }
        }
        if (hit) arrowEffect(tower);
      }
      tower.cooldown = tData.rate;
    }
  }

  requestAnimationFrame(gameLoop);
}

const towerMenu = document.getElementById("towerMenu");
towerMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-type]");
  if (!btn) return;
  selectedTowerType = btn.dataset.type;
  console.log("selected tower", selectedTowerType);
});

game.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile || !selectedTowerType) {
    return;
  }

  const x = parseInt(tile.dataset.x);
  const y = parseInt(tile.dataset.y);

  if (tile.classList.contains("path")) {
    return;
  }

  const towerData = towerTypes[selectedTowerType];
  if (money >= towerData.cost) {
    money -= towerData.cost;
    updateHUD();

    const towerElem = document.createElement("div");
    towerElem.className = towerData.class;
    towerElem.style.transform = `translate(${x * TILE}px, ${y * TILE}px)`;
    game.appendChild(towerElem);

    towers.push({
      x,
      y,
      type: selectedTowerType,
      elem: towerElem,
      cooldown: 0,
    });
  }
});

buildGrid();
markPathTiles();
