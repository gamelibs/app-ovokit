import { executeLogicGraph } from '../logic-graph-runner.js';
/**
 * __OV.StateMachine — 架构唯一控制中枢
 *
 * 职责:
 * - 维护状态定义和当前状态
 * - 串行执行 transition，支持 enqueue / replace 策略
 * - 评估 guard 条件
 * - 调度 onEnter / onExit action
 * - 通过 ProjectMgr 触发场景加载/卸载
 * - OnEnter 失败 → 回滚到 fallback
 * - OnExit 失败 → FATAL 日志，不阻断
 */
export default {
    name: '__OV.StateMachine',
    install(ctx) {
        let config = null;
        let currentState = '';
        let pendingState = null;
        let globalStateLoaded = false;
        let isTransitioning = false;
        const queue = [];
        let stateChangeHandlers = [];
        // ── Guard 求值 ──
        async function evaluateGuard(guard, payload) {
            switch (guard.type) {
                case 'data': {
                    const value = ctx.data.get(guard.key);
                    return compareData(value, guard.op, guard.value);
                }
                case 'module': {
                    const mod = ctx.system[guard.module];
                    if (!mod || typeof mod[guard.action] !== 'function')
                        return false;
                    const result = await mod[guard.action](payload);
                    return Boolean(result);
                }
                case 'composite': {
                    switch (guard.operator) {
                        case 'and': {
                            const results = await Promise.all(guard.guards.map((g) => evaluateGuard(g, payload)));
                            return results.every(Boolean);
                        }
                        case 'or': {
                            const results = await Promise.all(guard.guards.map((g) => evaluateGuard(g, payload)));
                            return results.some(Boolean);
                        }
                        case 'not': {
                            return !(await evaluateGuard(guard.guards[0], payload));
                        }
                        default:
                            return false;
                    }
                }
                case 'expr': {
                    try {
                        const fn = new Function('ctx', `with(ctx){return ${guard.value}}`);
                        return Boolean(fn({ data: { get: (k) => ctx.data.get(k) } }));
                    }
                    catch {
                        return false;
                    }
                }
                case 'custom': {
                    const mod = ctx.system[guard.module];
                    if (!mod || typeof mod[guard.method] !== 'function')
                        return false;
                    const result = await mod[guard.method](payload);
                    return Boolean(result);
                }
                default:
                    return false;
            }
        }
        function compareData(value, op, target) {
            switch (op) {
                case 'eq': return value === target;
                case 'ne': return value !== target;
                case 'gt': return value > target;
                case 'lt': return value < target;
                case 'gte': return value >= target;
                case 'lte': return value <= target;
                case 'in': return Array.isArray(target) && target.includes(value);
                case 'contains': return typeof value === 'string' && value.includes(String(target));
                default: return false;
            }
        }
        // ── 加载场景辅助函数 ──
        async function loadStateScene(stateDef, isGlobal = false) {
            const project = ctx.system.project;
            if (!project)
                return;
            const moduleDefs = stateDef.modules.map((name) => ({
                name,
                module: ctx.kernel.getModule(name) ?? { name },
            }));
            await project.loadScene(stateDef.scene, moduleDefs, stateDef, isGlobal);
        }
        // ── 判断是否为全局状态 ──
        function isGlobalState(stateId) {
            return config?.globalState === stateId;
        }
        // ── action 执行辅助 ──
        async function executeAction(actionCtx, action, triggerEvent, actionPayload) {
            if (!action)
                return;
            // 支持 emit:eventName 简写
            if (action.startsWith('emit:')) {
                const eventId = action.slice(5);
                const eventBus = actionCtx.system.events;
                if (eventBus) {
                    eventBus.emit(eventId, actionPayload);
                    actionCtx.logger.info(`[StateMachine] action emit: ${eventId}`);
                }
                return;
            }
            // 支持 module:moduleId:method 调用
            if (action.startsWith('module:')) {
                const parts = action.split(':');
                if (parts.length >= 3) {
                    const moduleName = parts[1];
                    const methodName = parts[2];
                    const mod = actionCtx.system[moduleName];
                    if (mod && typeof mod[methodName] === 'function') {
                        await mod[methodName](actionPayload);
                        actionCtx.logger.info(`[StateMachine] action module: ${moduleName}.${methodName}`);
                    }
                }
                return;
            }
            actionCtx.logger.warn(`[StateMachine] 未知 action 格式: ${action}`);
        }
        // ── 状态生命周期钩子执行（字符串 action + LogicGraph）──
        async function executeStateHook(hookCtx, stateDef, hook, triggerEvent, hookPayload) {
            // 1. 执行简化字符串 action（如 emit:xxx）
            const action = hook === 'onEnter' ? stateDef.onEnter : stateDef.onExit;
            if (action) {
                try {
                    await executeAction(hookCtx, action, triggerEvent, hookPayload);
                }
                catch (err) {
                    hookCtx.logger.error(`[StateMachine] ${hook} action 执行失败`, err);
                    if (hook === 'onEnter')
                        throw err; // onEnter 失败需要回滚
                    // onExit 失败不阻断
                }
            }
            // 2. 执行 LogicGraph（如果存在）
            if (stateDef.logic) {
                try {
                    await executeLogicGraph(stateDef.logic, hookCtx, hook, triggerEvent, hookPayload);
                }
                catch (err) {
                    hookCtx.logger.error(`[StateMachine] ${hook} LogicGraph 执行失败`, err);
                    if (hook === 'onEnter')
                        throw err;
                }
            }
        }
        // ── Transition 执行 ──
        async function executeTransition(event, payload) {
            if (!config)
                return 'failed';
            const stateDef = config.states.find((s) => s.id === currentState);
            if (!stateDef)
                return 'failed';
            const trans = stateDef.on[event];
            if (!trans)
                return 'guard_rejected';
            // Step 1: 校验 guard
            if (trans.guard) {
                const pass = await evaluateGuard(trans.guard, payload);
                if (!pass)
                    return 'guard_rejected';
            }
            // Step 2: 执行 transition action
            if (trans.action) {
                await executeAction(ctx, trans.action, event, payload);
            }
            // Step 3: 执行 onExit
            await executeStateHook(ctx, stateDef, 'onExit', event, payload);
            // Step 4: 卸载当前场景（全局状态不卸载）
            const project = ctx.system.project;
            if (project && !isGlobalState(currentState)) {
                try {
                    await project.unloadScene(stateDef.scene);
                }
                catch (err) {
                    ctx.logger.error('[StateMachine] 卸载场景失败', err);
                    return 'failed';
                }
            }
            // Step 5: 临时切换到目标状态
            pendingState = trans.target;
            // Step 6: 加载目标场景
            const targetDef = config.states.find((s) => s.id === trans.target);
            if (!targetDef) {
                ctx.logger.error(`[StateMachine] 目标状态 ${trans.target} 不存在`);
                pendingState = null;
                return 'failed';
            }
            // 如果目标状态是全局状态，拒绝 transition（全局状态不应被普通状态流转触发）
            if (isGlobalState(trans.target)) {
                ctx.logger.warn(`[StateMachine] 拒绝 transition 到全局状态 ${trans.target}`);
                pendingState = null;
                return 'guard_rejected';
            }
            if (project) {
                try {
                    await loadStateScene(targetDef);
                }
                catch (err) {
                    ctx.logger.error('[StateMachine] 加载场景失败，回滚到 fallback', err);
                    pendingState = null;
                    // 回滚到 fallback
                    const fallback = config.states.find((s) => s.id === config.fallback);
                    if (fallback && project) {
                        try {
                            await loadStateScene(fallback);
                            currentState = fallback.id;
                        }
                        catch {
                            ctx.logger.error('[StateMachine] fallback 也失败，进入 __error');
                            currentState = '__error';
                        }
                    }
                    return 'failed';
                }
            }
            // Step 7: 执行 onEnter
            try {
                await executeStateHook(ctx, targetDef, 'onEnter', event, payload);
            }
            catch (err) {
                ctx.logger.error('[StateMachine] onEnter 失败，回滚', err);
                if (project && !isGlobalState(trans.target)) {
                    await project.unloadScene(targetDef.scene).catch(() => { });
                }
                pendingState = null;
                // 回滚到 fallback
                const fallback = config.states.find((s) => s.id === config.fallback);
                if (fallback && project) {
                    try {
                        await loadStateScene(fallback);
                        currentState = fallback.id;
                    }
                    catch {
                        currentState = '__error';
                    }
                }
                return 'failed';
            }
            // Step 8: 提交状态
            const from = currentState;
            currentState = pendingState;
            pendingState = null;
            // Step 9: 广播
            const eventBus = ctx.system.events;
            if (eventBus) {
                eventBus.emit('state:changed', { from, to: currentState, trigger: event, payload });
            }
            for (const h of stateChangeHandlers) {
                h(from, currentState);
            }
            return 'success';
        }
        // ── 队列处理 ──
        async function processQueue() {
            if (isTransitioning || queue.length === 0)
                return;
            isTransitioning = true;
            const request = queue.shift();
            try {
                const result = await executeTransition(request.event, request.payload);
                request.resolve(result);
            }
            catch (err) {
                ctx.logger.error('[StateMachine] transition 执行异常', err);
                request.resolve('failed');
            }
            finally {
                isTransitioning = false;
                processQueue();
            }
        }
        // 收集所有 LogicGraph 中声明的 onEvent 事件 ID
        function collectLogicEventIds(cfg) {
            const ids = new Set();
            for (const state of cfg.states) {
                if (!state.logic)
                    continue;
                for (const node of state.logic.nodes) {
                    if (node.type === 'onEvent' && typeof node.params?.eventId === 'string') {
                        ids.add(node.params.eventId);
                    }
                }
            }
            return ids;
        }
        // 收集所有状态迁移表中的事件 ID（transition-table events）
        function collectTransitionEventIds(cfg) {
            const ids = new Set();
            for (const state of cfg.states) {
                for (const eventId of Object.keys(state.on || {})) {
                    ids.add(eventId);
                }
            }
            return ids;
        }
        // ── 暴露 API ──
        ctx.system.stateMachine = {
            configure(cfg) {
                config = cfg;
                currentState = cfg.initial;
                // 订阅所有 LogicGraph 中声明的事件；事件到达时在当前状态的 logic 中执行
                const eventBus = ctx.system.events;
                const logicEventIds = collectLogicEventIds(cfg);
                const transitionEventIds = collectTransitionEventIds(cfg);
                ctx.logger.info(`[StateMachine] configure: 订阅 LogicGraph 事件: ${JSON.stringify([...logicEventIds])}`);
                ctx.logger.info(`[StateMachine] configure: 订阅 transition-table 事件: ${JSON.stringify([...transitionEventIds])}`);
                if (eventBus) {
                    for (const eventId of logicEventIds) {
                        eventBus.on(eventId, (payload) => {
                            ctx.logger.info(`[StateMachine] LogicGraph 事件到达: ${eventId}, 当前状态: ${currentState}`);
                            const stateDef = config?.states.find((s) => s.id === currentState);
                            if (stateDef?.logic) {
                                ctx.logger.info(`[StateMachine] 执行 ${currentState} 的 LogicGraph onEvent: ${eventId}`);
                                executeLogicGraph(stateDef.logic, ctx, 'onEvent', eventId, payload).catch((err) => {
                                    ctx.logger.error(`[StateMachine] LogicGraph onEvent 执行失败: ${eventId}`, err);
                                });
                            }
                            else {
                                ctx.logger.info(`[StateMachine] 当前状态 ${currentState} 无 LogicGraph`);
                            }
                        });
                    }
                    // 桥接迁移表事件：事件到达且当前状态支持该迁移时，自动触发 transition
                    for (const eventId of transitionEventIds) {
                        eventBus.on(eventId, (payload) => {
                            const stateDef = config?.states.find((s) => s.id === currentState);
                            if (stateDef?.on[eventId]) {
                                ctx.logger.info(`[StateMachine] transition-table 事件到达: ${eventId}, 当前状态: ${currentState} -> ${stateDef.on[eventId].target}`);
                                const sm = ctx.system.stateMachine;
                                sm?.transition(eventId, payload).catch((err) => {
                                    ctx.logger.error(`[StateMachine] transition 执行失败: ${eventId}`, err);
                                });
                            }
                        });
                    }
                }
                // 先加载全局状态（如果存在），并执行其 onEnter
                if (cfg.globalState && !globalStateLoaded) {
                    const globalDef = cfg.states.find((s) => s.id === cfg.globalState);
                    if (globalDef) {
                        queueMicrotask(async () => {
                            try {
                                await loadStateScene(globalDef, true);
                                globalStateLoaded = true;
                                ctx.logger.info(`[StateMachine] 全局状态场景 ${globalDef.scene} 加载完成`);
                                await executeStateHook(ctx, globalDef, 'onEnter', '');
                            }
                            catch (err) {
                                ctx.logger.error('[StateMachine] 全局状态场景加载或 onEnter 失败', err);
                            }
                        });
                    }
                }
                // 自动加载初始状态的场景，并执行其 onEnter
                const initialDef = cfg.states.find((s) => s.id === cfg.initial);
                if (initialDef) {
                    queueMicrotask(async () => {
                        try {
                            await loadStateScene(initialDef);
                            ctx.logger.info(`[StateMachine] 初始场景 ${initialDef.scene} 加载完成`);
                            await executeStateHook(ctx, initialDef, 'onEnter', '');
                        }
                        catch (err) {
                            ctx.logger.error('[StateMachine] 初始场景加载或 onEnter 失败', err);
                        }
                    });
                }
            },
            getState() {
                return currentState;
            },
            getPendingState() {
                return pendingState;
            },
            async transition(event, payload, strategy = 'enqueue') {
                return new Promise((resolve) => {
                    if (strategy === 'replace') {
                        queue.length = 0;
                    }
                    queue.push({ event, payload, strategy, resolve });
                    processQueue();
                });
            },
            can(event) {
                if (!config)
                    return false;
                const stateDef = config.states.find((s) => s.id === currentState);
                return !!stateDef?.on[event];
            },
            onStateChange(handler) {
                stateChangeHandlers.push(handler);
                return () => {
                    const idx = stateChangeHandlers.indexOf(handler);
                    if (idx !== -1)
                        stateChangeHandlers.splice(idx, 1);
                };
            },
        };
    },
    start(ctx) {
        const sm = ctx.system.stateMachine;
        if (sm) {
            // 从 window.__BLUEPRINT__ 读取完整蓝图
            const fullBlueprint = window.__BLUEPRINT__;
            if (fullBlueprint?.design?.stateMachine) {
                sm.configure(fullBlueprint.design.stateMachine);
                ctx.logger.info(`[StateMachine] 配置完成，初始状态: ${fullBlueprint.design.stateMachine.initial}`);
            }
        }
    },
};
//# sourceMappingURL=state-machine-module.js.map