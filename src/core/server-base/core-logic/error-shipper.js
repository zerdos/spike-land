export function createErrorShipper(options = {}) {
    const baseUrl = options.baseUrl ?? "https://spike.land/api";
    const batchSize = options.batchSize ?? 10;
    const flushIntervalMs = options.flushIntervalMs ?? 5000;
    let buffer = [];
    let timeoutId = null;
    const flush = async () => {
        if (buffer.length === 0)
            return;
        const entries = [...buffer];
        buffer = [];
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        try {
            await fetch(`${baseUrl}/errors/ingest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(entries),
            });
        }
        catch {
            // Silently discard: error shipping is best-effort and must not throw
        }
    };
    const shipError = (entry) => {
        buffer.push(entry);
        if (buffer.length >= batchSize) {
            void flush();
        }
        else if (!timeoutId) {
            timeoutId = setTimeout(flush, flushIntervalMs);
        }
    };
    if (typeof process !== "undefined" && typeof process.on === "function") {
        process.on("beforeExit", () => {
            void flush();
        });
    }
    return { shipError, flush };
}
//# sourceMappingURL=error-shipper.js.map