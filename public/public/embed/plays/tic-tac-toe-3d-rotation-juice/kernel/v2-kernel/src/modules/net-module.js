/**
 * __OV.Net — HTTP 请求模块
 *
 * 提供 fetch 封装：拦截器、超时、重试、取消。
 */
export default {
    name: '__OV.Net',
    install(ctx) {
        const abortControllers = new Map();
        async function request(url, config = {}) {
            const { method = 'GET', headers = {}, body, timeout = 10000, retries = 0 } = config;
            const id = `${method}_${url}_${Date.now()}`;
            const controller = new AbortController();
            abortControllers.set(id, controller);
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (retries > 0) {
                    ctx.logger.warn(`[Net] 请求失败，剩余重试次数 ${retries}: ${url}`);
                    return request(url, { ...config, retries: retries - 1 });
                }
                throw error;
            }
            finally {
                abortControllers.delete(id);
            }
        }
        ctx.system.net = {
            get(url, config) {
                return request(url, { ...config, method: 'GET' });
            },
            post(url, body, config) {
                return request(url, { ...config, method: 'POST', body });
            },
            request,
            cancel(urlPattern) {
                for (const [id, controller] of abortControllers) {
                    if (!urlPattern || id.includes(urlPattern)) {
                        controller.abort();
                        abortControllers.delete(id);
                    }
                }
            },
        };
    },
};
//# sourceMappingURL=net-module.js.map