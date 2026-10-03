function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function degToRad(deg) {
    return (deg * Math.PI) / 180;
}
function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}
/**
 * __OV.Tool — 通用工具函数模块
 */
export default {
    name: '__OV.Tool',
    install(ctx) {
        ctx.system.tool = {
            uuid,
            clamp,
            lerp,
            randInt,
            randFloat,
            degToRad,
            radToDeg,
        };
    },
};
//# sourceMappingURL=tool-module.js.map