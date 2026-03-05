export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">About spike.land</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          spike.land is an MCP-first AI development platform — built on Cloudflare Workers for
          global, sub-100ms latency from day one.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="leading-relaxed text-foreground">
          We believe the future of software is AI-native: agents that write code, invoke tools, and
          collaborate in real time. spike.land makes that future accessible today by providing an
          open, composable platform where developers can build, share, and monetize AI-powered
          applications without managing infrastructure.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Who We Are</h2>
        <p className="leading-relaxed text-foreground">
          spike.land is built by a small, distributed team of engineers passionate about
          making AI tools accessible to everyone. We believe the best software is built in
          the open, with real users shaping the product.
        </p>
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground">Get in touch</h3>
          <p className="text-sm text-muted-foreground">
            Have questions, feedback, or partnership ideas? We'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:hello@spike.land" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Email us
            </a>
            <a href="https://github.com/spike-land-ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">The Platform</h2>
        <p className="leading-relaxed text-foreground">
          spike.land is built around the{" "}
          <a
            href="https://modelcontextprotocol.io"
            className="text-primary underline hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            Model Context Protocol (MCP)
          </a>
          {" "}— the open standard for connecting AI agents to real-world data sources and actions.
          Our registry exposes 80+ tools that any compatible agent can discover and invoke.
        </p>
        <ul className="list-inside list-disc space-y-2 text-foreground ml-4">
          <li>
            <strong>80+ MCP tools</strong> — code review, image generation, HackerNews integration,
            browser automation, and more
          </li>
          <li>
            <strong>Live code editor</strong> — Monaco-based editor with instant preview, powered by
            esbuild-wasm at the edge
          </li>
          <li>
            <strong>Real-time collaboration</strong> — Durable Objects for persistent, low-latency
            shared state
          </li>
          <li>
            <strong>App store</strong> — discover, install, and monetize AI applications
          </li>
          <li>
            <strong>Edge-first</strong> — deployed globally on Cloudflare Workers, D1, and R2
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Built for Speed</h2>
        <p className="leading-relaxed text-foreground">
          spike.land runs on Cloudflare's global edge network, meaning every request is
          handled by a server close to you. Our stack is designed for speed, reliability,
          and developer experience — from React on the frontend to Hono and Durable Objects
          on the edge.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Open Source</h2>
        <p className="leading-relaxed text-foreground">
          spike.land is built in the open under the{" "}
          <span className="font-medium">@spike-land-ai</span> GitHub organization. All packages are
          published to GitHub Packages. We welcome contributions, bug reports, and feedback.
        </p>
        <a
          href="https://github.com/spike-land-ai"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </section>
    </div>
  );
}
