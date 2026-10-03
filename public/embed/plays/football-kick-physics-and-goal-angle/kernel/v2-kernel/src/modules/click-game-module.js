/**
 * __OV.Games.Demo.ClickGame — 最小可玩游戏模块
 *
 * 在画布中央显示一个圆形，点击后变色并加分。
 * 演示：install 注册事件 → start 初始化状态 → update 渲染
 */
export default {
    name: '__OV.Games.Demo.ClickGame',
    install(ctx) {
        const eventBus = ctx.system.events;
        if (!eventBus)
            return;
        // 游戏状态
        const state = {
            score: 0,
            circleColor: '#0ea5e9',
            circleX: ctx.width / 2,
            circleY: ctx.height / 2,
            circleR: 60,
            dirty: true,
        };
        ctx.game.clickGame = state;
        // 监听点击
        const offClick = eventBus.on('input:pointerDown', (payload) => {
            const p = payload;
            if (!p)
                return;
            const dx = p.x - state.circleX;
            const dy = p.y - state.circleY;
            if (dx * dx + dy * dy <= state.circleR * state.circleR) {
                state.score += 1;
                state.circleColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
                state.dirty = true;
                eventBus.emit('game:scoreChanged', { score: state.score });
            }
        });
        ctx.game._clickGameOffClick = offClick;
    },
    start(ctx) {
        ctx.logger.info('[ClickGame] 游戏开始');
        // 初始化分数
        const state = ctx.game.clickGame;
        if (state) {
            state.score = 0;
            state.dirty = true;
        }
    },
    update(ctx) {
        const state = ctx.game.clickGame;
        const render = ctx.system.render;
        if (!state || !render)
            return;
        // 只重绘脏区域（简化：整帧重绘）
        render.clear(ctx.blueprint.canvas.background || '#0f172a');
        const c2d = render.ctx;
        // 绘制圆形
        c2d.beginPath();
        c2d.arc(state.circleX, state.circleY, state.circleR, 0, Math.PI * 2);
        c2d.fillStyle = state.circleColor;
        c2d.fill();
        c2d.strokeStyle = '#ffffff40';
        c2d.lineWidth = 3;
        c2d.stroke();
        // 绘制分数
        c2d.fillStyle = '#e2e8f0';
        c2d.font = 'bold 24px sans-serif';
        c2d.textAlign = 'center';
        c2d.fillText(`Score: ${state.score}`, ctx.width / 2, state.circleY + state.circleR + 40);
        // 绘制提示
        c2d.font = '14px sans-serif';
        c2d.fillStyle = '#94a3b8';
        c2d.fillText('点击圆形得分', ctx.width / 2, state.circleY + state.circleR + 65);
    },
    destroy(ctx) {
        const offClick = ctx.game._clickGameOffClick;
        if (offClick)
            offClick();
        delete ctx.game.clickGame;
        delete ctx.game._clickGameOffClick;
    },
};
//# sourceMappingURL=click-game-module.js.map