/**
 * OvoEventBus — 全局事件总线
 *
 * 规则:
 * 1. 支持 on / once / off / emit / clear
 * 2. 支持 createScope 创建作用域隔离的子总线
 * 3. emit 时按注册顺序同步调用所有 handler
 * 4. once 的 handler 执行后自动移除
 */
class HandlerEntry {
    handler;
    once;
    constructor(handler, once) {
        this.handler = handler;
        this.once = once;
    }
}
export class OvoEventBus {
    handlers = new Map();
    scopes = new Map();
    on(event, handler) {
        const list = this.handlers.get(event) ?? [];
        list.push(new HandlerEntry(handler, false));
        this.handlers.set(event, list);
        return () => this.off(event, handler);
    }
    once(event, handler) {
        const list = this.handlers.get(event) ?? [];
        list.push(new HandlerEntry(handler, true));
        this.handlers.set(event, list);
        return () => this.off(event, handler);
    }
    off(event, handler) {
        const list = this.handlers.get(event);
        if (!list)
            return;
        const idx = list.findIndex((e) => e.handler === handler);
        if (idx !== -1) {
            list.splice(idx, 1);
            if (list.length === 0) {
                this.handlers.delete(event);
            }
        }
    }
    emit(event, payload) {
        const list = this.handlers.get(event);
        if (!list)
            return;
        // 复制数组避免执行过程中增删导致的遍历问题
        const snapshot = list.slice();
        for (const entry of snapshot) {
            try {
                entry.handler(payload);
            }
            catch (err) {
                // eslint-disable-next-line no-console
                console.error(`[EventBus] handler error for "${event}":`, err);
            }
            if (entry.once) {
                this.off(event, entry.handler);
            }
        }
    }
    clear() {
        this.handlers.clear();
        this.scopes.clear();
    }
    createScope(scopeId) {
        let scope = this.scopes.get(scopeId);
        if (!scope) {
            scope = new OvoEventBus();
            this.scopes.set(scopeId, scope);
        }
        return scope;
    }
}
//# sourceMappingURL=event-bus.js.map