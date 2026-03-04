import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { BlogPost } from "../../core/generated-posts";
import * as Interactive from "../interactive";

/**
 * Convert self-closing JSX/HTML tags for custom components to explicit
 * open/close pairs. HTML5 only treats void elements (img, br, hr, etc.)
 * as self-closing — `<Foo />` is parsed as `<Foo>` by rehype-raw,
 * which swallows all subsequent content as children.
 */
function fixSelfClosingTags(markdown: string): string {
  return markdown.replace(/<([A-Z][a-zA-Z]*)((?:\s+[a-zA-Z-]+=(?:"[^"]*"|'[^']*'|{[^}]*}))*)\s*\/>/g,
    (_, tag, attrs) => `<${tag}${attrs}></${tag}>`);
}

const COMPONENT_MAP = {
  convergencedemo: Interactive.ConvergenceDemo,
  dependencycascadedemo: Interactive.DependencyCascadeDemo,
  stackcollapsedemo: Interactive.StackCollapseDemo,
  agentcoordinationdemo: Interactive.AgentCoordinationDemo,
  splitscreendemo: Interactive.SplitScreenDemo,
  attentionspotlightdemo: Interactive.AttentionSpotlightDemo,
  fivelayerstackdemo: Interactive.FiveLayerStackDemo,
  darwiniantreedemo: Interactive.DarwinianTreeDemo,
  recursivezoomdemo: Interactive.RecursiveZoomDemo,
  modelcascadedemo: Interactive.ModelCascadeDemo,
  bayesianconfidencedemo: Interactive.BayesianConfidenceDemo,
  mcpterminaldemo: Interactive.MCPTerminalDemo,
  scrollstorycard: Interactive.ScrollStoryCard,
  mcpflowdiagram: Interactive.MCPFlowDiagram,
  perspectivecarousel: Interactive.PerspectiveCarousel,
  spikeclidemo: Interactive.SpikeCliDemo,
  pyramidreshapedemo: Interactive.PyramidReshapeDemo,
  testcodenamevenn: Interactive.TestCodeNameVenn,
  hourglassmodeldemo: Interactive.HourglassModelDemo,
  paradigmguilttimeline: Interactive.ParadigmGuiltTimeline,
  effortinversiondemo: Interactive.EffortInversionDemo,
  contextlayerbuilderdemo: Interactive.ContextLayerBuilderDemo,
  callout: ({ children, type }: { children?: React.ReactNode; type?: string }) => (
    <div className={`p-4 my-6 rounded-xl border ${
      type === 'info' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-900 dark:text-blue-100' :
      'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
    }`}>
      {children}
    </div>
  ),
};

export function BlogPostView({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<BlogPost>;
      })
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="text-center mb-12">
          <div className="h-4 bg-[#2A2A28] rounded w-1/4 mx-auto mb-6" />
          <div className="h-12 bg-[#2A2A28] rounded w-3/4 mx-auto mb-6" />
          <div className="h-6 bg-[#2A2A28] rounded w-1/2 mx-auto" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-5 bg-[#2A2A28] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-display font-bold text-[#F3F2EE]">Post not found</h1>
        <p className="mt-6 text-xl text-[#A3A19C]">The post you are looking for does not exist.</p>
        <a href="/blog" className="mt-8 inline-block text-[#D6FF38] hover:text-[#bce02b] transition-colors font-semibold">
          ← Back to Blog
        </a>
      </div>
    );
  }

  return (
    <article className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <header className="mb-16 text-center border-b border-[#2A2A28] pb-12">
        <div className="flex justify-center items-center gap-3 text-sm text-[#8A8883] mb-6 font-medium tracking-wide uppercase">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
          {post.category && (
            <>
              <span className="text-[#444]">•</span>
              <span className="text-[#D6FF38]">{post.category}</span>
            </>
          )}
        </div>
        <h1 className="text-5xl sm:text-7xl font-display font-extrabold text-[#F3F2EE] tracking-tight leading-tight mb-8 drop-shadow-sm">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-2xl text-[#A3A19C] max-w-3xl mx-auto leading-relaxed font-light">
            {post.description}
          </p>
        )}
      </header>

      <div className="prose prose-xl prose-invert max-w-none 
        prose-headings:font-display prose-headings:font-bold prose-headings:text-[#F3F2EE] prose-headings:tracking-tight
        prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl
        prose-p:text-[#A3A19C] prose-p:leading-loose prose-p:font-sans
        prose-a:text-[#D6FF38] prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#bce02b]
        prose-strong:text-[#F3F2EE] prose-strong:font-semibold
        prose-blockquote:border-l-[#D6FF38] prose-blockquote:bg-[#1C1C1A] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:text-[#F3F2EE] prose-blockquote:font-medium prose-blockquote:italic
        prose-code:text-[#D6FF38] prose-code:bg-[#1C1C1A] prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#1C1C1A] prose-pre:border prose-pre:border-[#2A2A28]
        prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-[#2A2A28]
        prose-ul:text-[#A3A19C] prose-ol:text-[#A3A19C]
        prose-li:marker:text-[#D6FF38]">
        <Markdown rehypePlugins={[rehypeRaw]} components={COMPONENT_MAP as unknown as Record<string, React.ComponentType>}>
          {fixSelfClosingTags(post.content)}
        </Markdown>
      </div>
    </article>
  );
}
