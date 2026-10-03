/**
 * __OV.ProjectMgr — 场景生命周期管理器
 *
 * 职责:
 * - loadScene: 构造 ctx.scene → install → init → start
 * - unloadScene: stop → destroy（逆序）→ 清理 ctx.scene
 * - go: 兼容 v1 的场景切换 API（通过 StateMachine transition）
 * - current/root: 兼容 v1 的场景查询 API
 */
export default {
    name: '__OV.ProjectMgr',
    install(ctx) {
        const loadedScenes = new Map();
        const globalScenes = new Set();
        let currentSceneId = '';
        let rootSceneId = '';
        let idlePromise = Promise.resolve();
        let idleResolve = null;
        // 构造兼容 v1 的 scene 事件总线
        function createSceneEventBus() {
            const handlers = new Map();
            return {
                emit(event, payload) {
                    const list = handlers.get(event);
                    if (list) {
                        for (const h of list) {
                            try {
                                h(payload);
                            }
                            catch (err) {
                                ctx.logger.error(`[SceneEvent] ${event} 处理异常`, err);
                            }
                        }
                    }
                },
                on(event, handler) {
                    let list = handlers.get(event);
                    if (!list) {
                        list = [];
                        handlers.set(event, list);
                    }
                    list.push(handler);
                    return { off: () => {
                            const idx = list.indexOf(handler);
                            if (idx !== -1)
                                list.splice(idx, 1);
                        } };
                },
                off(event, handler) {
                    const list = handlers.get(event);
                    if (list) {
                        const idx = list.indexOf(handler);
                        if (idx !== -1)
                            list.splice(idx, 1);
                    }
                },
            };
        }
        // 构造兼容 v1 的 scene 逻辑存储
        function createSceneLogic() {
            const store = new Map();
            return {
                set(key, value) { store.set(key, value); },
                get(key) { return store.get(key); },
            };
        }
        ctx.system.project = {
            async loadScene(sceneId, moduleDefs, stateDef, isGlobal = false) {
                if (loadedScenes.has(sceneId)) {
                    ctx.logger.warn(`[ProjectMgr] 场景 ${sceneId} 已加载，跳过`);
                    return;
                }
                // 构造 scene 定义，兼容 v1 的 transitions 格式
                const definition = stateDef ? { ...stateDef } : {};
                if (stateDef && !definition.transitions && stateDef.on) {
                    const onObj = stateDef.on;
                    definition.transitions = Object.entries(onObj).map(([trigger, t]) => ({
                        id: `${stateDef.id}_to_${t.target}`,
                        to: t.target,
                        trigger,
                    }));
                }
                // 构造 scene 运行时对象
                const scene = {
                    id: sceneId,
                    definition,
                    event: createSceneEventBus(),
                    ui: { layers: {} },
                    logic: createSceneLogic(),
                    payload: {},
                };
                // 设置到内核（让模块在 install/start 时能访问 ctx.scene）
                ctx.scene = scene;
                const sceneModules = [];
                // install: 同步串行
                for (const def of moduleDefs) {
                    if (def.module.install) {
                        try {
                            def.module.install(ctx);
                            // 模块 install 通常按模块短名挂载到 ctx.system，但蓝图引用使用路径名；
                            // 这里补一个路径别名，保证 LogicGraph / Guard 能通过完整路径找到模块 API。
                            if (def.module.name &&
                                def.module.name !== def.name &&
                                ctx.system[def.module.name] &&
                                !ctx.system[def.name]) {
                                ctx.system[def.name] = ctx.system[def.module.name];
                            }
                        }
                        catch (err) {
                            ctx.logger.error(`[ProjectMgr] ${def.name} install 失败`, err);
                        }
                    }
                    sceneModules.push(def.module);
                }
                // init: 异步并行
                await Promise.all(moduleDefs.map(async (def) => {
                    if (def.module.init) {
                        try {
                            await def.module.init(ctx);
                        }
                        catch (err) {
                            ctx.logger.error(`[ProjectMgr] ${def.name} init 失败`, err);
                        }
                    }
                }));
                // start: 异步串行
                // 重新设置当前场景：init 中的 await 可能让出执行权，
                // 导致其他 loadScene 覆盖 ctx.scene，因此 start 前必须恢复。
                ctx.scene = scene;
                for (const def of moduleDefs) {
                    if (def.module.start) {
                        const startTime = performance.now();
                        try {
                            await def.module.start(ctx);
                        }
                        catch (err) {
                            ctx.logger.error(`[ProjectMgr] ${def.name} start 失败`, err);
                        }
                        const elapsed = performance.now() - startTime;
                        if (elapsed > 100) {
                            ctx.logger.warn(`[ProjectMgr] ${def.name} start 耗时 ${elapsed.toFixed(1)}ms`);
                        }
                    }
                }
                loadedScenes.set(sceneId, { id: sceneId, modules: sceneModules, stateDef });
                if (isGlobal) {
                    globalScenes.add(sceneId);
                    ctx.logger.info(`[ProjectMgr] 场景 ${sceneId} 加载完成（全局）`);
                }
                else {
                    currentSceneId = sceneId;
                    if (!rootSceneId)
                        rootSceneId = sceneId;
                    ctx.logger.info(`[ProjectMgr] 场景 ${sceneId} 加载完成`);
                }
            },
            async unloadScene(sceneId) {
                // 全局场景不允许卸载
                if (globalScenes.has(sceneId)) {
                    ctx.logger.info(`[ProjectMgr] 场景 ${sceneId} 是全局场景，跳过卸载`);
                    return;
                }
                const scene = loadedScenes.get(sceneId);
                if (!scene) {
                    ctx.logger.warn(`[ProjectMgr] 场景 ${sceneId} 未加载`);
                    return;
                }
                // 恢复当前场景上下文，确保 destroy 能按场景取消订阅等操作
                ctx.scene = { id: sceneId };
                // stop: 异步并行
                await Promise.all(scene.modules.map(async (mod) => {
                    if (mod.stop) {
                        try {
                            await mod.stop(ctx);
                        }
                        catch (err) {
                            ctx.logger.error(`[ProjectMgr] ${mod.name} stop 失败`, err);
                        }
                    }
                }));
                // destroy: 串行逆序
                const reverse = scene.modules.slice().reverse();
                for (const mod of reverse) {
                    if (mod.destroy) {
                        try {
                            await mod.destroy(ctx);
                        }
                        catch (err) {
                            ctx.logger.error(`[ProjectMgr] ${mod.name} destroy 失败`, err);
                        }
                    }
                }
                loadedScenes.delete(sceneId);
                if (currentSceneId === sceneId)
                    currentSceneId = '';
                // 清理 ctx.scene
                ctx.scene = null;
                ctx.logger.info(`[ProjectMgr] 场景 ${sceneId} 卸载完成`);
            },
            // 兼容 v1: 切换场景（通过 StateMachine transition）
            async go(targetSceneId, payload) {
                const sm = ctx.system.stateMachine;
                if (!sm) {
                    ctx.logger.warn('[ProjectMgr] go: StateMachine 未就绪');
                    return;
                }
                const currentState = sm.getState();
                const fullBlueprint = window.__BLUEPRINT__;
                const states = fullBlueprint?.design?.stateMachine?.states || [];
                const currentStateDef = states.find((s) => s.id === currentState);
                if (!currentStateDef) {
                    ctx.logger.warn(`[ProjectMgr] go: 当前状态 ${currentState} 未定义`);
                    return;
                }
                // 找到从当前状态到目标场景的 transition trigger
                const onEntries = Object.entries(currentStateDef.on || {});
                const match = onEntries.find(([, t]) => t.target === targetSceneId || states.find((s) => s.id === t.target)?.scene === targetSceneId);
                if (match) {
                    const [trigger] = match;
                    ctx.logger.info(`[ProjectMgr] go: ${currentState} → ${targetSceneId} (trigger: ${trigger})`);
                    await sm.transition(trigger, payload);
                }
                else {
                    ctx.logger.warn(`[ProjectMgr] go: 未找到从 ${currentState} 到 ${targetSceneId} 的 transition`);
                }
            },
            // 兼容 v1: 返回当前场景
            current() {
                return currentSceneId ? { id: currentSceneId } : null;
            },
            // 兼容 v1: 返回根场景
            root() {
                return rootSceneId ? { id: rootSceneId } : null;
            },
            // 兼容 v1: 空闲等待
            idle() {
                if (idleResolve)
                    return idlePromise;
                idlePromise = new Promise((resolve) => {
                    idleResolve = resolve;
                    setTimeout(() => {
                        if (idleResolve) {
                            idleResolve();
                            idleResolve = null;
                        }
                    }, 50);
                });
                return idlePromise;
            },
            getLoadedScenes() {
                return Array.from(loadedScenes.keys());
            },
            isGlobalScene(sceneId) {
                return globalScenes.has(sceneId);
            },
            getGlobalScenes() {
                return Array.from(globalScenes);
            },
        };
    },
};
//# sourceMappingURL=project-mgr-module.js.map