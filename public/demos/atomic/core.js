/*!
 * AtomCore — OVO 原子核心试玩引擎 v1.0.0
 * 理念：大道至简。每个 demo 只演示一个行为原语/母型，手绘草图风格，参数可调。
 * 契约（app-ovoforge-site doc/h5-demo-development-guide.md）：
 *   - 纯静态、无服务器依赖、无外部请求
 *   - postMessage: 发出 demo:ready / demo:score / demo:complete；接收 demo:restart
 *   - 竖屏优先，触摸目标 ≥44px
 * 用法：
 *   <script src="../core.js"></script>
 *   AtomCore.create({
 *     title, objective, params: [{key,label,min,max,step,default,unit}],
 *     setup(game), update(game, dt), draw(game, g), onPointer(game, {x,y,type})
 *   })
 * game 暴露：W,H,score,lives,state('ready'|'playing'|'over'),params,data,rand(),reset(),endGame(),setScore(n)
 */
(function () {
  'use strict';

  var PAPER = '#faf7ef', INK = '#2b2b2b', YELLOW = '#ffda6a', RED = '#ff8b8b', BLUE = '#7cc4ff', GREEN = '#9be29b';

  // ---- 手绘风格绘制助手 ----
  function jitter(v) { return (Math.random() - 0.5) * v; }
  function makeG(ctx) {
    var g = {
      ctx: ctx,
      line: function (x1, y1, x2, y2, w) {
        ctx.strokeStyle = INK; ctx.lineWidth = w || 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1 + jitter(1.6), y1 + jitter(1.6));
        ctx.quadraticCurveTo((x1 + x2) / 2 + jitter(3), (y1 + y2) / 2 + jitter(3), x2 + jitter(1.6), y2 + jitter(1.6));
        ctx.stroke();
      },
      rect: function (x, y, w, h, fill, lw) {
        if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
        this.line(x, y, x + w, y, lw); this.line(x + w, y, x + w, y + h, lw);
        this.line(x + w, y + h, x, y + h, lw); this.line(x, y + h, x, y, lw);
      },
      circle: function (x, y, r, fill, lw) {
        ctx.beginPath();
        if (fill) { ctx.fillStyle = fill; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); }
        ctx.strokeStyle = INK; ctx.lineWidth = lw || 2;
        ctx.arc(x + jitter(1.2), y + jitter(1.2), r + jitter(1.2), 0, Math.PI * 2);
        ctx.stroke();
      },
      text: function (str, x, y, size, color, align) {
        ctx.fillStyle = color || INK;
        ctx.font = size + 'px Kalam, cursive, sans-serif';
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(str, x, y);
      }
    };
    return g;
  }

  function create(cfg) {
    // ---- DOM 骨架 ----
    var root = document.currentScript ? document.currentScript.parentElement : document.body;
    if (!root || root === document.body) root = document.body;
    root.innerHTML =
      '<div class="ac-wrap">' +
      '  <div class="ac-head"><span class="ac-title"></span><button class="ac-restart" type="button">重开</button></div>' +
      '  <div class="ac-obj"></div>' +
      '  <div class="ac-stage"><canvas></canvas>' +
      '    <div class="ac-overlay"><div class="ac-overlay-text"></div><button class="ac-start" type="button">开始</button></div>' +
      '  </div>' +
      '  <div class="ac-hud"></div>' +
      '  <div class="ac-params"></div>' +
      '</div>';
    injectStyle(root);

    var wrap = root.querySelector('.ac-wrap');
    var canvas = root.querySelector('canvas');
    var overlay = root.querySelector('.ac-overlay');
    var overlayText = root.querySelector('.ac-overlay-text');
    var hud = root.querySelector('.ac-hud');
    var paramsBox = root.querySelector('.ac-params');
    root.querySelector('.ac-title').textContent = cfg.title || '';
    root.querySelector('.ac-obj').textContent = cfg.objective || '';

    // ---- 游戏对象 ----
    var game = {
      W: 0, H: 0, score: 0, lives: 3, state: 'ready', time: 0,
      params: {}, data: {},
      rand: function (a, b) { return a + Math.random() * (b - a); },
      setScore: function (n) {
        game.score = n; renderHud();
        post({ type: 'demo:score', score: n });
      },
      endGame: function (win) {
        game.state = 'over';
        overlayText.textContent = (win ? '完成！' : '结束') + ' 得分 ' + game.score;
        overlay.style.display = 'flex';
        startBtn.textContent = '再来一次';
        post({ type: 'demo:complete', score: game.score, win: !!win });
      },
      reset: function () {
        game.score = 0; game.time = 0; game.lives = cfg.lives != null ? cfg.lives : 3;
        game.data = {}; game.state = 'playing';
        if (cfg.setup) cfg.setup(game);
        renderHud();
        overlay.style.display = 'none';
      }
    };

    // ---- 参数滑块 ----
    (cfg.params || []).forEach(function (p) {
      game.params[p.key] = p.default;
      var row = document.createElement('div'); row.className = 'ac-param';
      var label = document.createElement('label');
      label.innerHTML = p.label + ' <b>' + p.default + (p.unit || '') + '</b>';
      var input = document.createElement('input');
      input.type = 'range'; input.min = p.min; input.max = p.max; input.step = p.step; input.value = p.default;
      input.addEventListener('input', function () {
        game.params[p.key] = parseFloat(input.value);
        label.innerHTML = p.label + ' <b>' + input.value + (p.unit || '') + '</b>';
        if (cfg.onParam) cfg.onParam(game, p.key, game.params[p.key]);
      });
      row.appendChild(label); row.appendChild(input);
      paramsBox.appendChild(row);
    });

    // ---- 画布尺寸（竖屏优先，自适应容器）----
    var ctx = canvas.getContext('2d');
    function resize() {
      var w = Math.min(wrap.clientWidth, 520);
      var h = Math.round(w * 1.5); // 2:3 竖屏
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.W = w; game.H = h;
    }
    window.addEventListener('resize', resize);
    resize();

    // ---- 输入 ----
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (game.state !== 'playing') return;
      var p = pointer(e); p.type = 'down';
      if (cfg.onPointer) cfg.onPointer(game, p);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (game.state !== 'playing' || !cfg.onPointer) return;
      var p = pointer(e); p.type = 'move';
      cfg.onPointer(game, p);
    });
    canvas.addEventListener('pointerup', function (e) {
      if (game.state !== 'playing' || !cfg.onPointer) return;
      var p = pointer(e); p.type = 'up';
      cfg.onPointer(game, p);
    });

    // ---- HUD ----
    function renderHud() {
      hud.innerHTML = '<span>得分 <b>' + game.score + '</b></span>' +
        (cfg.lives ? '<span>生命 <b>' + game.lives + '</b></span>' : '') +
        (cfg.hudExtra ? '<span>' + cfg.hudExtra(game) + '</span>' : '');
    }

    // ---- 协议 ----
    function post(msg) {
      try { window.parent.postMessage(msg, '*'); } catch (e) {}
    }
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'demo:restart') game.reset();
    });

    // ---- 主循环（固定步长）----
    var last = 0, acc = 0, STEP = 1000 / 60;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!last) last = ts;
      acc += Math.min(ts - last, 100); last = ts;
      while (acc >= STEP) {
        acc -= STEP;
        if (game.state === 'playing' && cfg.update) {
          game.time += STEP / 1000;
          cfg.update(game, STEP / 1000);
        }
      }
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, game.W, game.H);
      var g = makeG(ctx);
      if (cfg.draw) cfg.draw(game, g);
      if (cfg.hudExtra) renderHud();
    }
    requestAnimationFrame(frame);

    // ---- 开始/重开 ----
    var startBtn = root.querySelector('.ac-start');
    startBtn.addEventListener('click', function () { game.reset(); });
    root.querySelector('.ac-restart').addEventListener('click', function () { game.reset(); });
    overlayText.textContent = cfg.objective || '';
    renderHud();

    post({ type: 'demo:ready', title: cfg.title || '' });
    return game;
  }

  function injectStyle(root) {
    if (document.getElementById('ac-style')) return;
    var s = document.createElement('style');
    s.id = 'ac-style';
    s.textContent =
      'html,body{margin:0;padding:0;background:' + PAPER + ';font-family:Kalam,cursive,sans-serif;overscroll-behavior:none}' +
      '.ac-wrap{max-width:520px;margin:0 auto;padding:10px;box-sizing:border-box;user-select:none}' +
      '.ac-head{display:flex;justify-content:space-between;align-items:center}' +
      '.ac-title{font-size:20px;font-weight:700;color:' + INK + '}' +
      '.ac-obj{font-size:14px;color:#666;margin:4px 0 8px}' +
      '.ac-stage{position:relative;border:2.5px solid ' + INK + ';border-radius:14px 4px 12px 6px;overflow:hidden;background:' + PAPER + '}' +
      '.ac-stage canvas{display:block;margin:0 auto;touch-action:none}' +
      '.ac-overlay{position:absolute;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(250,247,239,.92)}' +
      '.ac-overlay-text{font-size:17px;color:' + INK + ';padding:0 24px;text-align:center;line-height:1.5}' +
      'button{font-family:inherit;font-size:16px;background:' + YELLOW + ';border:2.5px solid ' + INK + ';border-radius:10px 4px 10px 4px;padding:8px 22px;cursor:pointer;min-height:44px;min-width:88px}' +
      'button:active{transform:translate(1px,2px)}' +
      '.ac-restart{font-size:13px;padding:4px 14px;background:#fff}' +
      '.ac-hud{display:flex;gap:18px;justify-content:center;font-size:15px;padding:8px 0;color:' + INK + '}' +
      '.ac-hud b{color:#d97706}' +
      '.ac-params{padding:4px 6px}' +
      '.ac-param{display:flex;flex-direction:column;margin:6px 0}' +
      '.ac-param label{font-size:13px;color:#555;display:flex;justify-content:space-between}' +
      '.ac-param input[type=range]{width:100%;height:28px;accent-color:#d97706;cursor:pointer}';
    document.head.appendChild(s);
  }

  window.AtomCore = { create: create, COLORS: { PAPER: PAPER, INK: INK, YELLOW: YELLOW, RED: RED, BLUE: BLUE, GREEN: GREEN } };
})();
