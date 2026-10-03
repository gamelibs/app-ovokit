/**
 * LogicGraph 执行引擎
 *
 * 职责：
 * 1. 按节点类型执行 LogicGraph 中从入口节点可达的子图。
 * 2. 支持 onEnter / onExit / onEvent 三种入口。
 * 3. 提供 emitEvent、callAction、setData/getData、if、sequence、delay、log 等节点语义。
 *
 * 注意：
 * - 当前 Phase1 聚焦 emit 事件机制，复杂表达式/条件延后。
 * - 执行过程中遇到错误会记录日志并继续执行其它分支（onExit 错误不阻断；onEnter 错误由调用方决定是否回滚）。
 */
// 防止 LogicGraph 在处理某事件时再次 emit 同事件导致无限递归
const processingEvents = new Set();
function getOutgoingEdges(graph, nodeId) {
    return graph.edges.filter((e) => e.source === nodeId);
}
function getNode(graph, nodeId) {
    return graph.nodes.find((n) => n.id === nodeId);
}
function evaluateCondition(ctx, node, runtime) {
    const params = node.params || {};
    // 1. 简单表达式（优先）
    if (typeof params.expr === 'string') {
        try {
            const fn = new Function('ctx', 'payload', `with(ctx){return ${params.expr}}`);
            return Boolean(fn({ data: { get: (k) => ctx.data.get(k) } }, runtime.payload));
        }
        catch (err) {
            ctx.logger.error(`[LogicGraph] if 表达式求值失败: ${params.expr}`, err);
            return false;
        }
    }
    // 2. dataKey + op + value
    const key = typeof params.key === 'string' ? params.key : '';
    const op = typeof params.op === 'string' ? params.op : 'eq';
    const target = params.value;
    const value = ctx.data.get(key);
    switch (op) {
        case 'eq':
            return value === target;
        case 'ne':
            return value !== target;
        case 'gt':
            return value > target;
        case 'gte':
            return value >= target;
        case 'lt':
            return value < target;
        case 'lte':
            return value <= target;
        case 'contains':
            return Array.isArray(value) && value.includes(target);
        default:
            return false;
    }
}
function evaluateValue(ctx, value, payload) {
    if (typeof value !== 'string')
        return value;
    if (value === '$event' || value === '$payload')
        return payload;
    if (value.startsWith('$event.')) {
        const key = value.slice(7);
        return typeof payload === 'object' && payload !== null
            ? payload[key]
            : undefined;
    }
    if (value.startsWith('$data.')) {
        return ctx.data.get(value.slice(6));
    }
    if (value.startsWith('$')) {
        return ctx.data.get(value.slice(1));
    }
    return value;
}
async function executeNode(graph, node, ctx, runtime) {
    if (runtime.visited.has(node.id)) {
        ctx.logger.warn(`[LogicGraph] 检测到循环，跳过节点: ${node.id}`);
        return;
    }
    runtime.visited.add(node.id);
    const params = node.params || {};
    const type = node.type;
    ctx.logger.info(`[LogicGraph] 执行节点 ${node.id} (${type})`);
    try {
        switch (type) {
            case 'onEnter':
            case 'onExit':
            case 'sequence':
                // 入口/顺序节点：顺序执行所有出边
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            case 'onEvent': {
                // 仅当匹配触发事件时才执行后续
                const eventId = typeof params.eventId === 'string' ? params.eventId : '';
                if (eventId && eventId === runtime.triggerEvent) {
                    processingEvents.add(eventId);
                    try {
                        await executeOutgoing(graph, node, ctx, runtime);
                    }
                    finally {
                        processingEvents.delete(eventId);
                    }
                }
                break;
            }
            case 'emitEvent': {
                const eventId = typeof params.eventId === 'string' ? params.eventId : '';
                if (!eventId) {
                    ctx.logger.warn('[LogicGraph] emitEvent 缺少 eventId');
                    break;
                }
                if (processingEvents.has(eventId)) {
                    ctx.logger.warn(`[LogicGraph] 事件 ${eventId} 正在处理中，跳过递归 emit`);
                    break;
                }
                const eventBus = ctx.system.events;
                if (eventBus) {
                    eventBus.emit(eventId, runtime.payload);
                    ctx.logger.info(`[LogicGraph] emitEvent: ${eventId}`);
                }
                else {
                    ctx.logger.warn('[LogicGraph] EventBus 未就绪');
                }
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            case 'callAction': {
                const moduleName = typeof params.moduleName === 'string' ? params.moduleName : '';
                const actionId = typeof params.actionId === 'string' ? params.actionId : '';
                if (!moduleName || !actionId) {
                    ctx.logger.warn('[LogicGraph] callAction 缺少 moduleName 或 actionId');
                    break;
                }
                const mod = ctx.system[moduleName];
                if (mod && typeof mod[actionId] === 'function') {
                    const args = typeof params.args === 'object' && params.args !== null
                        ? params.args
                        : undefined;
                    let callPayload = runtime.payload;
                    if (args) {
                        callPayload = {
                            ...(typeof runtime.payload === 'object' && runtime.payload !== null
                                ? runtime.payload
                                : {}),
                            ...args,
                        };
                    }
                    await mod[actionId](callPayload);
                    ctx.logger.info(`[LogicGraph] callAction: ${moduleName}.${actionId}`);
                }
                else {
                    ctx.logger.warn(`[LogicGraph] 模块方法不存在: ${moduleName}.${actionId}`);
                }
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            case 'setData': {
                const key = typeof params.key === 'string' ? params.key : '';
                if (!key) {
                    ctx.logger.warn('[LogicGraph] setData 缺少 key');
                    break;
                }
                const value = evaluateValue(ctx, params.value, runtime.payload);
                ctx.data.set(key, value);
                ctx.logger.info(`[LogicGraph] setData: ${key} = ${JSON.stringify(value)}`);
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            case 'adjustData': {
                const key = typeof params.key === 'string' ? params.key : '';
                if (!key) {
                    ctx.logger.warn('[LogicGraph] adjustData 缺少 key');
                    break;
                }
                const op = typeof params.op === 'string' ? params.op : 'add';
                const delta = typeof params.value === 'number' ? params.value : 1;
                const current = Number(ctx.data.get(key) ?? 0);
                let next = current;
                switch (op) {
                    case 'add':
                        next = current + delta;
                        break;
                    case 'sub':
                        next = current - delta;
                        break;
                    case 'mul':
                        next = current * delta;
                        break;
                    case 'div':
                        next = delta !== 0 ? current / delta : current;
                        break;
                    default:
                        ctx.logger.warn(`[LogicGraph] adjustData 不支持的操作: ${op}`);
                }
                ctx.data.set(key, next);
                ctx.logger.info(`[LogicGraph] adjustData: ${key} = ${next} (${op} ${delta})`);
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            case 'getData': {
                const key = typeof params.key === 'string' ? params.key : '';
                if (!key) {
                    ctx.logger.warn('[LogicGraph] getData 缺少 key');
                    break;
                }
                const value = ctx.data.get(key);
                ctx.logger.info(`[LogicGraph] getData: ${key} = ${JSON.stringify(value)}`);
                // getData 的结果可以作为 payload 传给下一个节点
                const nextRuntime = { ...runtime, payload: value };
                await executeOutgoing(graph, node, ctx, nextRuntime);
                break;
            }
            case 'if': {
                const condition = evaluateCondition(ctx, node, runtime);
                ctx.logger.info(`[LogicGraph] if 条件结果: ${condition}`);
                const edges = getOutgoingEdges(graph, node.id);
                for (const edge of edges) {
                    const handle = edge.sourceHandle || 'true';
                    if ((condition && handle === 'true') || (!condition && handle === 'false')) {
                        const target = getNode(graph, edge.target);
                        if (target) {
                            await executeNode(graph, target, ctx, runtime);
                        }
                    }
                }
                break;
            }
            case 'delay': {
                const ms = typeof params.ms === 'number' ? params.ms : 0;
                if (ms > 0) {
                    await new Promise((resolve) => setTimeout(resolve, ms));
                }
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            case 'log': {
                const message = typeof params.message === 'string' ? params.message : '';
                ctx.logger.info(`[LogicGraph] ${message}`);
                await executeOutgoing(graph, node, ctx, runtime);
                break;
            }
            default:
                ctx.logger.warn(`[LogicGraph] 未知节点类型: ${type}`);
                await executeOutgoing(graph, node, ctx, runtime);
        }
    }
    catch (err) {
        ctx.logger.error(`[LogicGraph] 节点 ${node.id} (${type}) 执行失败`, err);
        // 除 onEnter 外，其它节点错误不阻断；onEnter 错误由调用方处理
    }
}
async function executeOutgoing(graph, node, ctx, runtime) {
    const edges = getOutgoingEdges(graph, node.id);
    for (const edge of edges) {
        const target = getNode(graph, edge.target);
        if (target) {
            await executeNode(graph, target, ctx, runtime);
        }
    }
}
/**
 * 执行 LogicGraph
 *
 * @param graph - 逻辑图
 * @param ctx - Kernel 上下文
 * @param entry - 入口类型
 * @param triggerEvent - onEvent 入口时触发的事件名
 * @param payload - 触发事件的 payload
 */
export async function executeLogicGraph(graph, ctx, entry, triggerEvent, payload) {
    if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
        return;
    }
    const runtime = {
        triggerEvent,
        payload,
        visited: new Set(),
    };
    // 找到所有匹配入口类型的入口节点
    const entryNodes = graph.nodes.filter((n) => n.type === entry);
    if (entryNodes.length === 0) {
        return;
    }
    for (const node of entryNodes) {
        await executeNode(graph, node, ctx, runtime);
    }
}
//# sourceMappingURL=logic-graph-runner.js.map