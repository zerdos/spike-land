import { Hono } from "hono";
import type { Context, Next } from "hono";
import type { Env } from "../core-logic/env";

export const landingRoute = new Hono<{ Bindings: Env }>();

const HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="spike.land MCP Registry — 80+ AI tools over the Model Context Protocol. Connect any MCP-compatible client to web search, databases, code execution, and more.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="spike.land — MCP Registry">
  <meta property="og:description" content="80+ AI tools over the Model Context Protocol. One endpoint, every tool.">
  <meta property="og:url" content="https://mcp.spike.land/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="spike.land">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="spike.land — MCP Registry">
  <meta name="twitter:description" content="80+ AI tools over the Model Context Protocol.">
  <title>spike.land — MCP Registry</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg: #050508;
      --bg-card: rgba(18, 18, 26, 0.6);
      --bg-code: rgba(13, 13, 20, 0.8);
      --primary: #8b5cf6;
      --primary-dim: rgba(139, 92, 246, 0.15);
      --secondary: #ec4899;
      --border: rgba(255, 255, 255, 0.08);
      --border-bright: rgba(255, 255, 255, 0.15);
      --text: #f8fafc;
      --muted: #94a3b8;
      --green: #10b981;
      --radius: 16px;
      --radius-sm: 8px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      position: relative;
    }
    
    /* Dynamic Mesh Background */
    body::before {
      content: "";
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: 
        radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 50%);
      z-index: -1;
      animation: pulseBg 15s ease-in-out infinite alternate;
      pointer-events: none;
    }

    @keyframes pulseBg {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.05); opacity: 1; }
    }

    a { color: var(--text); text-decoration: none; transition: color 0.2s; }

    /* ── Layout ── */
    .wrapper {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* ── Header ── */
    header {
      padding: 1.5rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(5, 5, 8, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    header .wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .badge {
      font-family: 'Outfit', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
      color: #e2e8f0;
      border: 1px solid rgba(139, 92, 246, 0.4);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
    }

    /* ── Main ── */
    main { flex: 1; padding: 5rem 0 6rem; }

    /* ── Hero ── */
    .hero { text-align: center; margin-bottom: 5rem; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero h1 {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(3rem, 6vw, 4.5rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
      background: linear-gradient(160deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1.5rem;
      text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
    }

    .hero p {
      font-size: 1.15rem;
      color: var(--muted);
      max-width: 580px;
      margin: 0 auto;
      font-weight: 400;
    }

    /* ── Glass Morphism Card ── */
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .section-title::before {
      content: "";
      display: block;
      width: 12px;
      height: 2px;
      background: var(--primary);
    }

    /* ── Endpoints ── */
    .endpoints { margin-bottom: 3rem; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards; }

    .endpoint-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .endpoint-row:hover {
      border-color: rgba(139, 92, 246, 0.4);
      background: rgba(139, 92, 246, 0.05);
      transform: translateX(4px);
    }

    .endpoint-row + .endpoint-row { margin-top: 0.75rem; }

    .endpoint-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--green);
      flex-shrink: 0;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
      animation: pulseDot 2s infinite;
    }
    
    @keyframes pulseDot {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .endpoint-url {
      font-family: "Fira Code", monospace;
      font-size: 0.95rem;
      color: var(--text);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .endpoint-tag {
      font-family: 'Outfit', sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      flex-shrink: 0;
    }

    /* ── Config snippet ── */
    .config { margin-bottom: 3rem; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards; }

    pre {
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1.5rem;
      overflow-x: auto;
      font-family: "Fira Code", monospace;
      font-size: 0.9rem;
      line-height: 1.6;
      color: #e2e8f0;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
    }

    pre .key   { color: #a78bfa; }
    pre .str   { color: #6ee7b7; }
    pre .punct { color: #64748b; }

    /* ── Features grid ── */
    .features { margin-bottom: 3rem; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .features-grid { grid-template-columns: 1fr; }
    }

    .feature-card {
      background: linear-gradient(180deg, rgba(30, 30, 42, 0.6) 0%, rgba(18, 18, 26, 0.4) 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.75rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    
    .feature-card::after {
      content: "";
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      background: radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .feature-card:hover { 
      border-color: rgba(139, 92, 246, 0.5); 
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.15);
    }
    
    .feature-card:hover::after { opacity: 1; }

    .feature-icon {
      font-size: 1.75rem;
      margin-bottom: 1rem;
      line-height: 1;
      display: inline-block;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .feature-card h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #f8fafc;
    }

    .feature-card p {
      font-size: 0.9rem;
      color: var(--muted);
      line-height: 1.6;
    }

    /* ── Links ── */
    .links { margin-bottom: 2rem; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s backwards; }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .links-grid { grid-template-columns: 1fr; }
    }

    .link-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .link-card:hover {
      border-color: rgba(236, 72, 153, 0.4);
      background: rgba(236, 72, 153, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.1);
    }

    .link-card .link-arrow {
      margin-left: auto;
      color: var(--muted);
      font-size: 1.25rem;
      transition: transform 0.2s, color 0.2s;
    }

    .link-card:hover .link-arrow { 
      color: #ec4899; 
      transform: translateX(4px) scale(1.1);
    }
    
    .link-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .link-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .link-label {
      font-size: 0.8rem;
      color: var(--muted);
    }

    /* ── Footer ── */
    footer {
      border-top: 1px solid rgba(255,255,255,0.05);
      padding: 2rem 0;
      text-align: center;
      font-size: 0.85rem;
      color: var(--muted);
    }

    footer a { 
      color: #a78bfa; 
      font-weight: 500;
    }
    footer a:hover { color: #c4b5fd; text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <div class="wrapper">
      <span class="logo">spike.land</span>
      <span class="badge">MCP Registry</span>
    </div>
  </header>

  <main>
    <div class="wrapper">

      <section class="hero">
        <h1>80+ AI Tools,<br>One Protocol</h1>
        <p>The open MCP registry for spike.land. Connect any Model Context Protocol client to web search, databases, code execution, AI gateway, and more — instantly.</p>
      </section>

      <section class="endpoints" aria-labelledby="endpoints-heading">
        <h2 id="endpoints-heading" class="section-title">Endpoints</h2>
        <div class="card">
          <div class="endpoint-row">
            <span class="endpoint-dot" aria-hidden="true"></span>
            <code class="endpoint-url">https://spike.land/mcp</code>
            <span class="endpoint-tag">Recommended</span>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-dot" aria-hidden="true"></span>
            <code class="endpoint-url">https://mcp.spike.land/mcp</code>
          </div>
        </div>
      </section>

      <section class="config" aria-labelledby="config-heading">
        <h2 id="config-heading" class="section-title">Claude Desktop / Cursor Config</h2>
        <pre aria-label="JSON configuration for MCP clients"><span class="punct">{</span>
  <span class="key">"mcpServers"</span><span class="punct">: {</span>
    <span class="key">"spike-land"</span><span class="punct">: {</span>
      <span class="key">"command"</span><span class="punct">:</span> <span class="str">"mcp-cli"</span><span class="punct">,</span>
      <span class="key">"args"</span><span class="punct">:</span> <span class="punct">[</span><span class="str">"call"</span><span class="punct">,</span> <span class="str">"https://spike.land/mcp"</span><span class="punct">]</span>
    <span class="punct">}</span>
  <span class="punct">}</span>
<span class="punct">}</span></pre>
      </section>

      <section class="features" aria-labelledby="features-heading">
        <h2 id="features-heading" class="section-title">What&rsquo;s included</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F9F0;</div>
            <h3>80+ Tools</h3>
            <p>Web search, databases, code execution, AI gateway, image generation, and more.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F510;</div>
            <h3>OAuth 2.0</h3>
            <p>Device flow authentication built-in. Bring your own API keys via BYOK vault.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F517;</div>
            <h3>Open Protocol</h3>
            <p>MCP standard by Anthropic. Works with Claude, VS Code, Cursor, and any compatible client.</p>
          </div>
        </div>
      </section>

      <section class="links" aria-labelledby="links-heading">
        <h2 id="links-heading" class="section-title">Explore</h2>
        <div class="links-grid">
          <a class="link-card" href="/tools">
            <div class="link-content">
              <span class="link-title">Browse Tools</span>
              <span class="link-label">All 80+ available tools</span>
            </div>
            <span class="link-arrow" aria-hidden="true">&#x2192;</span>
          </a>
          <a class="link-card" href="/.well-known/oauth-authorization-server">
            <div class="link-content">
              <span class="link-title">OAuth Discovery</span>
              <span class="link-label">Authorization server metadata</span>
            </div>
            <span class="link-arrow" aria-hidden="true">&#x2192;</span>
          </a>
          <a class="link-card" href="https://spike.land/mcp" rel="noopener">
            <div class="link-content">
              <span class="link-title">Full UI Dashboard</span>
              <span class="link-label">spike.land MCP dashboard</span>
            </div>
            <span class="link-arrow" aria-hidden="true">&#x2197;</span>
          </a>
          <a class="link-card" href="https://spike.land/docs/mcp" rel="noopener">
            <div class="link-content">
              <span class="link-title">Documentation</span>
              <span class="link-label">Guides, auth, tool reference</span>
            </div>
            <span class="link-arrow" aria-hidden="true">&#x2197;</span>
          </a>
        </div>
      </section>

    </div>
  </main>

  <footer>
    <div class="wrapper">
      Powered by <a href="https://spike.land" rel="noopener">spike.land</a>
    </div>
  </footer>
</body>
</html>`;

landingRoute.get("/", async (c: Context<{ Bindings: Env }>, _next: Next) => {
  const accept = c.req.header("Accept") ?? "";

  if (!accept.includes("text/html")) {
    // Graceful fallback for non-browser clients querying the root
    return c.json(
      {
        name: "spike.land MCP Registry",
        description: "80+ AI tools over the Model Context Protocol. One endpoint, every tool.",
        mcp_endpoint: "https://spike.land/mcp",
        docs: "https://spike.land/docs/mcp",
        tools_browser: "https://spike.land/tools",
        status: "online",
        version: "1.0.0",
      },
      200,
      {
        "Cache-Control": "public, max-age=300",
      },
    );
  }

  return c.html(HTML, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});
