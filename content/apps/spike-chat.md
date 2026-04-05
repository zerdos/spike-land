---
name: Spike Chat
slug: spike-chat
emoji: "⚡"
description: AI chat assistant powered by Grok with Bayesian memory and multi-stage pipeline.
tagline: Remembers what matters. Forgets what doesn't.
category: Agents & Collaboration
tags:
  - "ai"
  - "chat"
  - "memory"
  - "grok"
  - "assistant"
pricing: free
status: live
is_featured: true
is_new: true
sort_order: 2
tools: []
graph: {}
---

# Spike Chat

An AI chat assistant built on xAI's Grok, featuring the Aether architecture:

- **Split-prompt with KV-cache pattern** — stable prefix cached, dynamic suffix pruned by confidence
- **Bayesian memory system** — learns from conversations, promotes helpful notes, demotes unhelpful ones
- **4-stage pipeline** — classify, plan, execute (streamed), extract (background)
- **MCP tool integration** — access to 80+ platform tools

## How it works

Every message flows through four stages:

1. **Classify** — intent detection, domain routing, urgency scoring
2. **Plan** — generate response strategy with simulated outcomes
3. **Execute** — stream the response to you, execute tool calls
4. **Extract** — background note extraction for long-term memory

Your conversation history stays lightweight because each stage only receives its
own artifact — no full history bloat.
