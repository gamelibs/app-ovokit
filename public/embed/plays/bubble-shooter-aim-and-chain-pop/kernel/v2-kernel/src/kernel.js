import { OvoEventBus } from './event-bus.js';
import { OvoModuleContext } from './module-context.js';
/**
 * OvoKernel — 微内核
 *
 * 职责:
 * 1. 模块注册表
 * 2. 生命周期调度（bootChain: install → init → start → update → stop → destroy）
 * 3. 事件总线
 * 4. 上下文容器 ctx
 * 5. 蓝图加载
 *
 * 严格规则:
 * - install 同步串行，同组内按 bootChain 顺序
 * - init 异步并行
 * - start 异步串行，支持 await ctx.tick() 帧让出
 * - stop 异步并行
 * - destroy 异步串行，逆序（与加载顺序相反），必须幂等
 * - 单帧 start 总耗时超过 100ms，自动输出警告
 */
export class OvoKernel {
    // ── 内核自身引用 ──
    kernel = this;
    // ── 画布与分辨率 ──
    canvas;
    width = 750;
    height = 1334;
    // ── 蓝图 ──
    blueprint;
    // ── 系统能力挂载点 ──
    system = {};
    // ── 引擎挂载点 ──
    engine = {};
    // ── 当前场景 ──
    scene = null;
    // ── 游戏业务数据 ──
    game = {};
    // ── 数据通道（最小实现） ──
    data = {
        _store: new Map(),
        _watchers: new Map(),
        get(key) {
            return this._store.get(key);
        },
        set(key, value) {
            this._store.set(key, value);
            const watchers = this._watchers.get(key);
            if (watchers) {
                for (const w of watchers)
                    w(value);
            }
        },
        watch(key, handler) {
            const list = this._watchers.get(key) ?? [];
            list.push(handler);
            this._watchers.set(key, list);
            return () => {
                const idx = list.indexOf(handler);
                if (idx !== -1)
                    list.splice(idx, 1);
            };
        },
    };
    // ── 日志 ──
    logger = {
        info: (msg, data) => console.log(`[INFO] ${msg}`, data ?? ''),
        warn: (msg, data) => console.warn(`[WARN] ${msg}`, data ?? ''),
        error: (msg, data) => console.error(`[ERROR] ${msg}`, data ?? ''),
    };
    // ── 事件总线 ──
    _eventBus = new OvoEventBus();
    // ── 模块注册表 ──
    _registry = new Map();
    // ── 模块加载顺序（用于 destroy 逆序） ──
    _loadOrder = [];
    // ── 模块上下文缓存 ──
    _moduleContexts = new Map();
    // ── 运行状态 ──
    _started = false;
    _updateRunning = false;
    _lastTick = 0;
    // ── ctx 代理 ──
    get ctx() {
        return this;
    }
    /** 公共访问：模块注册表（只读） */
    get modules() {
        return this._registry;
    }
    /** 注册模块 */
    register(name, module) {
        this._registry.set(name, module);
    }
    /** 获取已注册模块 */
    getModule(name) {
        return this._registry.get(name);
    }
    /** 加载蓝图并按 bootChain 初始化 */
    async loadBlueprint(blueprint) {
        this.blueprint = blueprint;
        this.width = blueprint.canvas.width;
        this.height = blueprint.canvas.height;
        // 按 bootChain 执行 install → init → start
        await this._runBootChain('install');
        await this._runBootChain('init');
        await this._runBootChain('start');
        this._started = true;
        this._lastTick = performance.now();
        this._scheduleUpdate();
    }
    /** 手动触发某个生命周期阶段（主要用于测试） */
    async runPhase(phase) {
        await this._runBootChain(phase);
    }
    /** 更新循环（由 RAF 驱动） */
    update(dt) {
        if (!this._started || this._updateRunning)
            return;
        this._updateRunning = true;
        try {
            // update 所有已注册模块（bootChain 内的模块按原顺序，后注册的场景模块追加在后）
            const order = new Set(this._loadOrder);
            for (const [name] of this._registry)
                order.add(name);
            for (const name of order) {
                const mod = this._registry.get(name);
                if (mod?.update) {
                    try {
                        mod.update(this.ctx, dt);
                    }
                    catch (err) {
                        this.logger.error(`[update] ${name} 异常`, err);
                    }
                }
            }
        }
        finally {
            this._updateRunning = false;
        }
    }
    /** 停止内核（卸载所有模块） */
    async stop() {
        this._started = false;
        // stop 并行
        await this._runPhaseParallel('stop');
        // destroy 串行逆序
        await this._runPhaseSerialReverse('destroy');
        this._registry.clear();
        this._loadOrder = [];
        this._eventBus.clear();
        this._moduleContexts.clear();
    }
    /** 创建模块上下文代理 */
    createModuleContext(moduleName) {
        let mc = this._moduleContexts.get(moduleName);
        if (!mc) {
            mc = new OvoModuleContext(moduleName, this._eventBus);
            this._moduleContexts.set(moduleName, mc);
        }
        return mc;
    }
    /** 销毁模块上下文 */
    disposeModuleContext(moduleName) {
        const mc = this._moduleContexts.get(moduleName);
        if (mc) {
            mc.destroy();
            this._moduleContexts.delete(moduleName);
        }
    }
    /** 让出主线程，等待下一帧 */
    tick() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 私有方法
    // ═════════════════════════════════════════════════════════════════════════════
    /** 按 bootChain 执行某个生命周期阶段 */
    async _runBootChain(phase) {
        const chain = this.blueprint.bootChain;
        for (const group of chain) {
            if (phase === 'install') {
                // install: 同步串行
                for (const name of group) {
                    const mod = this._registry.get(name);
                    if (mod?.install) {
                        try {
                            mod.install(this.ctx);
                            // 模块 install 通常按模块短名（mod.name）挂载到 ctx.system，
                            // 但蓝图/LogicGraph 使用注册路径（name）引用；这里补一个路径别名，
                            // 保证 callAction / guard 能通过完整路径找到模块 API。
                            if (mod.name && mod.name !== name && this.ctx.system[mod.name] && !this.ctx.system[name]) {
                                this.ctx.system[name] = this.ctx.system[mod.name];
                            }
                            this._recordLoadOrder(name);
                        }
                        catch (err) {
                            this.logger.error(`[install] ${name} 失败`, err);
                            // critical 模块失败应终止启动，当前简化处理：继续加载
                        }
                    }
                }
            }
            else if (phase === 'init') {
                // init: 异步并行
                await Promise.all(group.map(async (name) => {
                    const mod = this._registry.get(name);
                    if (mod?.init) {
                        try {
                            await mod.init(this.ctx);
                            this._recordLoadOrder(name);
                        }
                        catch (err) {
                            this.logger.error(`[init] ${name} 失败`, err);
                        }
                    }
                }));
            }
            else if (phase === 'start') {
                // start: 异步串行，支持 tick() 帧让出
                for (const name of group) {
                    const mod = this._registry.get(name);
                    if (mod?.start) {
                        const startTime = performance.now();
                        try {
                            await mod.start(this.ctx);
                            this._recordLoadOrder(name);
                        }
                        catch (err) {
                            this.logger.error(`[start] ${name} 失败`, err);
                        }
                        const elapsed = performance.now() - startTime;
                        if (elapsed > 100) {
                            this.logger.warn(`[start] ${name} 耗时 ${elapsed.toFixed(1)}ms，超过 100ms 阈值`);
                        }
                    }
                }
            }
            else if (phase === 'update') {
                // update 由 RAF 驱动，不通过 bootChain 调用
            }
            else if (phase === 'stop') {
                // stop: 异步并行（由 stop() 方法调用）
            }
            else if (phase === 'destroy') {
                // destroy: 异步串行逆序（由 stop() 方法调用）
            }
        }
    }
    /** 并行执行某个生命周期阶段（用于 stop） */
    async _runPhaseParallel(phase) {
        await Promise.all(this._loadOrder.map(async (name) => {
            const mod = this._registry.get(name);
            if (mod?.[phase]) {
                try {
                    await mod[phase](this.ctx);
                }
                catch (err) {
                    this.logger.error(`[${phase}] ${name} 失败`, err);
                }
            }
        }));
    }
    /** 串行逆序执行某个生命周期阶段（用于 destroy） */
    async _runPhaseSerialReverse(phase) {
        const reverse = this._loadOrder.slice().reverse();
        for (const name of reverse) {
            const mod = this._registry.get(name);
            if (mod?.[phase]) {
                try {
                    await mod[phase](this.ctx);
                }
                catch (err) {
                    this.logger.error(`[${phase}] ${name} 失败`, err);
                }
            }
            // 销毁模块上下文
            this.disposeModuleContext(name);
        }
    }
    /** 记录模块加载顺序（去重） */
    _recordLoadOrder(name) {
        if (!this._loadOrder.includes(name)) {
            this._loadOrder.push(name);
        }
    }
    /** RAF 更新循环 */
    _scheduleUpdate() {
        if (!this._started)
            return;
        const now = performance.now();
        const dt = Math.min(now - this._lastTick, 33.33); // 上限 33ms (30fps)
        this._lastTick = now;
        this.update(dt);
        requestAnimationFrame(() => this._scheduleUpdate());
    }
}
//# sourceMappingURL=kernel.js.map