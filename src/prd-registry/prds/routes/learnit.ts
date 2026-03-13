import type { PrdDefinition } from "../../core-logic/types.js";

export const learnitRoute: PrdDefinition = {
  id: "route:/learnit",
  level: "route",
  name: "LearnIt",
  summary:
    "AI-powered wiki: 8 categories, generated topic pages, quiz system, badge progression, career tools",
  purpose:
    "Primary learning surface. Organises knowledge into 8 categories (AI/ML, Web Dev, Cloud, Security, Data, DevOps, Design, Career). AI augments topic pages with examples and related topics. Quizzes award badges; career tools surface job matches and salary data inline.",
  constraints: [
    "Topic content generation must complete within 3s or fall back to cached content",
    "Quiz questions generated per-topic must not repeat within a single session",
    "Badge criteria must be deterministic and based on verifiable user actions",
    "Career tools data sourced from domain:learning toolset — no direct external calls from route",
    "8 fixed categories; sub-categories may be dynamic",
  ],
  acceptance: [
    "All 8 category landing pages load with at least 10 topic cards",
    "Topic detail page displays generated content, related topics, and a start-quiz CTA",
    "Quiz of 5 questions scores correctly and awards appropriate badge on completion",
    "Badge collection page reflects earned badges within 10s of quiz completion",
    "Career tools tab on relevant topics shows salary range and open job count",
  ],
  toolCategories: ["learnit", "career", "career-growth", "quiz", "badge"],
  tools: [
    "learnit_get_categories",
    "learnit_get_topic",
    "learnit_generate_content",
    "learnit_start_quiz",
    "learnit_submit_answer",
    "badge_award",
    "career_get_jobs",
    "career_get_salary",
  ],
  composesFrom: ["platform", "domain:learning"],
  routePatterns: ["/learnit", "/learnit/:category", "/learnit/:category/:topic"],
  keywords: [
    "learn",
    "wiki",
    "knowledge",
    "topic",
    "quiz",
    "badge",
    "career",
    "education",
    "tutorial",
    "category",
    "ai-generated",
  ],
  tokenEstimate: 280,
  version: "1.0.0",
};
