// MAPPING

const game = document.getElementById("game");
const COLS = 16;
const ROWS = 9;
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

let lastTime = performance.now();

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

// ENEMY

function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (enemy.targetIndex < path.length) {
    const target = path[enemy.targetIndex];
    const targetX = target.x * 60;
    const targetY = target.y * 60;

    const distX = targetX - enemy.x;
    const distY = targetY - enemy.y;
    const dist = Math.hypot(distX, distY);

    if (dist < 1) {
      enemy.targetIndex++;
    } else {
      enemy.x += (distX / dist) * enemy.speed * delta;
      enemy.y += (distY / dist) * enemy.speed * delta;
    }
  } else {
    enemy.remove();
  }

  enemy.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

const enemy = document.createElement("div");
enemy.className = "enemy";
game.appendChild(enemy);
enemy.x = path[0].x * 60;
enemy.y = path[0].y * 60;
enemy.targetIndex = 1;
enemy.speed = 90;

/* 
mark path tiles 
movement function --> new function, run while i < enemies[] 



*/
