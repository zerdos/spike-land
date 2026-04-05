import { Link } from "@tanstack/react-router";
import { BlogListView } from "@spike-land-ai/block-website/ui";

export function BlogIndexPage() {
  return (
    <div className="min-h-screen font-sans antialiased">
      {/* Breadcrumb */}
      <nav className="rubik-container pt-8 pb-0" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="opacity-30 select-none">
            /
          </li>
          <li>
            <span className="font-medium text-foreground">Blog</span>
          </li>
        </ol>
      </nav>

      {/* Blog listing — header rendered inside BlogListView */}
      <main>
        <BlogListView linkComponent={Link} showHeader={true} />
      </main>
    </div>
  );
}
