export class OvoModuleContext {
    moduleName;
    eventBus;
    disposers = [];
    disposed = false;
    constructor(moduleName, eventBus) {
        this.moduleName = moduleName;
        this.eventBus = eventBus;
    }
    on(event, handler) {
        this._assertNotDisposed();
        const off = this.eventBus.on(event, handler);
        this.disposers.push({ dispose: off });
        return () => {
            off();
            this._removeDisposer(off);
        };
    }
    once(event, handler) {
        this._assertNotDisposed();
        const off = this.eventBus.once(event, handler);
        this.disposers.push({ dispose: off });
        return () => {
            off();
            this._removeDisposer(off);
        };
    }
    setTimeout(fn, ms) {
        this._assertNotDisposed();
        const id = window.setTimeout(fn, ms);
        this.disposers.push({
            dispose: () => window.clearTimeout(id),
        });
        return id;
    }
    setInterval(fn, ms) {
        this._assertNotDisposed();
        const id = window.setInterval(fn, ms);
        this.disposers.push({
            dispose: () => window.clearInterval(id),
        });
        return id;
    }
    requestAnimationFrame(fn) {
        this._assertNotDisposed();
        const id = window.requestAnimationFrame(fn);
        this.disposers.push({
            dispose: () => window.cancelAnimationFrame(id),
        });
        return id;
    }
    /** 销毁模块上下文，自动回收所有注册的资源 */
    destroy() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const d of this.disposers) {
            try {
                d.dispose();
            }
            catch {
                // 忽略释放时的错误
            }
        }
        this.disposers = [];
    }
    _assertNotDisposed() {
        if (this.disposed) {
            throw new Error(`[ModuleContext] ${this.moduleName} 已销毁，不可再注册资源`);
        }
    }
    _removeDisposer(disposeFn) {
        const idx = this.disposers.findIndex((d) => d.dispose === disposeFn);
        if (idx !== -1) {
            this.disposers.splice(idx, 1);
        }
    }
}
//# sourceMappingURL=module-context.js.map