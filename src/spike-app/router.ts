import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { IndexPage } from "./routes/index";
import { AboutPage } from "./routes/about";
import { AnalyticsPage } from "./routes/analytics";
import { CallbackPage } from "./routes/callback";
import { LoginPage } from "./routes/login";
import { PrivacyPage } from "./routes/privacy";
import { TermsPage } from "./routes/terms";
import { SettingsPage } from "./routes/settings";
import { StorePage } from "./routes/store";
import { VersionPage } from "./routes/version";
import { AppsIndexPage } from "./routes/apps/index";
import { AppsNewPage } from "./routes/apps/new";
import { AppDetailPage } from "./routes/apps/$appId";
import { BlogIndexPage } from "./routes/blog/index";
import { BlogPostPage } from "./routes/blog/$slug";
import { BugbookIndexPage } from "./routes/bugbook/index";
import { BugbookDetailPage } from "./routes/bugbook/$bugId";
import { BugbookLeaderboardPage } from "./routes/bugbook/leaderboard";
import { DashboardPage } from "./routes/dashboard/index";
import { BazdmegDashboardPage } from "./routes/dashboard/bazdmeg";
import { LearnIndexPage } from "./routes/learn/index";
import { LearnSessionPage } from "./routes/learn/$sessionId";
import { BadgePage } from "./routes/learn/badge/$token";
import { MessagesIndexPage } from "./routes/messages/index";
import { MessageThreadPage } from "./routes/messages/$userId";
import { ToolsIndexPage } from "./routes/tools/index";
import { ToolsCategoryPage } from "./routes/tools/$toolName";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/callback",
  component: CallbackPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/store",
  component: StorePage,
});

const versionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/version",
  component: VersionPage,
});

// Apps routes
const appsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apps",
});

const appsIndexRoute = createRoute({
  getParentRoute: () => appsRoute,
  path: "/",
  component: AppsIndexPage,
});

const appsNewRoute = createRoute({
  getParentRoute: () => appsRoute,
  path: "/new",
  component: AppsNewPage,
});

const appDetailRoute = createRoute({
  getParentRoute: () => appsRoute,
  path: "/$appId",
  component: AppDetailPage,
});

// Blog routes
const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
});

const blogIndexRoute = createRoute({
  getParentRoute: () => blogRoute,
  path: "/",
  component: BlogIndexPage,
});

const blogPostRoute = createRoute({
  getParentRoute: () => blogRoute,
  path: "/$slug",
  component: BlogPostPage,
});

// Bugbook routes
const bugbookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bugbook",
});

const bugbookIndexRoute = createRoute({
  getParentRoute: () => bugbookRoute,
  path: "/",
  component: BugbookIndexPage,
});

const bugbookDetailRoute = createRoute({
  getParentRoute: () => bugbookRoute,
  path: "/$bugId",
  component: BugbookDetailPage,
});

const bugbookLeaderboardRoute = createRoute({
  getParentRoute: () => bugbookRoute,
  path: "/leaderboard",
  component: BugbookLeaderboardPage,
});

// Dashboard routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/",
  component: DashboardPage,
});

const bazdmegDashboardRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/bazdmeg",
  component: BazdmegDashboardPage,
});

// Learn routes
const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/learn",
});

const learnIndexRoute = createRoute({
  getParentRoute: () => learnRoute,
  path: "/",
  component: LearnIndexPage,
});

const learnSessionRoute = createRoute({
  getParentRoute: () => learnRoute,
  path: "/$sessionId",
  component: LearnSessionPage,
});

const learnBadgeRoute = createRoute({
  getParentRoute: () => learnRoute,
  path: "/badge/$token",
  component: BadgePage,
});

// Messages routes
const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
});

const messagesIndexRoute = createRoute({
  getParentRoute: () => messagesRoute,
  path: "/",
  component: MessagesIndexPage,
});

const messageThreadRoute = createRoute({
  getParentRoute: () => messagesRoute,
  path: "/$userId",
  component: MessageThreadPage,
});

// Tools routes
const toolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools",
});

const toolsIndexRoute = createRoute({
  getParentRoute: () => toolsRoute,
  path: "/",
  component: ToolsIndexPage,
});

const toolsCategoryRoute = createRoute({
  getParentRoute: () => toolsRoute,
  path: "/$toolName",
  component: ToolsCategoryPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  analyticsRoute,
  callbackRoute,
  loginRoute,
  privacyRoute,
  termsRoute,
  settingsRoute,
  storeRoute,
  versionRoute,
  appsRoute.addChildren([appsIndexRoute, appsNewRoute, appDetailRoute]),
  blogRoute.addChildren([blogIndexRoute, blogPostRoute]),
  bugbookRoute.addChildren([
    bugbookIndexRoute,
    bugbookDetailRoute,
    bugbookLeaderboardRoute,
  ]),
  dashboardRoute.addChildren([dashboardIndexRoute, bazdmegDashboardRoute]),
  learnRoute.addChildren([learnIndexRoute, learnSessionRoute, learnBadgeRoute]),
  messagesRoute.addChildren([messagesIndexRoute, messageThreadRoute]),
  toolsRoute.addChildren([toolsIndexRoute, toolsCategoryRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
