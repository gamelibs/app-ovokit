/**
 * __OV.Loader — 基础资源加载模块
 *
 * 支持 image / audio / json / text / font 加载。
 */
export default {
    name: '__OV.Loader',
    install(ctx) {
        const cache = new Map();
        async function loadImage(url) {
            if (cache.has(url))
                return cache.get(url);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => { cache.set(url, img); resolve(img); };
                img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
                img.src = url;
            });
        }
        async function loadAudio(url) {
            if (cache.has(url))
                return cache.get(url);
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => { cache.set(url, audio); resolve(audio); };
                audio.onerror = () => reject(new Error(`音频加载失败: ${url}`));
                audio.src = url;
                audio.load();
            });
        }
        async function loadJson(url) {
            if (cache.has(url))
                return cache.get(url);
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`JSON 加载失败: ${url}`);
            const data = await res.json();
            cache.set(url, data);
            return data;
        }
        async function loadText(url) {
            if (cache.has(url))
                return cache.get(url);
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`文本加载失败: ${url}`);
            const text = await res.text();
            cache.set(url, text);
            return text;
        }
        ctx.system.loader = {
            load(url, type) {
                switch (type) {
                    case 'image': return loadImage(url);
                    case 'audio': return loadAudio(url);
                    case 'json': return loadJson(url);
                    case 'text': return loadText(url);
                    default: throw new Error(`不支持的资源类型: ${type}`);
                }
            },
            loadImage,
            loadAudio,
            loadJson,
            loadText,
            get(url) {
                return cache.get(url);
            },
            has(url) {
                return cache.has(url);
            },
            clear() {
                cache.clear();
            },
        };
    },
};
//# sourceMappingURL=loader-module.js.map