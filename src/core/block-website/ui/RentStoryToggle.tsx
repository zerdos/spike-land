"use client";

import { useExperiment } from "./useExperiment";

const ADHD_RENT_TEXT = `It was 3am and I couldn't sleep. Not because of the code — because of the rent. When your brain won't shut up about money, sometimes the only thing that works is giving it a different problem to chew on. So I opened the monorepo. 990 TypeScript files across 25 packages, and half of them were in the wrong directory. My ADHD brain — the same one keeping me up about rent — looked at this chaos and said: 'I can fix this tonight.' Three hours later, every file had a home.`;

const NEUTRAL_TEXT = `We had a problem: 990 TypeScript files across 25 packages, and the directory structure no longer matched the architecture. Files that belonged together were scattered. Import paths were misleading. New contributors couldn't tell where anything should go. So we built a tool to fix it.`;

export function RentStoryToggle() {
  const { getVariant, loading } = useExperiment();

  const variant = loading ? null : getVariant("blog-code-belong-story-v1");
  const text = variant === "adhd-rent" ? ADHD_RENT_TEXT : NEUTRAL_TEXT;

  return (
    <p className="text-base leading-relaxed text-foreground/80 md:text-lg">
      {text}
    </p>
  );
}
