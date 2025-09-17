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

const enemyTypes = {
  small: { hp: 10, speed: 90, lives: 1, class: "enemy small" },
  medium: { hp: 30, speed: 60, lives: 5, class: "enemy medium" },
  quick: { hp: 20, speed: 120, lives: 3, class: "enemy quick" },
  boss: { hp: 120, speed: 35, lives: 999, class: "enemy boss" },
};

const enemies = [];

let currentWave = 0;
let currentBatch = 0;
let remaining = 0;
let spawnTimer = 0;
let spawning = false;

let money = 100;
let lives = 10;

const waves = [
  [
    { type: "small", count: 1, interval: 1.0 },
    { type: "quick", count: 1, interval: 0.7, startDelay: 4 },
  ],
  [
    { type: "medium", count: 6, interval: 1.2 },
    { type: "quick", count: 6, interval: 0.9, startDelay: 6 },
  ],
  [
    { type: "small", count: 5, interval: 1.0 },
    { type: "medium", count: 3, interval: 1.2 },
    { type: "boss", count: 1, interval: 1, startDelay: 6 },
    { type: "quick", count: 3, interval: 0.9, startDelay: 6 },
  ],
];

let lastTime = performance.now();

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
  updateHUD;
  startWave(0);
  requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener("click", () => {
  location.reload();
});

// GRID

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

buildGrid();

// PATH

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

// ENEMIES

function spawnEnemy(type) {
  const stats = enemyTypes[type];
  const enemyElem = document.createElement("div");
  enemyElem.className = stats.class;
  game.appendChild(enemyElem);

  const enemy = {
    x: path[0].x * TILE,
    y: path[0].y * TILE,
    targetIndex: 1,
    speed: stats.speed,
    hp: stats.hp,
    lives: stats.lives,
    enemyElem: enemyElem,
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

function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // SPAWNING
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
          console.log("All waves finished!");
        }
      }
    }
  }
  // MOVEMENT
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
      continue;
    }

    if (enemy.hp <= 0) {
      money += reward;
      updateHUD;
      enemy.enemyElem.remove();
      enemies.splice(i, 1);
    }
  }
  requestAnimationFrame(gameLoop);
}

buildGrid();
markPathTiles();
