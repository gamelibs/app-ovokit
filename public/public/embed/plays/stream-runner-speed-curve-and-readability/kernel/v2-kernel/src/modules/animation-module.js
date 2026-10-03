function easeLinear(t) { return t; }
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOutBounce(t) {
    if (t < 1 / 2.75)
        return 7.5625 * t * t;
    if (t < 2 / 2.75)
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75)
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}
const easings = {
    linear: easeLinear,
    easeInOutQuad,
    easeOutBounce,
};
/**
 * __OV.Animation — 动画模块
 *
 * Tween 动画管理：支持多属性插值、多种缓动函数、循环播放。
 */
export default {
    name: '__OV.Animation',
    install(ctx) {
        const tweens = new Map();
        let nextId = 0;
        function updateTween(tween, now) {
            const elapsed = now - tween.startTime;
            let progress = Math.min(elapsed / tween.duration, 1);
            progress = tween.easing(progress);
            for (const [key, fromVal] of Object.entries(tween.from)) {
                const toVal = tween.to[key];
                if (typeof toVal === 'number') {
                    tween.target[key] = fromVal + (toVal - fromVal) * progress;
                }
            }
            tween.onUpdate?.();
            if (progress >= 1) {
                tween.onComplete?.();
                return false;
            }
            return true;
        }
        ctx.system.animation = {
            tween(target, config) {
                const id = `tween_${++nextId}`;
                const from = {};
                for (const key of Object.keys(config.to)) {
                    const val = target[key];
                    from[key] = typeof val === 'number' ? val : 0;
                }
                const tween = {
                    id,
                    target,
                    from,
                    to: config.to,
                    duration: config.duration,
                    easing: easings[config.easing ?? 'linear'] ?? easeLinear,
                    startTime: performance.now(),
                    onUpdate: config.onUpdate,
                    onComplete: config.onComplete,
                };
                tweens.set(id, tween);
                return id;
            },
            kill(id) {
                tweens.delete(id);
            },
            killAll() {
                tweens.clear();
            },
            update() {
                const now = performance.now();
                for (const [id, tween] of tweens) {
                    if (!updateTween(tween, now)) {
                        tweens.delete(id);
                    }
                }
            },
        };
    },
    update(ctx) {
        ctx.system.animation?.update?.();
    },
};
//# sourceMappingURL=animation-module.js.map