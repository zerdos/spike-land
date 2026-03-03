import Markdown from "react-markdown";
import { getPostBySlug } from "../../core/reducers";

export function BlogPostView({ slug }: { slug: string }) {
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post not found</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">The post you are looking for does not exist.</p>
        <a href="/blog" className="mt-6 inline-block text-blue-600 hover:text-blue-500">
          ← Back to Blog
        </a>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
          {post.category && (
            <>
              <span>•</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{post.category}</span>
            </>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {post.description}
          </p>
        )}
      </header>
      
      <div className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-xl prose-img:shadow-lg">
        <Markdown>{post.content}</Markdown>
      </div>
    </article>
  );
}
