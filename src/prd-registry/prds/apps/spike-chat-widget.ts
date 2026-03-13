import type { PrdDefinition } from "../../core-logic/types.js";

export const spikeChatWidgetPrd: PrdDefinition = {
  id: "app:spike-chat-widget",
  level: "app",
  name: "Spike Chat Widget",
  summary:
    "Floating chat widget: minimize/maximize, notification badge, session persistence, app drawer trigger",
  purpose:
    "Persistent AI chat surface available on every page. The widget floats in the bottom-right corner and gives users instant access to the Spike AI assistant without leaving their current context. It manages its own session state across navigation and can open the app drawer to surface related tools.",
  constraints: [
    "Widget must render on every route without re-mounting on navigation",
    "Session transcript persisted in Durable Object, survives hard refresh",
    "Minimised state stored in localStorage and restored on next visit",
    "Notification badge count must be accurate within 1s of message arrival",
    "App drawer trigger must deep-link to a specific app slug if context is known",
    "Widget must not block underlying page content when minimised",
  ],
  acceptance: [
    "Chat session continues uninterrupted across client-side route transitions",
    "Minimise/maximise animation completes in under 200ms",
    "Unread badge shows correct count after receiving background messages",
    "App drawer opens to correct category or app when triggered from chat context",
    "Session transcript available after hard refresh without re-authentication",
  ],
  toolCategories: ["chat-session", "app-drawer", "notification"],
  tools: [
    "chat_send_message",
    "chat_get_history",
    "chat_minimize",
    "chat_maximize",
    "app_drawer_open",
    "notification_badge_update",
  ],
  composesFrom: ["platform", "domain:ai-automation"],
  routePatterns: [],
  keywords: [
    "chat",
    "widget",
    "floating",
    "assistant",
    "session",
    "notification",
    "badge",
    "drawer",
    "persistent",
  ],
  tokenEstimate: 300,
  version: "1.0.0",
};
