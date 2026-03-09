export type PageLoadKind = "bootstrap" | "navigation";

export interface PageLoadEntry {
  id: string;
  href: string;
  kind: PageLoadKind;
  startedAt: number;
}

export interface PageLoadSnapshot {
  activeCount: number;
  totalStarted: number;
  totalFinished: number;
  activeLoads: PageLoadEntry[];
}

interface PageLoadRouterLocation {
  href: string;
}

interface PageLoadRouterEvent {
  hrefChanged: boolean;
  pathChanged: boolean;
  toLocation: PageLoadRouterLocation;
}

interface PageLoadRouter {
  subscribe(eventType: "onBeforeLoad", fn: (event: PageLoadRouterEvent) => void): () => void;
  subscribe(eventType: "onResolved", fn: (event: PageLoadRouterEvent) => void): () => void;
}

interface PageLoadMonitor {
  getSnapshot: () => PageLoadSnapshot;
  reset: () => void;
}

declare global {
  interface Window {
    __spikePageLoadCounter?: number;
    __spikePageLoadMonitor?: PageLoadMonitor;
    __spikePageLoadSnapshot?: PageLoadSnapshot;
  }
}

const PAGE_LOAD_EVENT_NAME = "spike:page-load-counter";

const state = {
  activeLoads: new Map<string, PageLoadEntry>(),
  bootstrapLoadId: null as string | null,
  nextId: 0,
  totalFinished: 0,
  totalStarted: 0,
};

function resolveHref(href?: string): string {
  if (href) {
    return href;
  }

  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.href;
}

function getSnapshot(): PageLoadSnapshot {
  return {
    activeCount: state.activeLoads.size,
    totalStarted: state.totalStarted,
    totalFinished: state.totalFinished,
    activeLoads: Array.from(state.activeLoads.values()),
  };
}

function syncBrowserState(): void {
  const snapshot = getSnapshot();

  if (typeof window !== "undefined") {
    window.__spikePageLoadCounter = snapshot.activeCount;
    window.__spikePageLoadSnapshot = snapshot;
    window.__spikePageLoadMonitor = {
      getSnapshot,
      reset: resetPageLoadCounter,
    };

    if (typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent(PAGE_LOAD_EVENT_NAME, { detail: snapshot }));
    }
  }

  if (typeof document !== "undefined") {
    document.documentElement.dataset.pageLoadCount = String(snapshot.activeCount);
    document.documentElement.dataset.pageLoadFinished = String(snapshot.totalFinished);
    document.documentElement.dataset.pageLoadStarted = String(snapshot.totalStarted);
  }
}

export function beginPageLoad(options: { href?: string; kind?: PageLoadKind } = {}): string {
  const id = `page-load-${state.nextId + 1}`;
  state.nextId += 1;
  state.totalStarted += 1;
  state.activeLoads.set(id, {
    id,
    href: resolveHref(options.href),
    kind: options.kind ?? "navigation",
    startedAt: Date.now(),
  });
  syncBrowserState();
  return id;
}

export function finishPageLoad(id: string): boolean {
  const didDelete = state.activeLoads.delete(id);
  if (!didDelete) {
    return false;
  }

  if (state.bootstrapLoadId === id) {
    state.bootstrapLoadId = null;
  }

  state.totalFinished += 1;
  syncBrowserState();
  return true;
}

export function beginBootstrapPageLoad(href?: string): string {
  if (state.bootstrapLoadId && state.activeLoads.has(state.bootstrapLoadId)) {
    return state.bootstrapLoadId;
  }

  const id = beginPageLoad({ href, kind: "bootstrap" });
  state.bootstrapLoadId = id;
  return id;
}

export function finishBootstrapPageLoad(): boolean {
  if (!state.bootstrapLoadId) {
    return false;
  }

  const id = state.bootstrapLoadId;
  state.bootstrapLoadId = null;
  return finishPageLoad(id);
}

export function connectPageLoadCounter(router: PageLoadRouter): () => void {
  let navigationLoadId: string | null = null;

  const unsubscribeBeforeLoad = router.subscribe("onBeforeLoad", (event) => {
    if (!event.pathChanged && !event.hrefChanged) {
      return;
    }

    if (navigationLoadId) {
      finishPageLoad(navigationLoadId);
    }

    navigationLoadId = beginPageLoad({
      href: event.toLocation.href,
      kind: "navigation",
    });
  });

  const unsubscribeResolved = router.subscribe("onResolved", (event) => {
    if (!event.pathChanged && !event.hrefChanged && !navigationLoadId) {
      return;
    }

    finishBootstrapPageLoad();

    if (navigationLoadId) {
      finishPageLoad(navigationLoadId);
      navigationLoadId = null;
    }
  });

  return () => {
    unsubscribeBeforeLoad();
    unsubscribeResolved();

    if (navigationLoadId) {
      finishPageLoad(navigationLoadId);
      navigationLoadId = null;
    }

    finishBootstrapPageLoad();
  };
}

export function getPageLoadSnapshot(): PageLoadSnapshot {
  return getSnapshot();
}

export function resetPageLoadCounter(): void {
  state.activeLoads.clear();
  state.bootstrapLoadId = null;
  state.nextId = 0;
  state.totalFinished = 0;
  state.totalStarted = 0;
  syncBrowserState();
}
