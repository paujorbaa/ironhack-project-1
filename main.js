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
  { x: 1, y: 6 },
  { x: 9, y: 6 },
  { x: 9, y: 8 },
];

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

// ENEMY

let lastTime = performance.now();

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
