export interface AppCatalogEntry {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentBg: string;
  iconPath: string;
  status: "Live" | "Beta";
  category: string;
  hasPrd?: boolean;
}

export const appCatalog: AppCatalogEntry[] = [
  {
    id: "codespace",
    name: "CodeSpace",
    description:
      "Instant browser-based dev environments pre-configured for AI orchestration and TypeScript strict mode.",
    accent: "#2563eb",
    accentBg: "rgba(37,99,235,0.1)",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    status: "Live",
    category: "Environment",
    hasPrd: true,
  },
  {
    id: "spike-chat",
    name: "Spike Chat",
    description:
      "AI chat assistant with Bayesian memory, a four-stage execution pipeline, and MCP-native tool use.",
    accent: "#0f766e",
    accentBg: "rgba(15,118,110,0.1)",
    iconPath: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    status: "Live",
    category: "AI & Chat",
    hasPrd: false,
  },
  {
    id: "qa-studio",
    name: "QA Studio",
    description:
      "Automate testing with a 16-persona BAZDMEG agent team navigating your app around the clock.",
    accent: "#16a34a",
    accentBg: "rgba(22,163,74,0.1)",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    status: "Live",
    category: "Testing",
    hasPrd: true,
  },
  {
    id: "ops-dash",
    name: "Ops Dashboard",
    description:
      "Real-time telemetry, agent metrics, and pipeline status in one unified command center.",
    accent: "#9333ea",
    accentBg: "rgba(147,51,234,0.1)",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    status: "Live",
    category: "Ops",
    hasPrd: false,
  },
  {
    id: "app-creator",
    name: "App Creator",
    description:
      "Visually compose agent workflows and deploy full-stack apps without managing infrastructure.",
    accent: "#ea580c",
    accentBg: "rgba(234,88,12,0.1)",
    iconPath:
      "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    status: "Beta",
    category: "Builder",
    hasPrd: false,
  },
  {
    id: "pages-template-chooser",
    name: "Pages Template Chooser",
    description: "A native-feeling macOS template gallery for Pages with premium upsell surfaces.",
    accent: "#ec4899",
    accentBg: "rgba(236,72,153,0.1)",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    status: "Live",
    category: "Media",
    hasPrd: true,
  },
  {
    id: "chess-arena",
    name: "Chess Arena",
    description: "Multi-agent chess battleground driven by PRD specifications.",
    accent: "#000000",
    accentBg: "rgba(0,0,0,0.1)",
    iconPath:
      "M12 2l3 4h-6l3-4zM8 6l-2 4h12l-2-4H8zM6 10l-1 4h14l-1-4H6zM4 14l-1 4h18l-1-4H4zM2 18h20v2H2z",
    status: "Live",
    category: "Gaming",
    hasPrd: true,
  },
  {
    id: "math-arena",
    name: "Math Arena",
    description: "The Drunk Man, The Lost Bird, and Why Coincidences Aren't Random.",
    accent: "#0ea5e9",
    accentBg: "rgba(14,165,233,0.1)",
    iconPath:
      "M9 7h6M9 11h6m-6 4h6m-6 4h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z",
    status: "Live",
    category: "Education",
    hasPrd: true,
  },
  {
    id: "code-eval-arena",
    name: "Code Eval Arena",
    description: "LLM Coding Benchmark MCP Server evaluated by The Arena.",
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.1)",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    status: "Beta",
    category: "DevTools",
    hasPrd: true,
  },
  {
    id: "qa-arena",
    name: "QA Arena",
    description: "Turns every spike.land user into a tester. Automated health checks.",
    accent: "#ef4444",
    accentBg: "rgba(239,68,68,0.1)",
    iconPath:
      "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    status: "Live",
    category: "Testing",
    hasPrd: true,
  },
  {
    id: "learning-arena",
    name: "Learning Arena",
    description: "The Open Learning Platform. Put yourself in a room with Einstein.",
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.1)",
    iconPath:
      "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    status: "Beta",
    category: "Education",
    hasPrd: true,
  },
  {
    id: "moonshot-arena",
    name: "Moonshot Arena",
    description: "The Arena where intelligence is copyable and ideas are rigorously tested.",
    accent: "#8b5cf6",
    accentBg: "rgba(139,92,246,0.1)",
    iconPath:
      "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
    status: "Beta",
    category: "Research",
    hasPrd: true,
  },
  {
    id: "token-bank",
    name: "Token Bank",
    description: "Manage your token economy efficiently within spike.land.",
    accent: "#14b8a6",
    accentBg: "rgba(20,184,166,0.1)",
    iconPath:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    status: "Live",
    category: "Finance",
    hasPrd: true,
  },
  {
    id: "intelligence-compressor",
    name: "Intelligence Compressor",
    description: "Lossless compression for AI memory contexts.",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.1)",
    iconPath:
      "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    status: "Beta",
    category: "DevTools",
    hasPrd: false,
  },
  {
    id: "whatsapp-bounty",
    name: "WhatsApp Bounty",
    description: "Earn bounties and coordinate tasks directly from WhatsApp.",
    accent: "#22c55e",
    accentBg: "rgba(34,197,94,0.1)",
    iconPath:
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    status: "Live",
    category: "Social",
    hasPrd: false,
  },
  {
    id: "spike-analytics",
    name: "Spike Analytics",
    description: "Deep insights into tool usage, latency, and agent behavior.",
    accent: "#f43f5e",
    accentBg: "rgba(244,63,94,0.1)",
    iconPath: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
    status: "Live",
    category: "Ops",
    hasPrd: false,
  },
  {
    id: "agent-dashboard",
    name: "Agent Dashboard",
    description: "Monitor your multi-agent swarm in real-time.",
    accent: "#3b82f6",
    accentBg: "rgba(59,130,246,0.1)",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    status: "Live",
    category: "Ops",
    hasPrd: false,
  },
  {
    id: "molt-worker",
    name: "MOLT Worker",
    description: "Serverless execution layer for autonomous agents.",
    accent: "#fbbf24",
    accentBg: "rgba(251,191,36,0.1)",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    status: "Live",
    category: "Environment",
    hasPrd: true,
  },
  {
    id: "prd-registry",
    name: "PRD Registry",
    description: "Centralized product requirements document manager.",
    accent: "#06b6d4",
    accentBg: "rgba(6,182,212,0.1)",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    status: "Live",
    category: "DevTools",
    hasPrd: true,
  },
  {
    id: "vibe-coder",
    name: "Vibe Coder",
    description: "Write code using pure vibes and generative AI.",
    accent: "#d946ef",
    accentBg: "rgba(217,70,239,0.1)",
    iconPath:
      "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    status: "Beta",
    category: "DevTools",
    hasPrd: false,
  },
  {
    id: "app-store-classic",
    name: "App Store Classic",
    description: "The restored app store experience from next.spike.land.",
    accent: "#64748b",
    accentBg: "rgba(100,116,139,0.1)",
    iconPath: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    status: "Live",
    category: "Store",
    hasPrd: true,
  },
];

export function getAppById(appId: string | undefined): AppCatalogEntry | undefined {
  return appCatalog.find((app) => app.id === appId);
}
