"use client";

import { EditableMarkdownRenderer } from "@/components/docs/EditableMarkdownRenderer";

interface GuideContentProps {
  content: string;
  slug: string;
}

export function GuideContent({ content, slug }: GuideContentProps) {
  return <EditableMarkdownRenderer content={content} contentId={`guide-${slug}`} />;
}
