if (!window.requestIdleCallback) {
    window.requestIdleCallback = function (callback, options) {
        const userTimeout = options?.timeout;
        const timeout = userTimeout ?? Infinity;
        const startTime = Date.now();

        const id = setTimeout(() => {
            const now = Date.now();
            const remaining = Math.max(0, timeout - (now - startTime));
            callback({
                timeRemaining: () => remaining,
                didTimeout: userTimeout != null && now - startTime >= userTimeout,
            });
        }, 1);

        return id;
    };
}

if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function (id) {
        clearTimeout(id);
    };
}