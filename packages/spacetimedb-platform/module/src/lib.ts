/**
 * SpacetimeDB Platform Module
 *
 * Defines tables and reducers for the spike.land platform:
 * users, OAuth, MCP tools, apps, agents, content, messaging, monitoring.
 *
 * Deploy: spacetime publish --server maincloud spike-platform
 */

import { schema, t, table, SenderError } from "spacetimedb/server";

// ─── Tables: Users & Identity ───

const User = table(
  { name: "user", public: true },
  {
    identity: t.identity().primaryKey(),
    handle: t.string().unique(),
    displayName: t.string(),
    email: t.string(),
    role: t.string(),
    avatarUrl: t.string(),
    online: t.bool(),
    lastSeen: t.u64(),
    createdAt: t.u64(),
  },
);

const OAuthLink = table(
  { name: "oauth_link", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    userIdentity: t.identity().index("btree"),
    provider: t.string(),
    providerAccountId: t.string(),
    createdAt: t.u64(),
  },
);

// ─── Tables: MCP Tool Registry ───

const RegisteredTool = table(
  { name: "registered_tool", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    name: t.string().index("btree"),
    description: t.string(),
    inputSchema: t.string(),
    providerIdentity: t.identity().index("btree"),
    category: t.string(),
    createdAt: t.u64(),
  },
);

const ToolUsage = table(
  { name: "tool_usage", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    toolName: t.string().index("btree"),
    userIdentity: t.identity(),
    timestamp: t.u64(),
    durationMs: t.u32(),
    success: t.bool(),
  },
);

const UserToolPreference = table(
  { name: "user_tool_preference", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    userIdentity: t.identity().index("btree"),
    toolName: t.string(),
    enabled: t.bool(),
    customConfig: t.string(),
  },
);

// ─── Tables: Apps / Store ───

const App = table(
  { name: "app", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    slug: t.string().unique(),
    name: t.string(),
    description: t.string(),
    ownerIdentity: t.identity().index("btree"),
    status: t.string(),
    r2CodeKey: t.string(),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const AppVersion = table(
  { name: "app_version", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    appId: t.u64().index("btree"),
    version: t.u32(),
    codeHash: t.string(),
    changeDescription: t.string(),
    createdBy: t.identity(),
    createdAt: t.u64(),
  },
);

const AppMessage = table(
  { name: "app_message", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    appId: t.u64().index("btree"),
    role: t.string(),
    content: t.string(),
    createdAt: t.u64(),
  },
);

// ─── Tables: Agent Coordination ───

const Agent = table(
  { name: "agent", public: true },
  {
    identity: t.identity().primaryKey(),
    displayName: t.string(),
    capabilities: t.array(t.string()),
    online: t.bool(),
    lastSeen: t.u64(),
  },
);

const AgentMessage = table(
  { name: "agent_message", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    fromAgent: t.identity(),
    toAgent: t.identity().index("btree"),
    content: t.string(),
    timestamp: t.u64(),
    delivered: t.bool(),
  },
);

const McpTask = table(
  { name: "mcp_task", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    toolName: t.string(),
    argumentsJson: t.string(),
    requesterIdentity: t.identity(),
    providerIdentity: t.option(t.identity()),
    status: t.string(), // "pending", "claimed", "completed", "failed"
    resultJson: t.option(t.string()),
    error: t.option(t.string()),
    createdAt: t.u64(),
    completedAt: t.option(t.u64()),
  },
);

// ─── Tables: Content ───

const Page = table(
  { name: "page", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    slug: t.string().unique(),
    title: t.string(),
    description: t.string(),
    published: t.bool(),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const PageBlock = table(
  { name: "page_block", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    pageId: t.u64().index("btree"),
    blockType: t.string(),
    contentJson: t.string(),
    sortOrder: t.u32(),
  },
);


const CodeSession = table(
  { name: "code_session", public: true },
  {
    codeSpace: t.string().primaryKey(),
    code: t.string(),
    html: t.string(),
    css: t.string(),
    transpiled: t.string(),
    messagesJson: t.string(),
    lastUpdatedBy: t.identity(),
    updatedAt: t.u64(),
  },
);

// ─── Tables: Messaging ───

const DirectMessage = table(
  { name: "direct_message", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    fromIdentity: t.identity(),
    toIdentity: t.identity().index("btree"),
    content: t.string(),
    readStatus: t.bool(),
    createdAt: t.u64(),
  },
);

// ─── Tables: Monitoring ───

const PlatformEvent = table(
  { name: "platform_event", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    source: t.string(),
    eventType: t.string(),
    metadataJson: t.string(),
    userIdentity: t.option(t.identity()),
    timestamp: t.u64(),
  },
);

const HealthCheck = table(
  { name: "health_check", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    service: t.string(),
    status: t.string(),
    latencyMs: t.u32(),
    checkedAt: t.u64(),
  },
);

// ─── Tables: Image Studio ───

const Image = table(
  { name: "image", public: true },
  {
    id: t.string().primaryKey(),
    userIdentity: t.identity().index("btree"),
    name: t.string(),
    description: t.option(t.string()),
    originalUrl: t.string(),
    originalR2Key: t.string(),
    originalWidth: t.u32(),
    originalHeight: t.u32(),
    originalSizeBytes: t.u64(),
    originalFormat: t.string(),
    isPublic: t.bool(),
    viewCount: t.u64(),
    tags: t.array(t.string()),
    shareToken: t.option(t.string()),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const EnhancementJob = table(
  { name: "enhancement_job", public: true },
  {
    id: t.string().primaryKey(),
    imageId: t.string().index("btree"),
    userIdentity: t.identity().index("btree"),
    tier: t.string(),
    creditsCost: t.u32(),
    status: t.string(),
    enhancedUrl: t.option(t.string()),
    enhancedR2Key: t.option(t.string()),
    enhancedWidth: t.option(t.u32()),
    enhancedHeight: t.option(t.u32()),
    enhancedSizeBytes: t.option(t.u64()),
    errorMessage: t.option(t.string()),
    retryCount: t.u32(),
    metadataJson: t.option(t.string()),
    processingStartedAt: t.option(t.u64()),
    processingCompletedAt: t.option(t.u64()),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const Album = table(
  { name: "album", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    handle: t.string().unique(),
    userIdentity: t.identity().index("btree"),
    name: t.string(),
    description: t.option(t.string()),
    coverImageId: t.option(t.string()),
    privacy: t.string(),
    defaultTier: t.string(),
    shareToken: t.option(t.string()),
    sortOrder: t.u32(),
    pipelineId: t.option(t.string()),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const AlbumImage = table(
  { name: "album_image", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    albumId: t.u64().index("btree"),
    imageId: t.string().index("btree"),
    sortOrder: t.u32(),
    addedAt: t.u64(),
  },
);

const Pipeline = table(
  { name: "pipeline", public: true },
  {
    id: t.string().primaryKey(),
    userIdentity: t.option(t.identity()),
    name: t.string(),
    description: t.option(t.string()),
    visibility: t.string(),
    shareToken: t.option(t.string()),
    tier: t.string(),
    analysisConfigJson: t.option(t.string()),
    autoCropConfigJson: t.option(t.string()),
    promptConfigJson: t.option(t.string()),
    generationConfigJson: t.option(t.string()),
    usageCount: t.u64(),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const GenerationJob = table(
  { name: "generation_job", public: true },
  {
    id: t.string().primaryKey(),
    userIdentity: t.identity().index("btree"),
    jobType: t.string(), // "GENERATE" | "MODIFY"
    tier: t.string(),
    creditsCost: t.u32(),
    status: t.string(),
    prompt: t.string(),
    inputImageUrl: t.option(t.string()),
    outputImageUrl: t.option(t.string()),
    outputWidth: t.option(t.u32()),
    outputHeight: t.option(t.u32()),
    outputSizeBytes: t.option(t.u64()),
    errorMessage: t.option(t.string()),
    createdAt: t.u64(),
    updatedAt: t.u64(),
  },
);

const Subject = table(
  { name: "subject", public: true },
  {
    id: t.u64().autoInc().primaryKey(),
    userIdentity: t.identity().index("btree"),
    imageId: t.string().index("btree"),
    label: t.string(),
    subjectType: t.string(),
    description: t.option(t.string()),
    createdAt: t.u64(),
  },
);

const Credits = table(
  { name: "credits", public: true },
  {
    userIdentity: t.identity().primaryKey(),
    balance: t.i64(),
    updatedAt: t.u64(),
  },
);

// ─── Schema ───

const spacetimedb = schema({
  user: User,
  oauth_link: OAuthLink,
  registered_tool: RegisteredTool,
  tool_usage: ToolUsage,
  user_tool_preference: UserToolPreference,
  app: App,
  app_version: AppVersion,
  app_message: AppMessage,
  agent: Agent,
  agent_message: AgentMessage,
  mcp_task: McpTask,
  page: Page,
  page_block: PageBlock,
  code_session: CodeSession,
  direct_message: DirectMessage,
  platform_event: PlatformEvent,
  health_check: HealthCheck,
  // Image Studio
  image: Image,
  enhancement_job: EnhancementJob,
  album: Album,
  album_image: AlbumImage,
  pipeline: Pipeline,
  generation_job: GenerationJob,
  subject: Subject,
  credits: Credits,
});

// ─── Lifecycle ───

export const init = spacetimedb.init((_ctx) => { });

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const existing = ctx.db.user.identity.find(ctx.sender);
  if (existing) {
    ctx.db.user.identity.update({
      ...existing,
      online: true,
      lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const existingUser = ctx.db.user.identity.find(ctx.sender);
  if (existingUser) {
    ctx.db.user.identity.update({
      ...existingUser,
      online: false,
      lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  }
  const existingAgent = ctx.db.agent.identity.find(ctx.sender);
  if (existingAgent) {
    ctx.db.agent.identity.update({
      ...existingAgent,
      online: false,
      lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  }
  // Remove registered tools from this disconnected leaf server
  for (const tool of ctx.db.registered_tool.providerIdentity.filter(ctx.sender)) {
    ctx.db.registered_tool.id.delete(tool.id);
  }
});

// ─── User Reducers ───

export const register_user = spacetimedb.reducer(
  {
    handle: t.string(),
    displayName: t.string(),
    email: t.string(),
    avatarUrl: t.string(),
  },
  (ctx, { handle, displayName, email, avatarUrl }) => {
    if (!handle) {
      throw new SenderError("Handle must not be empty");
    }
    const existing = ctx.db.user.identity.find(ctx.sender);
    if (existing) {
      throw new SenderError("User already registered");
    }
    ctx.db.user.insert({
      identity: ctx.sender,
      handle,
      displayName,
      email,
      avatarUrl,
      role: "user",
      online: true,
      lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const update_profile = spacetimedb.reducer(
  {
    displayName: t.string(),
    email: t.string(),
    avatarUrl: t.string(),
  },
  (ctx, { displayName, email, avatarUrl }) => {
    const user = ctx.db.user.identity.find(ctx.sender);
    if (!user) {
      throw new SenderError("User not registered");
    }
    ctx.db.user.identity.update({
      ...user,
      displayName,
      email,
      avatarUrl,
    });
  },
);

export const link_oauth = spacetimedb.reducer(
  { provider: t.string(), providerAccountId: t.string() },
  (ctx, { provider, providerAccountId }) => {
    if (!provider || !providerAccountId) {
      throw new SenderError("Provider and account ID are required");
    }
    ctx.db.oauth_link.insert({
      id: BigInt(0),
      userIdentity: ctx.sender,
      provider,
      providerAccountId,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

// ─── MCP Tool Swarm Reducers ───

export const register_tool = spacetimedb.reducer(
  {
    name: t.string(),
    description: t.string(),
    inputSchema: t.string(),
    category: t.string(),
  },
  (ctx, { name, description, inputSchema, category }) => {
    if (!name) {
      throw new SenderError("Tool name must not be empty");
    }
    // Remove if already exists for this provider
    for (const tool of ctx.db.registered_tool.providerIdentity.filter(ctx.sender)) {
      if (tool.name === name) {
        ctx.db.registered_tool.id.delete(tool.id);
      }
    }
    ctx.db.registered_tool.insert({
      id: BigInt(0),
      name,
      description,
      inputSchema,
      providerIdentity: ctx.sender,
      category,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const unregister_tool = spacetimedb.reducer(
  { name: t.string() },
  (ctx, { name }) => {
    for (const tool of ctx.db.registered_tool.providerIdentity.filter(ctx.sender)) {
      if (tool.name === name) {
        ctx.db.registered_tool.id.delete(tool.id);
      }
    }
  }
);

export const invoke_tool_request = spacetimedb.reducer(
  {
    toolName: t.string(),
    argumentsJson: t.string(),
  },
  (ctx, { toolName, argumentsJson }) => {
    if (!toolName) {
      throw new SenderError("Tool name must not be empty");
    }
    // Auth & Capability Check could go here!
    // For now, any agent can request
    ctx.db.mcp_task.insert({
      id: BigInt(0),
      toolName,
      argumentsJson,
      requesterIdentity: ctx.sender,
      providerIdentity: undefined,
      status: "pending",
      resultJson: undefined,
      error: undefined,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
      completedAt: undefined,
    });
  }
);

export const claim_mcp_task = spacetimedb.reducer(
  { taskId: t.u64() },
  (ctx, { taskId }) => {
    const task = ctx.db.mcp_task.id.find(taskId);
    if (!task) {
      throw new SenderError("Task not found");
    }
    if (task.status !== "pending") {
      throw new SenderError("Task is not available for claiming");
    }

    ctx.db.mcp_task.id.update({
      ...task,
      providerIdentity: ctx.sender,
      status: "claimed",
    });
  }
);

export const complete_mcp_task = spacetimedb.reducer(
  {
    taskId: t.u64(),
    resultJson: t.option(t.string()),
    error: t.option(t.string()),
  },
  (ctx, { taskId, resultJson, error }) => {
    const task = ctx.db.mcp_task.id.find(taskId);
    if (!task) {
      throw new SenderError("Task not found");
    }
    if (task.providerIdentity !== ctx.sender) {
      throw new SenderError("Only the claiming provider can complete this task");
    }

    ctx.db.mcp_task.id.update({
      ...task,
      status: error ? "failed" : "completed",
      resultJson,
      error,
      completedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  }
);

// ─── App Reducers ───

export const create_app = spacetimedb.reducer(
  {
    slug: t.string(),
    name: t.string(),
    description: t.string(),
  },
  (ctx, { slug, name, description }) => {
    if (!slug || !name) {
      throw new SenderError("Slug and name are required");
    }
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.app.insert({
      id: BigInt(0),
      slug,
      name,
      description,
      ownerIdentity: ctx.sender,
      status: "prompting",
      r2CodeKey: "",
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const update_app = spacetimedb.reducer(
  {
    appId: t.u64(),
    name: t.string(),
    description: t.string(),
    r2CodeKey: t.string(),
  },
  (ctx, { appId, name, description, r2CodeKey }) => {
    const app = ctx.db.app.id.find(appId);
    if (!app) {
      throw new SenderError("App not found");
    }
    if (app.ownerIdentity !== ctx.sender) {
      throw new SenderError("Only the owner can update this app");
    }
    ctx.db.app.id.update({
      ...app,
      name,
      description,
      r2CodeKey,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const update_app_status = spacetimedb.reducer(
  { appId: t.u64(), status: t.string() },
  (ctx, { appId, status }) => {
    const app = ctx.db.app.id.find(appId);
    if (!app) {
      throw new SenderError("App not found");
    }
    if (app.ownerIdentity !== ctx.sender) {
      throw new SenderError("Only the owner can update app status");
    }
    ctx.db.app.id.update({
      ...app,
      status,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const delete_app = spacetimedb.reducer(
  { appId: t.u64() }, (ctx, { appId }) => {
    const app = ctx.db.app.id.find(appId);
    if (!app) {
      throw new SenderError("App not found");
    }
    if (app.ownerIdentity !== ctx.sender) {
      throw new SenderError("Only the owner can delete this app");
    }
    ctx.db.app.id.update({
      ...app,
      status: "deleted",
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  });

export const restore_app = spacetimedb.reducer(
  { appId: t.u64() }, (ctx, { appId }) => {
    const app = ctx.db.app.id.find(appId);
    if (!app) {
      throw new SenderError("App not found");
    }
    if (app.ownerIdentity !== ctx.sender) {
      throw new SenderError("Only the owner can restore this app");
    }
    if (app.status !== "deleted") {
      throw new SenderError("App is not deleted");
    }
    ctx.db.app.id.update({
      ...app,
      status: "prompting",
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  });

export const create_app_version = spacetimedb.reducer(
  {
    appId: t.u64(),
    version: t.u32(),
    codeHash: t.string(),
    changeDescription: t.string(),
  },
  (ctx, { appId, version, codeHash, changeDescription }) => {
    const app = ctx.db.app.id.find(appId);
    if (!app) {
      throw new SenderError("App not found");
    }
    ctx.db.app_version.insert({
      id: BigInt(0),
      appId,
      version,
      codeHash,
      changeDescription,
      createdBy: ctx.sender,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const send_app_message = spacetimedb.reducer(
  {
    appId: t.u64(),
    role: t.string(),
    content: t.string(),
  },
  (ctx, { appId, role, content }) => {
    if (!content) {
      throw new SenderError("Message content must not be empty");
    }
    ctx.db.app_message.insert({
      id: BigInt(0),
      appId,
      role,
      content,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

// ─── Agent Reducers ───

export const register_agent = spacetimedb.reducer(
  { displayName: t.string(), capabilities: t.array(t.string()) },
  (ctx, { displayName, capabilities }) => {
    if (!displayName) {
      throw new SenderError("Display name must not be empty");
    }
    const existing = ctx.db.agent.identity.find(ctx.sender);
    if (existing) {
      ctx.db.agent.identity.update({
        ...existing,
        displayName,
        capabilities,
        online: true,
        lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
      });
    } else {
      ctx.db.agent.insert({
        identity: ctx.sender,
        displayName,
        capabilities,
        online: true,
        lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
      });
    }
  },
);

export const unregister_agent = spacetimedb.reducer(
  {}, (ctx) => {
    const existing = ctx.db.agent.identity.find(ctx.sender);
    if (!existing) {
      throw new SenderError("Agent not registered");
    }
    ctx.db.agent.identity.update({
      ...existing,
      online: false,
      lastSeen: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  });

export const send_agent_message = spacetimedb.reducer(
  { toAgent: t.identity(), content: t.string() },
  (ctx, { toAgent, content }) => {
    if (!content) {
      throw new SenderError("Message content must not be empty");
    }
    ctx.db.agent_message.insert({
      id: BigInt(0),
      fromAgent: ctx.sender,
      toAgent,
      content,
      timestamp: BigInt(ctx.timestamp.microsSinceUnixEpoch),
      delivered: false,
    });
  },
);

export const mark_agent_message_delivered = spacetimedb.reducer(
  { messageId: t.u64() },
  (ctx, { messageId }) => {
    const msg = ctx.db.agent_message.id.find(messageId);
    if (!msg) {
      throw new SenderError("Message not found");
    }
    if (msg.toAgent !== ctx.sender) {
      throw new SenderError("Can only mark own messages as delivered");
    }
    ctx.db.agent_message.id.update({ ...msg, delivered: true });
  },
);

// ─── Page Reducers ───

export const create_page = spacetimedb.reducer(
  {
    slug: t.string(),
    title: t.string(),
    description: t.string(),
  },
  (ctx, { slug, title, description }) => {
    if (!slug || !title) {
      throw new SenderError("Slug and title are required");
    }
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.page.insert({
      id: BigInt(0),
      slug,
      title,
      description,
      published: false,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const update_page = spacetimedb.reducer(
  {
    pageId: t.u64(),
    title: t.string(),
    description: t.string(),
    published: t.bool(),
  },
  (ctx, { pageId, title, description, published }) => {
    const page = ctx.db.page.id.find(pageId);
    if (!page) {
      throw new SenderError("Page not found");
    }
    ctx.db.page.id.update({
      ...page,
      title,
      description,
      published,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const delete_page = spacetimedb.reducer(
  { pageId: t.u64() }, (ctx, { pageId }) => {
    const page = ctx.db.page.id.find(pageId);
    if (!page) {
      throw new SenderError("Page not found");
    }
    ctx.db.page.id.delete(pageId);
  });

export const create_page_block = spacetimedb.reducer(
  {
    pageId: t.u64(),
    blockType: t.string(),
    contentJson: t.string(),
    sortOrder: t.u32(),
  },
  (ctx, { pageId, blockType, contentJson, sortOrder }) => {
    const page = ctx.db.page.id.find(pageId);
    if (!page) {
      throw new SenderError("Page not found");
    }
    ctx.db.page_block.insert({
      id: BigInt(0),
      pageId,
      blockType,
      contentJson,
      sortOrder,
    });
  },
);

export const update_page_block = spacetimedb.reducer(
  {
    blockId: t.u64(),
    blockType: t.string(),
    contentJson: t.string(),
    sortOrder: t.u32(),
  },
  (ctx, { blockId, blockType, contentJson, sortOrder }) => {
    const block = ctx.db.page_block.id.find(blockId);
    if (!block) {
      throw new SenderError("Page block not found");
    }
    ctx.db.page_block.id.update({
      ...block,
      blockType,
      contentJson,
      sortOrder,
    });
  },
);

export const delete_page_block = spacetimedb.reducer(
  { blockId: t.u64() }, (ctx, { blockId }) => {
    const block = ctx.db.page_block.id.find(blockId);
    if (!block) {
      throw new SenderError("Page block not found");
    }
    ctx.db.page_block.id.delete(blockId);
  });

export const reorder_page_blocks = spacetimedb.reducer(
  {
    blockIds: t.array(t.u64()),
  },
  (ctx, { blockIds }) => {
    for (let i = 0; i < blockIds.length; i++) {
      const block = ctx.db.page_block.id.find(blockIds[i]);
      if (!block) {
        throw new SenderError(`Page block ${blockIds[i]} not found`);
      }
      ctx.db.page_block.id.update({ ...block, sortOrder: i });
    }
  },
);

// ─── Direct Message Reducers ───

export const send_dm = spacetimedb.reducer(
  { toIdentity: t.identity(), content: t.string() },
  (ctx, { toIdentity, content }) => {
    if (!content) {
      throw new SenderError("Message content must not be empty");
    }
    ctx.db.direct_message.insert({
      id: BigInt(0),
      fromIdentity: ctx.sender,
      toIdentity,
      content,
      readStatus: false,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const mark_dm_read = spacetimedb.reducer(
  { messageId: t.u64() }, (ctx, { messageId }) => {
    const dm = ctx.db.direct_message.id.find(messageId);
    if (!dm) {
      throw new SenderError("Message not found");
    }
    if (dm.toIdentity !== ctx.sender) {
      throw new SenderError("Can only mark own messages as read");
    }
    ctx.db.direct_message.id.update({ ...dm, readStatus: true });
  });

// ─── Monitoring Reducers ───

export const record_platform_event = spacetimedb.reducer(
  {
    source: t.string(),
    eventType: t.string(),
    metadataJson: t.string(),
  },
  (ctx, { source, eventType, metadataJson }) => {
    if (!source || !eventType) {
      throw new SenderError("Source and event type are required");
    }
    ctx.db.platform_event.insert({
      id: BigInt(0),
      source,
      eventType,
      metadataJson,
      userIdentity: ctx.sender,
      timestamp: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const record_health_check = spacetimedb.reducer(
  {
    service: t.string(),
    status: t.string(),
    latencyMs: t.u32(),
  },
  (ctx, { service, status, latencyMs }) => {
    if (!service) {
      throw new SenderError("Service name must not be empty");
    }
    ctx.db.health_check.insert({
      id: BigInt(0),
      service,
      status,
      latencyMs,
      checkedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

// ─── Image Studio Reducers ───

export const image_create = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.string(),
    description: t.option(t.string()),
    originalUrl: t.string(),
    originalR2Key: t.string(),
    originalWidth: t.u32(),
    originalHeight: t.u32(),
    originalSizeBytes: t.u64(),
    originalFormat: t.string(),
    isPublic: t.bool(),
    tags: t.array(t.string()),
  },
  (ctx, data) => {
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.image.insert({
      ...data,
      userIdentity: ctx.sender,
      viewCount: BigInt(0),
      shareToken: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const image_update = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.option(t.string()),
    description: t.option(t.string()),
    tags: t.option(t.array(t.string())),
    isPublic: t.option(t.bool()),
    shareToken: t.option(t.string()),
  },
  (ctx, { id, ...data }) => {
    const img = ctx.db.image.id.find(id);
    if (!img) throw new SenderError("Image not found");
    if (img.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.image.id.update({
      ...img,
      name: data.name ?? img.name,
      description: data.description !== undefined ? data.description : img.description,
      tags: data.tags ?? img.tags,
      isPublic: data.isPublic ?? img.isPublic,
      shareToken: data.shareToken !== undefined ? data.shareToken : img.shareToken,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const image_delete = spacetimedb.reducer({ id: t.string() }, (ctx, { id }) => {
  const img = ctx.db.image.id.find(id);
  if (!img) return; // Idempotent
  if (img.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");
  ctx.db.image.id.delete(id);
});

export const album_create = spacetimedb.reducer(
  {
    handle: t.string(),
    name: t.string(),
    description: t.option(t.string()),
    privacy: t.string(),
    defaultTier: t.string(),
    shareToken: t.option(t.string()),
    sortOrder: t.u32(),
    pipelineId: t.option(t.string()),
  },
  (ctx, data) => {
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.album.insert({
      id: BigInt(0),
      ...data,
      userIdentity: ctx.sender,
      coverImageId: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const album_update = spacetimedb.reducer(
  {
    handle: t.string(),
    name: t.option(t.string()),
    description: t.option(t.string()),
    privacy: t.option(t.string()),
    defaultTier: t.option(t.string()),
    shareToken: t.option(t.string()),
    sortOrder: t.option(t.u32()),
    coverImageId: t.option(t.string()),
  },
  (ctx, { handle, ...data }) => {
    const album = ctx.db.album.handle.find(handle);
    if (!album) throw new SenderError("Album not found");
    if (album.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.album.id.update({
      ...album,
      name: data.name ?? album.name,
      description: data.description !== undefined ? data.description : album.description,
      privacy: data.privacy ?? album.privacy,
      defaultTier: data.defaultTier ?? album.defaultTier,
      shareToken: data.shareToken !== undefined ? data.shareToken : album.shareToken,
      sortOrder: data.sortOrder ?? album.sortOrder,
      coverImageId: data.coverImageId !== undefined ? data.coverImageId : album.coverImageId,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const album_delete = spacetimedb.reducer({ handle: t.string() }, (ctx, { handle }) => {
  const album = ctx.db.album.handle.find(handle);
  if (!album) return;
  if (album.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");
  ctx.db.album.handle.delete(handle);
  // Cleanup album images
  for (const ai of ctx.db.album_image.albumId.filter(album.id)) {
    ctx.db.album_image.id.delete(ai.id);
  }
});

export const album_image_add = spacetimedb.reducer(
  { albumId: t.u64(), imageId: t.string(), sortOrder: t.u32() },
  (ctx, { albumId, imageId, sortOrder }) => {
    const album = ctx.db.album.id.find(albumId);
    if (!album) throw new SenderError("Album not found");
    if (album.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.album_image.insert({
      id: BigInt(0),
      albumId,
      imageId,
      sortOrder,
      addedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const album_image_remove = spacetimedb.reducer(
  { albumId: t.u64(), imageIds: t.array(t.string()) },
  (ctx, { albumId, imageIds }) => {
    const album = ctx.db.album.id.find(albumId);
    if (!album) throw new SenderError("Album not found");
    if (album.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    const imageSet = new Set(imageIds);
    for (const ai of ctx.db.album_image.albumId.filter(albumId)) {
      if (imageSet.has(ai.imageId)) {
        ctx.db.album_image.id.delete(ai.id);
      }
    }
  },
);

export const enhancement_job_create = spacetimedb.reducer(
  {
    id: t.string(),
    imageId: t.string(),
    tier: t.string(),
    creditsCost: t.u32(),
    status: t.string(),
    metadataJson: t.option(t.string()),
  },
  (ctx, data) => {
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.enhancement_job.insert({
      ...data,
      userIdentity: ctx.sender,
      enhancedUrl: undefined,
      enhancedR2Key: undefined,
      enhancedWidth: undefined,
      enhancedHeight: undefined,
      enhancedSizeBytes: undefined,
      errorMessage: undefined,
      retryCount: 0,
      processingStartedAt: undefined,
      processingCompletedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const enhancement_job_update = spacetimedb.reducer(
  {
    id: t.string(),
    status: t.option(t.string()),
    enhancedUrl: t.option(t.string()),
    enhancedR2Key: t.option(t.string()),
    enhancedWidth: t.option(t.u32()),
    enhancedHeight: t.option(t.u32()),
    enhancedSizeBytes: t.option(t.u64()),
    errorMessage: t.option(t.string()),
    processingCompletedAt: t.option(t.u64()),
  },
  (ctx, { id, ...data }) => {
    const job = ctx.db.enhancement_job.id.find(id);
    if (!job) throw new SenderError("Job not found");
    if (job.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.enhancement_job.id.update({
      ...job,
      status: data.status ?? job.status,
      enhancedUrl: data.enhancedUrl !== undefined ? data.enhancedUrl : job.enhancedUrl,
      enhancedR2Key: data.enhancedR2Key !== undefined ? data.enhancedR2Key : job.enhancedR2Key,
      enhancedWidth: data.enhancedWidth !== undefined ? data.enhancedWidth : job.enhancedWidth,
      enhancedHeight: data.enhancedHeight !== undefined ? data.enhancedHeight : job.enhancedHeight,
      enhancedSizeBytes: data.enhancedSizeBytes !== undefined ? data.enhancedSizeBytes : job.enhancedSizeBytes,
      errorMessage: data.errorMessage !== undefined ? data.errorMessage : job.errorMessage,
      processingCompletedAt: data.processingCompletedAt !== undefined ? data.processingCompletedAt : job.processingCompletedAt,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const pipeline_create = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.string(),
    description: t.option(t.string()),
    visibility: t.string(),
    tier: t.string(),
    analysisConfigJson: t.option(t.string()),
    autoCropConfigJson: t.option(t.string()),
    promptConfigJson: t.option(t.string()),
    generationConfigJson: t.option(t.string()),
  },
  (ctx, data) => {
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.pipeline.insert({
      ...data,
      userIdentity: ctx.sender,
      shareToken: undefined,
      usageCount: BigInt(0),
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const pipeline_update = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.option(t.string()),
    description: t.option(t.string()),
    visibility: t.option(t.string()),
    tier: t.option(t.string()),
    analysisConfigJson: t.option(t.string()),
    autoCropConfigJson: t.option(t.string()),
    promptConfigJson: t.option(t.string()),
    generationConfigJson: t.option(t.string()),
    shareToken: t.option(t.string()),
  },
  (ctx, { id, ...data }) => {
    const pipe = ctx.db.pipeline.id.find(id);
    if (!pipe) throw new SenderError("Pipeline not found");
    // Only allow update if it's public (no owner) or if owner is sender
    if (pipe.userIdentity && pipe.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.pipeline.id.update({
      ...pipe,
      name: data.name ?? pipe.name,
      description: data.description !== undefined ? data.description : pipe.description,
      visibility: data.visibility ?? pipe.visibility,
      tier: data.tier ?? pipe.tier,
      analysisConfigJson: data.analysisConfigJson !== undefined ? data.analysisConfigJson : pipe.analysisConfigJson,
      autoCropConfigJson: data.autoCropConfigJson !== undefined ? data.autoCropConfigJson : pipe.autoCropConfigJson,
      promptConfigJson: data.promptConfigJson !== undefined ? data.promptConfigJson : pipe.promptConfigJson,
      generationConfigJson: data.generationConfigJson !== undefined ? data.generationConfigJson : pipe.generationConfigJson,
      shareToken: data.shareToken !== undefined ? data.shareToken : pipe.shareToken,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const pipeline_delete = spacetimedb.reducer({ id: t.string() }, (ctx, { id }) => {
  const pipe = ctx.db.pipeline.id.find(id);
  if (!pipe) return;
  if (pipe.userIdentity && pipe.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");
  ctx.db.pipeline.id.delete(id);
});

export const generation_job_create = spacetimedb.reducer(
  {
    id: t.string(),
    jobType: t.string(),
    tier: t.string(),
    creditsCost: t.u32(),
    status: t.string(),
    prompt: t.string(),
  },
  (ctx, data) => {
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    ctx.db.generation_job.insert({
      ...data,
      userIdentity: ctx.sender,
      inputImageUrl: undefined,
      outputImageUrl: undefined,
      outputWidth: undefined,
      outputHeight: undefined,
      outputSizeBytes: undefined,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const generation_job_update = spacetimedb.reducer(
  {
    id: t.string(),
    status: t.option(t.string()),
    outputImageUrl: t.option(t.string()),
    outputWidth: t.option(t.u32()),
    outputHeight: t.option(t.u32()),
    outputSizeBytes: t.option(t.u64()),
    errorMessage: t.option(t.string()),
  },
  (ctx, { id, ...data }) => {
    const job = ctx.db.generation_job.id.find(id);
    if (!job) throw new SenderError("Job not found");
    if (job.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");

    ctx.db.generation_job.id.update({
      ...job,
      status: data.status ?? job.status,
      outputImageUrl: data.outputImageUrl !== undefined ? data.outputImageUrl : job.outputImageUrl,
      outputWidth: data.outputWidth !== undefined ? data.outputWidth : job.outputWidth,
      outputHeight: data.outputHeight !== undefined ? data.outputHeight : job.outputHeight,
      outputSizeBytes: data.outputSizeBytes !== undefined ? data.outputSizeBytes : job.outputSizeBytes,
      errorMessage: data.errorMessage !== undefined ? data.errorMessage : job.errorMessage,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const subject_create = spacetimedb.reducer(
  { imageId: t.string(), label: t.string(), subjectType: t.string(), description: t.option(t.string()) },
  (ctx, data) => {
    ctx.db.subject.insert({
      id: BigInt(0),
      ...data,
      userIdentity: ctx.sender,
      createdAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export const subject_delete = spacetimedb.reducer({ id: t.u64() }, (ctx, { id }) => {
  const sub = ctx.db.subject.id.find(id);
  if (!sub) return;
  if (sub.userIdentity !== ctx.sender) throw new SenderError("Unauthorized");
  ctx.db.subject.id.delete(id);
});

export const credits_add = spacetimedb.reducer(
  { userIdentity: t.identity(), amount: t.i64() },
  (ctx, { userIdentity, amount }) => {
    // Only owner can add credits (or some permission system, but we don't have one yet)
    // For now, let's assume this is for local dev or admin use.
    const creds = ctx.db.credits.userIdentity.find(userIdentity);
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    if (creds) {
      ctx.db.credits.userIdentity.update({
        ...creds,
        balance: creds.balance + amount,
        updatedAt: now,
      });
    } else {
      ctx.db.credits.insert({
        userIdentity,
        balance: amount,
        updatedAt: now,
      });
    }
  },
);

export const credits_consume = spacetimedb.reducer(
  { amount: t.i64() },
  (ctx, { amount }) => {
    const creds = ctx.db.credits.userIdentity.find(ctx.sender);
    if (!creds) throw new SenderError("No credits found for user");
    if (creds.balance < amount) throw new SenderError("Insufficient balance");
    ctx.db.credits.userIdentity.update({
      ...creds,
      balance: creds.balance - amount,
      updatedAt: BigInt(ctx.timestamp.microsSinceUnixEpoch),
    });
  },
);

export default spacetimedb;


// ─── Code Session Reducers ───

export const update_code_session = spacetimedb.reducer(
  {
    codeSpace: t.string(),
    code: t.string(),
    html: t.string(),
    css: t.string(),
    transpiled: t.string(),
    messagesJson: t.string(),
  },
  (ctx, { codeSpace, code, html, css, transpiled, messagesJson }) => {
    if (!codeSpace) {
      throw new SenderError("CodeSpace is required");
    }
    const now = BigInt(ctx.timestamp.microsSinceUnixEpoch);
    const existing = ctx.db.code_session.codeSpace.find(codeSpace);

    if (existing) {
      ctx.db.code_session.codeSpace.update({
        ...existing,
        code,
        html,
        css,
        transpiled,
        messagesJson,
        lastUpdatedBy: ctx.sender,
        updatedAt: now,
      });
    } else {
      ctx.db.code_session.insert({
        codeSpace,
        code,
        html,
        css,
        transpiled,
        messagesJson,
        lastUpdatedBy: ctx.sender,
        updatedAt: now,
      });
    }
  },
);
