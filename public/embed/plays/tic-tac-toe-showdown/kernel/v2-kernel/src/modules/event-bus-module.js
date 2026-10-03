import { OvoEventBus } from '../event-bus.js';
/**
 * __OV.EventBus — 全局事件总线模块
 *
 * 向 ctx.system.events 暴露 OvoEventBus 实例
 */
export default {
    name: '__OV.EventBus',
    install(ctx) {
        ctx.system.events = new OvoEventBus();
    },
};
//# sourceMappingURL=event-bus-module.js.map