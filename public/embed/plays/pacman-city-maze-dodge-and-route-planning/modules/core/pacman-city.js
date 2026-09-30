// modules/core/pacman-city/logic.ts
var logic_default = {
  name: "pacman-city",
  install(ctx) {
    ctx.logger.info("[pacman-city] install");
    ctx.system["pacman-city"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[pacman-city] init");
  },
  start(ctx) {
    ctx.logger.info("[pacman-city] start");
  },
  update(ctx, dt) {
    const api = ctx.system["pacman-city"];
    if (api) api.update(dt);
  },
  stop(ctx) {
    ctx.logger.info("[pacman-city] stop");
  },
  destroy(ctx) {
    delete ctx.system["pacman-city"];
  }
};
var CELL_SIZE = 32;
var WORLD_CELLS = 25;
var WORLD_SIZE = WORLD_CELLS * CELL_SIZE;
var HALF_WORLD = WORLD_SIZE / 2;
var PLAYER_RADIUS = 12;
var PLAYER_SPEED = 180;
var ENEMY_RADIUS = 12;
var ENEMY_SPEED_NORMAL = 100;
var ENEMY_SPEED_FRIGHTENED = 65;
var ENEMY_SPEED_CHASE = 120;
var POWER_DURATION = 8;
var START_LIVES = 3;
var START_TIME = 120;
var SPAWN_PROTECTION = 1.5;
var DIRECTIONS = [
  { x: 1, y: 0, angle: 0 },
  { x: 0, y: 1, angle: 90 },
  { x: -1, y: 0, angle: 180 },
  { x: 0, y: -1, angle: 270 }
];
function cellKey(r, c) {
  return `${r},${c}`;
}
function dist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  function getBoolean(key, fallback = false) {
    const v = ctx.data.get(key);
    return typeof v === "boolean" ? v : fallback;
  }
  function getGameState() {
    const raw = ctx.data.get("__pacmanState");
    if (raw && typeof raw === "object") return raw;
    return createGameState();
  }
  function setGameState(state) {
    ctx.data.set("__pacmanState", state);
  }
  function createMaze() {
    const cells = [];
    const cellMap = /* @__PURE__ */ new Map();
    for (let r = 0; r < WORLD_CELLS; r++) {
      for (let c = 0; c < WORLD_CELLS; c++) {
        const blockRow = r % 4 === 0;
        const blockCol = c % 4 === 0;
        const wall = blockRow && blockCol ? false : blockRow || blockCol;
        const x = c * CELL_SIZE - HALF_WORLD + CELL_SIZE / 2;
        const y = r * CELL_SIZE - HALF_WORLD + CELL_SIZE / 2;
        const cell = { r, c, x, y, wall, dot: false, power: false };
        cells.push(cell);
        cellMap.set(cellKey(r, c), cell);
      }
    }
    for (const cell of cells) {
      if (cell.wall) continue;
      const isCorner = cell.r % 4 === 0 && cell.c % 4 === 0;
      if (!isCorner) {
        cell.dot = true;
      }
    }
    const powerCenters = [
      { r: 4, c: 4 },
      { r: 4, c: WORLD_CELLS - 5 },
      { r: WORLD_CELLS - 5, c: 4 },
      { r: WORLD_CELLS - 5, c: WORLD_CELLS - 5 }
    ];
    for (const p of powerCenters) {
      const cell = cellMap.get(cellKey(p.r, p.c));
      if (cell) {
        cell.dot = false;
        cell.power = true;
      }
    }
    return { cells, cellMap };
  }
  function createEnemies() {
    const enemies = [];
    const colors = ["red", "pink", "cyan", "orange"];
    const starts = [
      { x: 0, y: -HALF_WORLD + CELL_SIZE * 4 },
      { x: HALF_WORLD - CELL_SIZE * 4, y: 0 },
      { x: -HALF_WORLD + CELL_SIZE * 4, y: 0 },
      { x: 0, y: HALF_WORLD - CELL_SIZE * 4 }
    ];
    for (let i = 0; i < 4; i++) {
      enemies.push({
        id: `enemy_${colors[i]}`,
        x: starts[i].x,
        y: starts[i].y,
        dir: DIRECTIONS[i],
        state: "scatter",
        respawnTimer: 0,
        spawnTimer: SPAWN_PROTECTION
      });
    }
    return enemies;
  }
  function createGameState() {
    const { cells, cellMap } = createMaze();
    return {
      cells,
      cellMap,
      enemies: createEnemies(),
      powerMode: false,
      powerTime: 0,
      lives: START_LIVES,
      score: 0,
      timeRemaining: START_TIME,
      isGameActive: false,
      tickAccumulator: 0,
      gameOverEmitted: false,
      level: 1,
      spawnProtection: SPAWN_PROTECTION
    };
  }
  function countDots(state) {
    return state.cells.filter((c) => c.dot).length;
  }
  function getCellAt(state, x, y) {
    const c = Math.floor((x + HALF_WORLD) / CELL_SIZE);
    const r = Math.floor((y + HALF_WORLD) / CELL_SIZE);
    return state.cellMap.get(cellKey(r, c));
  }
  function isValidPosition(state, x, y, radius) {
    if (x < -HALF_WORLD + radius || x > HALF_WORLD - radius) return false;
    if (y < -HALF_WORLD + radius || y > HALF_WORLD - radius) return false;
    const samples = [
      { x: x + radius, y },
      { x: x - radius, y },
      { x, y: y + radius },
      { x, y: y - radius }
    ];
    for (const s of samples) {
      const cell = getCellAt(state, s.x, s.y);
      if (cell?.wall) return false;
    }
    return true;
  }
  function pickEnemyDirection(state, enemy, playerX, playerY) {
    const candidates = DIRECTIONS.filter((d) => {
      const nx = enemy.x + d.x * CELL_SIZE * 0.6;
      const ny = enemy.y + d.y * CELL_SIZE * 0.6;
      return isValidPosition(state, nx, ny, ENEMY_RADIUS);
    });
    if (candidates.length === 0) return { x: -enemy.dir.x, y: -enemy.dir.y };
    const noReverse = candidates.filter((d) => !(d.x === -enemy.dir.x && d.y === -enemy.dir.y));
    const choices = noReverse.length > 0 ? noReverse : candidates;
    if (enemy.state === "frightened") {
      let best = choices[0];
      let bestDist = -Infinity;
      for (const d of choices) {
        const nx = enemy.x + d.x * CELL_SIZE;
        const ny = enemy.y + d.y * CELL_SIZE;
        const dval = dist(nx, ny, playerX, playerY);
        if (dval > bestDist) {
          bestDist = dval;
          best = d;
        }
      }
      return best;
    }
    const chaseProbability = enemy.state === "chase" ? 0.95 : 0.5;
    if (Math.random() < chaseProbability) {
      let best = choices[0];
      let bestDist = Infinity;
      for (const d of choices) {
        const nx = enemy.x + d.x * CELL_SIZE;
        const ny = enemy.y + d.y * CELL_SIZE;
        const dval = dist(nx, ny, playerX, playerY);
        if (dval < bestDist) {
          bestDist = dval;
          best = d;
        }
      }
      return best;
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }
  function updateEnemies(state, sdt, playerX, playerY) {
    for (const enemy of state.enemies) {
      if (enemy.respawnTimer > 0) {
        enemy.respawnTimer -= sdt;
        continue;
      }
      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer -= sdt;
        continue;
      }
      const speed = state.powerMode ? ENEMY_SPEED_FRIGHTENED : dist(enemy.x, enemy.y, playerX, playerY) < CELL_SIZE * 6 ? ENEMY_SPEED_CHASE : ENEMY_SPEED_NORMAL;
      const oldState = enemy.state;
      enemy.state = state.powerMode ? "frightened" : dist(enemy.x, enemy.y, playerX, playerY) < CELL_SIZE * 8 ? "chase" : "scatter";
      const atJunction = Math.abs((enemy.x + HALF_WORLD) % CELL_SIZE - CELL_SIZE / 2) < 4 && Math.abs((enemy.y + HALF_WORLD) % CELL_SIZE - CELL_SIZE / 2) < 4;
      if (atJunction || oldState !== enemy.state || !isValidPosition(state, enemy.x + enemy.dir.x * speed * sdt, enemy.y + enemy.dir.y * speed * sdt, ENEMY_RADIUS)) {
        enemy.dir = pickEnemyDirection(state, enemy, playerX, playerY);
      }
      const nx = enemy.x + enemy.dir.x * speed * sdt;
      const ny = enemy.y + enemy.dir.y * sdt;
      if (isValidPosition(state, nx, ny, ENEMY_RADIUS)) {
        enemy.x = nx;
        enemy.y = ny;
      } else {
        enemy.dir = pickEnemyDirection(state, enemy, playerX, playerY);
      }
    }
  }
  function checkCollisions(state, playerX, playerY) {
    for (const cell of state.cells) {
      if (cell.wall) continue;
      if (cell.dot && dist(playerX, playerY, cell.x, cell.y) < PLAYER_RADIUS + CELL_SIZE * 0.25) {
        cell.dot = false;
        state.score += 10;
        emit("dot.eaten", { x: cell.x, y: cell.y, points: 10 });
      }
      if (cell.power && dist(playerX, playerY, cell.x, cell.y) < PLAYER_RADIUS + CELL_SIZE * 0.35) {
        cell.power = false;
        state.powerMode = true;
        state.powerTime = POWER_DURATION;
        state.score += 50;
        for (const e of state.enemies) {
          e.state = "frightened";
          e.spawnTimer = 0;
        }
        emit("powerup.eaten", { x: cell.x, y: cell.y, duration: POWER_DURATION });
      }
    }
    if (state.spawnProtection > 0) return;
    for (const enemy of state.enemies) {
      if (enemy.respawnTimer > 0 || enemy.spawnTimer > 0) continue;
      if (dist(playerX, playerY, enemy.x, enemy.y) < PLAYER_RADIUS + ENEMY_RADIUS - 2) {
        if (state.powerMode) {
          enemy.respawnTimer = 3;
          enemy.spawnTimer = SPAWN_PROTECTION;
          enemy.x = 0;
          enemy.y = 0;
          state.score += 200;
          emit("enemy.eaten", { enemyId: enemy.id, points: 200 });
        } else {
          emit("enemy.collide", { enemyId: enemy.id });
        }
      }
    }
  }
  function syncData(state) {
    ctx.data.set("score", state.score);
    ctx.data.set("lives", state.lives);
    ctx.data.set("dotsRemaining", countDots(state));
    ctx.data.set("powerMode", state.powerMode);
    ctx.data.set("powerTime", state.powerTime);
    ctx.data.set("timeRemaining", state.timeRemaining);
    ctx.data.set("isGameActive", state.isGameActive);
    ctx.data.set("level", state.level);
    ctx.data.set("enemies", state.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, state: e.state })));
  }
  return {
    reset() {
      const state = createGameState();
      const startCell = state.cellMap.get(cellKey(1, 1));
      const startX = startCell?.x ?? 0;
      const startY = startCell?.y ?? 0;
      ctx.data.set("pacmanX", startX);
      ctx.data.set("pacmanY", startY);
      ctx.data.set("pacmanSize", PLAYER_RADIUS);
      ctx.data.set("pacmanSpeed", PLAYER_SPEED);
      ctx.data.set("moveAngle", 0);
      state.lives = START_LIVES;
      state.score = 0;
      state.timeRemaining = START_TIME;
      state.isGameActive = true;
      state.gameOverEmitted = false;
      setGameState(state);
      syncData(state);
      ctx.logger.info("[pacman-city] reset");
    },
    setDirection(params) {
      const state = getGameState();
      if (!state.isGameActive) return;
      const dx = Number(params?.dx ?? 0);
      const dy = Number(params?.dy ?? 0);
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-3) return;
      const nx = dx / len;
      const ny = dy / len;
      const angle = Number(params?.angle ?? Math.atan2(ny, nx) * 180 / Math.PI);
      const playerX = getNumber("pacmanX", 0);
      const playerY = getNumber("pacmanY", 0);
      const testX = playerX + nx * CELL_SIZE * 0.6;
      const testY = playerY + ny * CELL_SIZE * 0.6;
      if (isValidPosition(state, testX, testY, PLAYER_RADIUS)) {
        ctx.data.set("moveAngle", angle);
        state.playerDesiredDir = { x: nx, y: ny };
        setGameState(state);
      }
    },
    handlePlayerDeath() {
      const state = getGameState();
      state.lives -= 1;
      state.powerMode = false;
      state.powerTime = 0;
      state.spawnProtection = 0;
      ctx.logger.info(`[pacman-city] player death, lives=${state.lives}`);
      if (state.lives <= 0) {
        state.isGameActive = false;
        if (!state.gameOverEmitted) {
          state.gameOverEmitted = true;
          emit("game.over", {});
        }
      } else {
        const startCell = state.cellMap.get(cellKey(1, 1));
        ctx.data.set("pacmanX", startCell?.x ?? 0);
        ctx.data.set("pacmanY", startCell?.y ?? 0);
        ctx.data.set("moveAngle", 0);
        const newEnemies = createEnemies();
        state.enemies = newEnemies;
        state.spawnProtection = SPAWN_PROTECTION;
      }
      syncData(state);
    },
    checkLevelComplete() {
      const state = getGameState();
      const remaining = countDots(state);
      if (remaining === 0) {
        state.level += 1;
        const { cells, cellMap } = createMaze();
        state.cells = cells;
        state.cellMap = cellMap;
        state.enemies = createEnemies();
        state.powerMode = false;
        state.powerTime = 0;
        const startCell = state.cellMap.get(cellKey(1, 1));
        ctx.data.set("pacmanX", startCell?.x ?? 0);
        ctx.data.set("pacmanY", startCell?.y ?? 0);
        ctx.data.set("moveAngle", 0);
        ctx.logger.info(`[pacman-city] level ${state.level}`);
      }
      syncData(state);
    },
    update(dt) {
      const state = getGameState();
      if (!state.isGameActive) return;
      const sdt = dt / 1e3;
      if (state.spawnProtection > 0) {
        state.spawnProtection -= sdt;
        if (state.spawnProtection < 0) state.spawnProtection = 0;
      }
      let playerX = getNumber("pacmanX", 0);
      let playerY = getNumber("pacmanY", 0);
      let moveAngle = getNumber("moveAngle", 0);
      const speed = getNumber("pacmanSpeed", PLAYER_SPEED);
      const rad = moveAngle * Math.PI / 180;
      let dx = Math.cos(rad);
      let dy = Math.sin(rad);
      if (state.playerDesiredDir) {
        const desired = state.playerDesiredDir;
        const testX = playerX + desired.x * speed * sdt * 1.2;
        const testY = playerY + desired.y * speed * sdt * 1.2;
        if (isValidPosition(state, testX, testY, PLAYER_RADIUS)) {
          dx = desired.x;
          dy = desired.y;
          moveAngle = Math.atan2(dy, dx) * 180 / Math.PI;
          ctx.data.set("moveAngle", moveAngle);
          delete state.playerDesiredDir;
        }
      }
      const nx = playerX + dx * speed * sdt;
      const ny = playerY + dy * speed * sdt;
      if (isValidPosition(state, nx, ny, PLAYER_RADIUS)) {
        playerX = nx;
        playerY = ny;
      } else {
        if (isValidPosition(state, nx, playerY, PLAYER_RADIUS)) playerX = nx;
        else if (isValidPosition(state, playerX, ny, PLAYER_RADIUS)) playerY = ny;
      }
      ctx.data.set("pacmanX", playerX);
      ctx.data.set("pacmanY", playerY);
      if (state.powerMode) {
        state.powerTime -= sdt;
        if (state.powerTime <= 0) {
          state.powerMode = false;
          state.powerTime = 0;
          for (const e of state.enemies) e.state = "scatter";
        }
      }
      updateEnemies(state, sdt, playerX, playerY);
      checkCollisions(state, playerX, playerY);
      state.tickAccumulator += sdt;
      if (state.tickAccumulator >= 1) {
        state.tickAccumulator -= 1;
        state.timeRemaining -= 1;
        emit("game.tick", { remaining: state.timeRemaining });
        if (state.timeRemaining <= 0) {
          state.isGameActive = false;
          if (!state.gameOverEmitted) {
            state.gameOverEmitted = true;
            emit("game.over", {});
          }
        }
      }
      syncData(state);
      setGameState(state);
      globalThis.__PACMAN_DEBUG = {
        player: { x: playerX, y: playerY, angle: moveAngle },
        enemies: state.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, state: e.state })),
        dots: countDots(state),
        powerMode: state.powerMode,
        score: state.score,
        lives: state.lives,
        time: state.timeRemaining
      };
    }
  };
}
export {
  logic_default as default
};
