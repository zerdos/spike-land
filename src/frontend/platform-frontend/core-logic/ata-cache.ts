export const DB_NAME = "spike-app-ata-cache";
export const STORE_NAME = "types";
export const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export async function getTypeCache(url: string): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const data = request.result;
        if (data && typeof data === "object" && "content" in data && "timestamp" in data) {
          if (Date.now() - data.timestamp < TTL_MS) {
            resolve(data.content);
            return;
          }
        }
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function setTypeCache(url: string, content: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ content, timestamp: Date.now() }, url);

      request.onerror = () => resolve();
      request.onsuccess = () => resolve();
    } catch {
      resolve();
    }
  });
}
