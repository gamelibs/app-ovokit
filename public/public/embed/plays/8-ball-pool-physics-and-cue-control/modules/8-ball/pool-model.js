// modules/8-ball/pool-model/logic.ts
var apiRef;
var logic_default = {
  name: "pool-model",
  install(ctx) {
    ctx.logger.info("[pool-model] install");
    apiRef = createPoolModelAPI(ctx);
    ctx.system["pool-model"] = apiRef;
    ctx.system["8-ball/pool-model"] = apiRef;
  },
  init(ctx) {
    ctx.logger.info("[pool-model] init");
  },
  start(ctx) {
    ctx.logger.info("[pool-model] start");
  },
  update(ctx, dt) {
    apiRef?.update(ctx, dt);
  },
  stop(ctx) {
    ctx.logger.info("[pool-model] stop");
  },
  destroy(ctx) {
    ctx.logger.info("[pool-model] destroy");
    delete ctx.system["pool-model"];
    delete ctx.system["8-ball/pool-model"];
    apiRef = void 0;
  }
};
function createPoolModelAPI(ctx) {
  const TABLE_WIDTH = 600;
  const TABLE_HEIGHT = 300;
  const BALL_RADIUS = 10;
  const POCKET_RADIUS = 14;
  const FRICTION = 0.9;
  const STOP_THRESHOLD = 5;
  const RESTITUTION = 0.9;
  const POCKET_MARGIN = 4;
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const value = ctx.data.get(key);
    return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
  }
  function getBoolean(key, fallback = false) {
    const value = ctx.data.get(key);
    return typeof value === "boolean" ? value : fallback;
  }
  function getBalls() {
    const value = ctx.data.get("balls");
    return Array.isArray(value) ? value : [];
  }
  function setBalls(balls) {
    ctx.data.set("balls", balls);
  }
  function buildPockets() {
    return [
      { x: 0, y: 0, radius: POCKET_RADIUS },
      { x: TABLE_WIDTH / 2, y: 0, radius: POCKET_RADIUS },
      { x: TABLE_WIDTH, y: 0, radius: POCKET_RADIUS },
      { x: 0, y: TABLE_HEIGHT, radius: POCKET_RADIUS },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT, radius: POCKET_RADIUS },
      { x: TABLE_WIDTH, y: TABLE_HEIGHT, radius: POCKET_RADIUS }
    ];
  }
  function colorForNumber(n) {
    const map = {
      0: "#ffffff",
      1: "#facc15",
      2: "#3b82f6",
      3: "#ef4444",
      4: "#a855f7",
      5: "#f97316",
      6: "#22c55e",
      7: "#7f1d1d",
      8: "#111827",
      9: "#facc15",
      10: "#3b82f6",
      11: "#ef4444",
      12: "#a855f7",
      13: "#f97316",
      14: "#22c55e",
      15: "#7f1d1d"
    };
    return map[n] ?? "#94a3b8";
  }
  function createRack(startX, startY) {
    const balls = [];
    const spacing = BALL_RADIUS * Math.sqrt(3);
    let id = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX + row * spacing;
        const y = startY + (col - row / 2) * BALL_RADIUS * 2;
        balls.push({
          id,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: BALL_RADIUS,
          number: id,
          color: colorForNumber(id),
          pocketed: false
        });
        id++;
      }
    }
    return balls;
  }
  function initBalls() {
    const cueBall = {
      id: 0,
      x: 150,
      y: TABLE_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      number: 0,
      color: "#ffffff",
      pocketed: false
    };
    const rack = createRack(450, TABLE_HEIGHT / 2);
    return [cueBall, ...rack];
  }
  return {
    /** 重置一局游戏 */
    resetGame() {
      const balls = initBalls();
      setBalls(balls);
      ctx.data.set("currentPlayer", 1);
      ctx.data.set("player1Group", null);
      ctx.data.set("player2Group", null);
      ctx.data.set("player1Pocketed", []);
      ctx.data.set("player2Pocketed", []);
      ctx.data.set("gameOver", false);
      ctx.data.set("winner", null);
      ctx.data.set("isBreakShot", true);
      ctx.data.set("groupsAssigned", false);
      ctx.data.set("foul", false);
      ctx.data.set("ballInHand", false);
      ctx.data.set("placingCueBall", false);
      ctx.data.set("aiming", false);
      ctx.data.set("power", 0);
      ctx.data.set("aimAngle", 0);
      ctx.data.set("gamePaused", false);
      ctx.data.set("aiThinking", false);
      ctx.data.set("shotInProgress", false);
      ctx.data.set("ballsMoving", false);
      ctx.data.set("eightBallPocketed", false);
      ctx.data.set("cueBallPocketed", false);
      ctx.data.set("hasPocketedOwnBall", false);
      ctx.data.set("pocketedThisTurn", []);
      ctx.data.set("currentPlayerClearedGroup", false);
      ctx.data.set("firstHitBall", null);
      ctx.logger.info("[pool-model] resetGame");
    },
    /** 放置母球（自由球） */
    placeCueBall(payload) {
      const x = typeof payload?.x === "number" ? payload.x : 150;
      const y = typeof payload?.y === "number" ? payload.y : TABLE_HEIGHT / 2;
      const balls = getBalls();
      const cue = balls.find((b) => b.id === 0);
      if (cue) {
        cue.x = Math.max(BALL_RADIUS, Math.min(TABLE_WIDTH - BALL_RADIUS, x));
        cue.y = Math.max(BALL_RADIUS, Math.min(TABLE_HEIGHT - BALL_RADIUS, y));
        cue.vx = 0;
        cue.vy = 0;
        cue.pocketed = false;
        setBalls(balls);
      }
      ctx.data.set("placingCueBall", false);
      ctx.data.set("ballInHand", false);
      ctx.logger.info("[pool-model] placeCueBall", { x, y });
    },
    /** 更新瞄准角度与力度 */
    updateAimAngleAndPower(payload) {
      const angle = typeof payload?.angle === "number" ? payload.angle : getNumber("aimAngle", 0);
      const power = typeof payload?.power === "number" ? payload.power : getNumber("power", 0);
      ctx.data.set("aimAngle", angle);
      ctx.data.set("power", Math.max(0, Math.min(18, power)));
      ctx.logger.info("[pool-model] updateAimAngleAndPower", { angle, power });
    },
    /** 玩家击球 */
    takeShot(_payload) {
      const angle = getNumber("aimAngle", 0);
      const power = getNumber("power", 0);
      const balls = getBalls();
      const cue = balls.find((b) => b.id === 0);
      if (!cue || cue.pocketed) return;
      const speed = power * 180;
      cue.vx = Math.cos(angle) * speed;
      cue.vy = Math.sin(angle) * speed;
      setBalls(balls);
      ctx.data.set("ballsMoving", true);
      ctx.data.set("shotInProgress", true);
      ctx.data.set("aiming", false);
      ctx.data.set("power", 0);
      events()?.emit("shot.taken", { angle, power, speed });
      ctx.logger.info("[pool-model] takeShot", { angle, power, speed });
    },
    /** AI 执行击球（由 ai-controller 触发后调用） */
    executeAIShot(payload) {
      const angle = typeof payload?.angle === "number" ? payload.angle : 0;
      const power = typeof payload?.power === "number" ? payload.power : 8;
      const balls = getBalls();
      const cue = balls.find((b) => b.id === 0);
      if (cue && !cue.pocketed) {
        const speed = power * 180;
        cue.vx = Math.cos(angle) * speed;
        cue.vy = Math.sin(angle) * speed;
        setBalls(balls);
      }
      ctx.data.set("ballsMoving", true);
      ctx.data.set("shotInProgress", true);
      ctx.data.set("aiThinking", false);
      ctx.logger.info("[pool-model] executeAIShot", { angle, power });
    },
    /** 物理更新（由 kernel update 驱动） */
    update(_ctx, dt) {
      if (!getBoolean("ballsMoving")) return;
      if (getBoolean("gamePaused")) return;
      const sdt = Math.min(dt / 1e3, 0.05);
      let balls = getBalls();
      const pockets = buildPockets();
      let maxSpeed = 0;
      for (const ball of balls) {
        if (ball.pocketed) continue;
        ball.x += ball.vx * sdt;
        ball.y += ball.vy * sdt;
        ball.vx *= 1 - FRICTION * sdt;
        ball.vy *= 1 - FRICTION * sdt;
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > maxSpeed) maxSpeed = speed;
        if (speed < STOP_THRESHOLD) {
          ball.vx = 0;
          ball.vy = 0;
        }
      }
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        if (a.pocketed) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          if (b.pocketed) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.radius + b.radius;
          if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (minDist - dist) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const velAlongNormal = dvx * nx + dvy * ny;
            if (velAlongNormal > 0) continue;
            const impulse = -(1 + RESTITUTION) * velAlongNormal / 2;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
        }
      }
      for (const ball of balls) {
        if (ball.pocketed) continue;
        if (ball.x < ball.radius + POCKET_MARGIN) {
          ball.x = ball.radius + POCKET_MARGIN;
          ball.vx = Math.abs(ball.vx) * RESTITUTION;
        } else if (ball.x > TABLE_WIDTH - ball.radius - POCKET_MARGIN) {
          ball.x = TABLE_WIDTH - ball.radius - POCKET_MARGIN;
          ball.vx = -Math.abs(ball.vx) * RESTITUTION;
        }
        if (ball.y < ball.radius + POCKET_MARGIN) {
          ball.y = ball.radius + POCKET_MARGIN;
          ball.vy = Math.abs(ball.vy) * RESTITUTION;
        } else if (ball.y > TABLE_HEIGHT - ball.radius - POCKET_MARGIN) {
          ball.y = TABLE_HEIGHT - ball.radius - POCKET_MARGIN;
          ball.vy = -Math.abs(ball.vy) * RESTITUTION;
        }
      }
      let pocketedThisTurn = [];
      for (const ball of balls) {
        if (ball.pocketed) continue;
        for (const pocket of pockets) {
          const dist = Math.hypot(ball.x - pocket.x, ball.y - pocket.y);
          if (dist < pocket.radius - ball.radius + 2) {
            ball.pocketed = true;
            ball.vx = 0;
            ball.vy = 0;
            pocketedThisTurn.push(ball.number);
            events()?.emit("ball.pocketed", { ballId: ball.id, number: ball.number });
            if (ball.id === 0) {
              ctx.data.set("cueBallPocketed", true);
            } else if (ball.number === 8) {
              ctx.data.set("eightBallPocketed", true);
            }
            break;
          }
        }
      }
      const cue = balls.find((b) => b.id === 0);
      if (cue && cue.pocketed) {
        cue.x = 150;
        cue.y = TABLE_HEIGHT / 2;
        cue.vx = 0;
        cue.vy = 0;
        cue.pocketed = false;
      }
      if (pocketedThisTurn.length > 0) {
        ctx.data.set("pocketedThisTurn", pocketedThisTurn);
      }
      setBalls(balls);
      if (maxSpeed < STOP_THRESHOLD) {
        ctx.data.set("ballsMoving", false);
        ctx.data.set("shotInProgress", false);
        events()?.emit("balls.stopped", { pocketed: pocketedThisTurn });
        ctx.logger.info("[pool-model] balls stopped", { pocketed: pocketedThisTurn });
      }
    },
    /** 检查球是否已静止（兼容旧调用） */
    checkBallsStopped() {
      if (getBoolean("ballsMoving") && getBoolean("shotInProgress")) {
        ctx.data.set("ballsMoving", false);
        events()?.emit("physics.shotComplete");
        ctx.logger.info("[pool-model] checkBallsStopped -> physics.shotComplete");
      }
    },
    /** 处理一次击球结果（兼容旧调用） */
    processShotResult() {
      const pocketed = [];
      ctx.data.set("pocketedThisTurn", pocketed);
      ctx.data.set("hasPocketedOwnBall", false);
      ctx.data.set("cueBallPocketed", false);
      ctx.data.set("eightBallPocketed", false);
      ctx.data.set("foul", false);
      ctx.logger.info("[pool-model] processShotResult", { pocketed });
    },
    /** 第一次有球落袋后分配球组（兼容旧调用） */
    assignGroups() {
      ctx.data.set("player1Group", "solid");
      ctx.data.set("player2Group", "stripe");
      ctx.data.set("groupsAssigned", true);
      ctx.logger.info("[pool-model] assignGroups");
    },
    /** 将本次落袋球计入对应玩家（兼容旧调用） */
    creditPocketedBalls() {
      const pocketed = (ctx.data.get("pocketedThisTurn") ?? []).length;
      const current = getNumber("currentPlayer", 1);
      const key = current === 1 ? "player1Pocketed" : "player2Pocketed";
      const list = ctx.data.get(key) ?? [];
      for (let i = 0; i < pocketed; i++) list.push({});
      ctx.data.set(key, list);
      ctx.data.set("hasPocketedOwnBall", pocketed > 0);
      ctx.logger.info("[pool-model] creditPocketedBalls", { current, total: list.length });
    }
  };
}
export {
  logic_default as default
};
