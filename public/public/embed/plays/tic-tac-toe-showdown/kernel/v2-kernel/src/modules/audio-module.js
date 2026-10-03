/**
 * __OV.Audio — 音频管理模块
 *
 * 支持 BGM/SFX、音量控制、淡入淡出、并发限制。
 */
export default {
    name: '__OV.Audio',
    install(ctx) {
        const tracks = new Map();
        let masterVolume = 1;
        let maxConcurrent = 8;
        let activeCount = 0;
        function createAudio(src, volume, loop) {
            const audio = new Audio(src);
            audio.volume = volume * masterVolume;
            audio.loop = loop;
            return audio;
        }
        ctx.system.audio = {
            play(id, src, options = {}) {
                const { volume = 1, loop = false, type = 'sfx' } = options;
                if (type === 'sfx' && activeCount >= maxConcurrent) {
                    ctx.logger.warn(`[Audio] 并发音频超过限制 ${maxConcurrent}，跳过: ${id}`);
                    return;
                }
                const existing = tracks.get(id);
                if (existing?.element) {
                    existing.element.currentTime = 0;
                    existing.element.play().catch(() => { });
                    return;
                }
                const audio = createAudio(src, volume, loop);
                const track = { src, volume, loop, element: audio };
                tracks.set(id, track);
                audio.addEventListener('ended', () => {
                    if (!loop) {
                        activeCount = Math.max(0, activeCount - 1);
                    }
                });
                audio.play().catch((err) => {
                    ctx.logger.warn(`[Audio] 播放失败: ${id}`, err);
                });
                if (type === 'sfx')
                    activeCount++;
            },
            stop(id) {
                const track = tracks.get(id);
                if (track?.element) {
                    track.element.pause();
                    track.element.currentTime = 0;
                    activeCount = Math.max(0, activeCount - 1);
                }
            },
            pause(id) {
                tracks.get(id)?.element?.pause();
            },
            resume(id) {
                tracks.get(id)?.element?.play().catch(() => { });
            },
            setVolume(id, volume) {
                const track = tracks.get(id);
                if (track) {
                    track.volume = Math.max(0, Math.min(1, volume));
                    if (track.element) {
                        track.element.volume = track.volume * masterVolume;
                    }
                }
            },
            setMasterVolume(volume) {
                masterVolume = Math.max(0, Math.min(1, volume));
                for (const track of tracks.values()) {
                    if (track.element) {
                        track.element.volume = track.volume * masterVolume;
                    }
                }
            },
            fade(id, toVolume, duration = 1000) {
                const track = tracks.get(id);
                if (!track?.element)
                    return;
                const fromVolume = track.element.volume;
                const startTime = performance.now();
                function tick() {
                    const elapsed = performance.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = fromVolume + (toVolume - fromVolume) * progress;
                    const el = tracks.get(id)?.element;
                    if (el)
                        el.volume = current;
                    if (progress < 1)
                        requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            },
            stopAll() {
                for (const id of tracks.keys()) {
                    const t = tracks.get(id);
                    if (t?.element) {
                        t.element.pause();
                        t.element.currentTime = 0;
                    }
                }
                activeCount = 0;
            },
        };
    },
};
//# sourceMappingURL=audio-module.js.map