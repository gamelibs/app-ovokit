// modules/core/board-3d/logic.ts
var logic_default = {
  name: "board-3d",
  install(ctx) {
    ctx.logger.info("[board-3d] install");
    const api = createAPI(ctx);
    ctx.system["board-3d"] = api;
  },
  init(ctx) {
    ctx.logger.info("[board-3d] init");
  },
  start(ctx) {
    const api = ctx.system["board-3d"];
    if (api && typeof api.onSceneStart === "function") {
      api.onSceneStart(ctx.scene?.id);
    }
  },
  stop(ctx) {
    const api = ctx.system["board-3d"];
    if (api && typeof api.onSceneStop === "function") {
      api.onSceneStop();
    }
  },
  destroy(ctx) {
    const api = ctx.system["board-3d"];
    if (api && typeof api.destroyRenderer === "function") {
      api.destroyRenderer();
    }
    delete ctx.system["board-3d"];
  }
};
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  function getString(key, fallback = "") {
    const v = ctx.data.get(key);
    return typeof v === "string" ? v : fallback;
  }
  function getCells() {
    const raw = ctx.data.get("boardCells");
    return Array.isArray(raw) ? raw : [];
  }
  function rows() {
    return getNumber("boardRows", 3);
  }
  function cols() {
    return getNumber("boardCols", 3);
  }
  function winLength() {
    return getNumber("winLength", 3);
  }
  function boardArea() {
    return {
      x: getNumber("boardX", 175),
      y: getNumber("boardY", 592),
      w: getNumber("boardWidth", 400),
      h: getNumber("boardHeight", 400)
    };
  }
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  function checkWinner(cells, r, c, player) {
    const R = rows();
    const C = cols();
    const W = winLength();
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];
    const idx = (rr, cc) => rr * C + cc;
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < W; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        if (rr < 0 || rr >= R || cc < 0 || cc >= C) break;
        if (cells[idx(rr, cc)] === player) count++;
        else break;
      }
      for (let i = 1; i < W; i++) {
        const rr = r - dr * i;
        const cc = c - dc * i;
        if (rr < 0 || rr >= R || cc < 0 || cc >= C) break;
        if (cells[idx(rr, cc)] === player) count++;
        else break;
      }
      if (count >= W) return player;
    }
    return null;
  }
  let renderer = null;
  let scene = null;
  let camera = null;
  let boardGroup = null;
  let piecesGroup = null;
  let cellMeshes = [];
  let overlayCanvas = null;
  let rafId = null;
  let tweens = [];
  let winPulsePlayer = null;
  let pulseClock = 0;
  let onPointerDown = null;
  let onResize = null;
  function getThree() {
    return ctx.engine.three;
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function addTween(duration, ease, update, onDone) {
    tweens.push({ duration, elapsed: 0, ease, update, onDone });
  }
  function layoutOverlay() {
    if (!overlayCanvas) return;
    const mainCanvas = ctx.canvas;
    if (!mainCanvas || !mainCanvas.parentElement) return;
    const parent = mainCanvas.parentElement;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const canvasRect = mainCanvas.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const designW = Number(mainCanvas.dataset.designWidth || mainCanvas.width) || 750;
    const scale = canvasRect.width / designW;
    const area = boardArea();
    overlayCanvas.style.left = `${canvasRect.left - parentRect.left + area.x * scale}px`;
    overlayCanvas.style.top = `${canvasRect.top - parentRect.top + area.y * scale}px`;
    overlayCanvas.style.width = `${area.w * scale}px`;
    overlayCanvas.style.height = `${area.h * scale}px`;
    if (renderer) {
      renderer.setSize(Math.max(1, area.w * scale), Math.max(1, area.h * scale), false);
    }
  }
  function cellLocalPos(r, c) {
    const R = rows();
    const C = cols();
    return { x: c - (C - 1) / 2, z: r - (R - 1) / 2 };
  }
  function buildPiece(THREE, player) {
    const xColor = getString("playerXColor", "#ff2d55");
    const oColor = getString("playerOColor", "#00f2ff");
    const color = player === "X" ? xColor : oColor;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15 });
    if (player === "O") {
      const geo2 = new THREE.TorusGeometry(0.3, 0.09, 16, 40);
      const mesh = new THREE.Mesh(geo2, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.12;
      return mesh;
    }
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.62, 0.12, 0.16);
    const bar1 = new THREE.Mesh(geo, mat);
    bar1.rotation.y = Math.PI / 4;
    const bar2 = new THREE.Mesh(geo, mat);
    bar2.rotation.y = -Math.PI / 4;
    group.add(bar1);
    group.add(bar2);
    group.position.y = 0.12;
    return group;
  }
  function addPieceMesh(r, c, player, animate = true) {
    const THREE = getThree();
    if (!THREE || !piecesGroup) return;
    const piece = buildPiece(THREE, player);
    const pos = cellLocalPos(r, c);
    piece.position.x = pos.x;
    piece.position.z = pos.z;
    if (piece.position.y === 0) piece.position.y = 0.12;
    piece.userData.player = player;
    if (animate) {
      piece.scale.set(0.01, 0.01, 0.01);
      addTween(0.3, easeOutBack, (k) => piece.scale.set(k, k, k));
    }
    piecesGroup.add(piece);
  }
  function rebuildPieces() {
    if (!piecesGroup) return;
    while (piecesGroup.children.length > 0) {
      piecesGroup.remove(piecesGroup.children[0]);
    }
    const cells = getCells();
    const R = rows();
    const C = cols();
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const v = cells[r * C + c];
        if (v) addPieceMesh(r, c, v, false);
      }
    }
  }
  function ensureRenderer() {
    const THREE = getThree();
    const mainCanvas = ctx.canvas;
    if (!THREE || !mainCanvas || !mainCanvas.parentElement) return false;
    if (renderer) return true;
    overlayCanvas = document.createElement("canvas");
    overlayCanvas.style.position = "absolute";
    overlayCanvas.style.pointerEvents = "auto";
    overlayCanvas.style.zIndex = "5";
    overlayCanvas.dataset.board3d = "1";
    mainCanvas.parentElement.appendChild(overlayCanvas);
    renderer = new THREE.WebGLRenderer({ canvas: overlayCanvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    scene = new THREE.Scene();
    const area = boardArea();
    camera = new THREE.PerspectiveCamera(42, area.w / area.h, 0.1, 100);
    camera.position.set(0, 3.4, 3.9);
    camera.lookAt(0, -0.15, 0);
    scene.add(new THREE.AmbientLight(16777215, 0.75));
    const dir = new THREE.DirectionalLight(16777215, 0.9);
    dir.position.set(3, 6, 4);
    scene.add(dir);
    boardGroup = new THREE.Group();
    boardGroup.rotation.x = -0.12;
    scene.add(boardGroup);
    const R = rows();
    const C = cols();
    const cellGeo = new THREE.BoxGeometry(0.86, 0.1, 0.86);
    const cellMat = new THREE.MeshStandardMaterial({ color: 1976635, roughness: 0.6, metalness: 0.2 });
    cellMeshes = [];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const mesh = new THREE.Mesh(cellGeo, cellMat);
        const pos = cellLocalPos(r, c);
        mesh.position.set(pos.x, 0, pos.z);
        mesh.userData = { row: r, col: c };
        boardGroup.add(mesh);
        cellMeshes.push(mesh);
      }
    }
    const baseGeo = new THREE.BoxGeometry(C + 0.3, 0.06, R + 0.3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 988970, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.09;
    boardGroup.add(base);
    piecesGroup = new THREE.Group();
    boardGroup.add(piecesGroup);
    const raycaster = new THREE.Raycaster();
    onPointerDown = (e) => {
      if (!overlayCanvas || !camera) return;
      const rect = overlayCanvas.getBoundingClientRect();
      const ndc = {
        x: (e.clientX - rect.left) / rect.width * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cellMeshes, false);
      if (hits.length === 0) return;
      const { row, col } = hits[0].object.userData;
      ctx.logger.info(`[board-3d] pick cell (${row},${col})`);
      emit("cell.click", { row, col, index: row * cols() + col });
    };
    overlayCanvas.addEventListener("pointerdown", onPointerDown);
    onResize = () => layoutOverlay();
    window.addEventListener("resize", onResize);
    layoutOverlay();
    startLoop();
    return true;
  }
  function startLoop() {
    if (rafId !== null) return;
    let last = performance.now();
    const tickFrame = (now) => {
      rafId = null;
      if (!renderer || !scene || !camera) return;
      const dt = Math.min(0.05, (now - last) / 1e3);
      last = now;
      if (tweens.length > 0) {
        const done = [];
        for (const tw of tweens) {
          tw.elapsed += dt;
          const k = Math.min(1, tw.elapsed / tw.duration);
          tw.update(tw.ease(k));
          if (k >= 1) done.push(tw);
        }
        tweens = tweens.filter((tw) => !done.includes(tw));
        for (const tw of done) tw.onDone?.();
      }
      if (winPulsePlayer && piecesGroup) {
        pulseClock += dt;
        const s = 1 + Math.sin(pulseClock * 6) * 0.12;
        for (const piece of piecesGroup.children) {
          if (piece.userData.player === winPulsePlayer) piece.scale.set(s, s, s);
        }
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tickFrame);
    };
    rafId = requestAnimationFrame(tickFrame);
  }
  function playRotateJuice() {
    if (!boardGroup) return;
    const from = boardGroup.rotation.y;
    const to = from + Math.PI / 2;
    addTween(0.55, easeInOutCubic, (k) => {
      boardGroup.rotation.y = from + (to - from) * k;
    });
  }
  function clearRendererState() {
    tweens = [];
    winPulsePlayer = null;
    pulseClock = 0;
    if (boardGroup) {
      boardGroup.rotation.y = 0;
    }
    rebuildPieces();
  }
  function destroyRenderer() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (overlayCanvas && onPointerDown) {
      overlayCanvas.removeEventListener("pointerdown", onPointerDown);
    }
    if (onResize) {
      window.removeEventListener("resize", onResize);
      onResize = null;
    }
    onPointerDown = null;
    if (renderer) {
      try {
        renderer.dispose();
      } catch {
      }
      renderer = null;
    }
    if (overlayCanvas) {
      overlayCanvas.remove();
      overlayCanvas = null;
    }
    scene = null;
    camera = null;
    boardGroup = null;
    piecesGroup = null;
    cellMeshes = [];
    tweens = [];
    winPulsePlayer = null;
  }
  function onSceneStart(sceneId) {
    if (sceneId !== "gameplay") return;
    if (ensureRenderer()) {
      clearRendererState();
      ctx.logger.info("[board-3d] gameplay renderer ready");
    } else {
      ctx.logger.warn("[board-3d] THREE \u672A\u5C31\u7EEA\uFF08engine \u9700\u4E3A threejs\uFF09");
    }
  }
  function onSceneStop() {
    winPulsePlayer = null;
    tweens = [];
  }
  return {
    reset(params) {
      const R = Number(params?.rows ?? 3);
      const C = Number(params?.cols ?? 3);
      const W = Number(params?.winLength ?? 3);
      const players = Array.isArray(params?.players) && params.players.length >= 2 ? params.players : ["X", "O"];
      ctx.data.set("boardRows", R);
      ctx.data.set("boardCols", C);
      ctx.data.set("winLength", W);
      ctx.data.set("boardCells", new Array(R * C).fill(null));
      ctx.data.set("currentPlayer", players[0]);
      ctx.data.set("players", players);
      ctx.data.set("winner", null);
      ctx.data.set("isDraw", false);
      ctx.data.set("lastMove", null);
      ctx.logger.info(`[board-3d] reset ${R}x${C}, winLength=${W}`);
      if (renderer) clearRendererState();
    },
    makeMove(params = {}) {
      const R = rows();
      const C = cols();
      const row = Number(params?.row ?? -1);
      const col = Number(params?.col ?? -1);
      if (row < 0 || row >= R || col < 0 || col >= C) {
        ctx.logger.warn(`[board-3d] invalid move (${row},${col})`);
        return;
      }
      const cells = getCells();
      const index = row * C + col;
      if (cells[index] !== null && cells[index] !== void 0) {
        ctx.logger.warn(`[board-3d] cell (${row},${col}) already occupied`);
        return;
      }
      const currentPlayer = getString("currentPlayer", "X");
      const player = params?.player ?? currentPlayer;
      cells[index] = player;
      ctx.data.set("boardCells", cells);
      ctx.data.set("lastMove", { row, col, player });
      emit("board.moveMade", { row, col, player });
      ctx.logger.info(`[board-3d] move (${row},${col}) player=${player}`);
      addPieceMesh(row, col, player, true);
      playRotateJuice();
      const winner = checkWinner(cells, row, col, player);
      if (winner) {
        ctx.data.set("winner", winner);
        winPulsePlayer = winner;
        emit("board.win", { winner, cells });
        ctx.logger.info(`[board-3d] winner ${winner}`);
        return;
      }
      const isDraw = cells.every((cell) => cell !== null && cell !== void 0);
      if (isDraw) {
        ctx.data.set("isDraw", true);
        emit("board.draw", { cells });
        ctx.logger.info("[board-3d] draw");
        return;
      }
      const players = ctx.data.get("players") || ["X", "O"];
      const nextIndex = (players.indexOf(player) + 1) % players.length;
      ctx.data.set("currentPlayer", players[nextIndex]);
    },
    checkStatus() {
      const cells = getCells();
      const lastMove = ctx.data.get("lastMove");
      if (lastMove) {
        const winner = checkWinner(cells, lastMove.row, lastMove.col, lastMove.player);
        if (winner) {
          ctx.data.set("winner", winner);
          winPulsePlayer = winner;
          emit("board.win", { winner, cells });
          return;
        }
      }
      const isDraw = cells.every((cell) => cell !== null && cell !== void 0);
      ctx.data.set("isDraw", isDraw);
      if (isDraw) emit("board.draw", { cells });
    },
    onSceneStart,
    onSceneStop,
    destroyRenderer
  };
}
export {
  logic_default as default
};
