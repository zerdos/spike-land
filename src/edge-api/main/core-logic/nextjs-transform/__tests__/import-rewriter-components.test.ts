import { describe, expect, it } from "vitest";
import { rewriteImports } from "../import-rewriter.ts";

// ---------------------------------------------------------------------------
// next/image
// ---------------------------------------------------------------------------

describe("rewriteImports — next/image", () => {
  it("removes the import and rewrites a basic Image tag to img with loading=lazy", () => {
    const source = [
      `import Image from "next/image";`,
      `export default function Page() {`,
      `  return <Image src="/photo.jpg" alt="A photo" width={300} height={200} />;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("page.tsx", source);

    expect(transformed).not.toContain(`from "next/image"`);
    expect(transformed).toContain(`<img`);
    expect(transformed).toContain(`src="/photo.jpg"`);
    expect(transformed).toContain(`alt="A photo"`);
    expect(transformed).toContain(`width={300}`);
    expect(transformed).toContain(`height={200}`);
    expect(transformed).toContain(`loading="lazy"`);
    expect(transformed).not.toContain(`<Image`);
  });

  it("removes the priority prop from the transformed img tag", () => {
    const source = [
      `import Image from "next/image";`,
      `export default function Hero() {`,
      `  return <Image src="/hero.png" alt="Hero" width={1200} height={600} priority />;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("hero.tsx", source);

    expect(transformed).toContain(`<img`);
    expect(transformed).not.toContain(`priority`);
    expect(transformed).toContain(`loading="lazy"`);
  });

  it("removes placeholder, blurDataURL, loader, quality, and sizes props", () => {
    const source = [
      `import Image from "next/image";`,
      `const myLoader = ({ src }: { src: string }) => src;`,
      `export default function Card() {`,
      `  return (`,
      `    <Image`,
      `      src="/card.jpg"`,
      `      alt="Card"`,
      `      width={400}`,
      `      height={400}`,
      `      placeholder="blur"`,
      `      blurDataURL="data:image/png;base64,abc"`,
      `      loader={myLoader}`,
      `      quality={75}`,
      `      sizes="(max-width: 768px) 100vw, 50vw"`,
      `    />`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("card.tsx", source);

    expect(transformed).not.toContain(`placeholder`);
    expect(transformed).not.toContain(`blurDataURL`);
    expect(transformed).not.toContain(`loader={myLoader}`);
    expect(transformed).not.toContain(`quality`);
    expect(transformed).not.toContain(`sizes=`);
    expect(transformed).toContain(`loading="lazy"`);
  });

  it("converts fill prop to an inline style covering the parent", () => {
    const source = [
      `import Image from "next/image";`,
      `export default function Cover() {`,
      `  return <Image src="/bg.jpg" alt="Background" fill />;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("cover.tsx", source);

    expect(transformed).toContain(`style={{ width: '100%', height: '100%', objectFit: 'cover' }}`);
    expect(transformed).not.toMatch(/\bfill\b(?!\s*=)/);
  });

  it("adds a warning when next/image is imported under a non-default alias", () => {
    const source = [
      `import Img from "next/image";`,
      `export default function Gallery() {`,
      `  return <Img src="/gallery.jpg" alt="Gallery" width={800} height={600} />;`,
      `}`,
    ].join("\n");

    const { warnings } = rewriteImports("gallery.tsx", source);

    expect(warnings.some((w) => w.includes("Img") && w.includes("next/image"))).toBe(true);
  });

  it("transforms multiple Image tags in the same file independently", () => {
    const source = [
      `import Image from "next/image";`,
      `export default function List() {`,
      `  return (`,
      `    <ul>`,
      `      <li><Image src="/a.jpg" alt="A" width={100} height={100} /></li>`,
      `      <li><Image src="/b.jpg" alt="B" width={200} height={200} priority /></li>`,
      `    </ul>`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("list.tsx", source);

    // The TODO comment the rewriter adds for the removed import also contains
    // the text "<img", so we count only JSX element occurrences (angle-bracket
    // followed by "img" and then a whitespace or "/") to avoid false positives.
    const jsxImgMatches = transformed.match(/<img[\s/]/g) ?? [];
    expect(jsxImgMatches).toHaveLength(2);
    expect(transformed).not.toContain(`priority`);
    const lazyMatches = transformed.match(/loading="lazy"/g) ?? [];
    expect(lazyMatches).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// next/head
// ---------------------------------------------------------------------------

describe("rewriteImports — next/head", () => {
  it("replaces the Head import with useEffect and a TODO comment", () => {
    const source = [
      `import Head from "next/head";`,
      `export default function Page() {`,
      `  return (`,
      `    <>`,
      `      <Head><title>My Page</title></Head>`,
      `      <main>content</main>`,
      `    </>`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("page.tsx", source);

    expect(transformed).not.toContain(`from "next/head"`);
    expect(transformed).toContain(`import { useEffect } from "react"`);
    expect(transformed).toContain(`TODO`);
  });

  it("emits a document.title assignment when the Head block contains a title tag", () => {
    const source = [
      `import Head from "next/head";`,
      `export default function About() {`,
      `  return (`,
      `    <>`,
      `      <Head><title>About Us</title></Head>`,
      `      <p>Hello</p>`,
      `    </>`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("about.tsx", source);

    expect(transformed).toContain(`document.title = "About Us"`);
    expect(transformed).not.toContain(`<Head>`);
    expect(transformed).not.toContain(`</Head>`);
    expect(transformed).not.toContain(`<title>`);
  });

  it("replaces a Head block without a title tag using only the TODO comment", () => {
    const source = [
      `import Head from "next/head";`,
      `export default function Minimal() {`,
      `  return (`,
      `    <>`,
      `      <Head><meta name="robots" content="noindex" /></Head>`,
      `      <p>Body</p>`,
      `    </>`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("minimal.tsx", source);

    expect(transformed).not.toContain(`document.title`);
    expect(transformed).toContain(`TODO`);
    expect(transformed).not.toContain(`<Head>`);
  });

  it("adds a warning recommending react-helmet-async for SSR", () => {
    const source = [
      `import Head from "next/head";`,
      `export default function Page() {`,
      `  return <Head><title>Test</title></Head>;`,
      `}`,
    ].join("\n");

    const { warnings } = rewriteImports("page.tsx", source);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.toLowerCase().includes("next/head"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// next/dynamic
// ---------------------------------------------------------------------------

describe("rewriteImports — next/dynamic", () => {
  it("replaces the dynamic import with lazy/Suspense and converts a simple call", () => {
    const source = [
      `import dynamic from "next/dynamic";`,
      `const Chart = dynamic(() => import("./Chart"));`,
      `export default function Dashboard() {`,
      `  return <Chart />;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("dashboard.tsx", source);

    expect(transformed).not.toContain(`from "next/dynamic"`);
    expect(transformed).toContain(`import { lazy, Suspense } from "react"`);
    expect(transformed).toContain(`lazy(() => import("./Chart"))`);
    expect(transformed).not.toContain(`dynamic(`);
  });

  it("strips dynamic options (ssr, loading) and adds a warning for complex calls", () => {
    const source = [
      `import dynamic from "next/dynamic";`,
      `const Modal = dynamic(() => import("./Modal"), { ssr: false, loading: () => <p>Loading…</p> });`,
      `export default function App() {`,
      `  return <Modal />;`,
      `}`,
    ].join("\n");

    const { transformed, warnings } = rewriteImports("app.tsx", source);

    expect(transformed).toContain(`lazy(() => import("./Modal"))`);
    expect(transformed).not.toContain(`ssr`);
    expect(transformed).not.toContain(`loading:`);
    expect(warnings.some((w) => w.includes("Suspense"))).toBe(true);
  });

  it("leaves the file unchanged when there is no next/dynamic import", () => {
    const source = [
      `import React from "react";`,
      `export default function Static() {`,
      `  return <p>No dynamic here.</p>;`,
      `}`,
    ].join("\n");

    const { transformed, warnings } = rewriteImports("static.tsx", source);

    expect(transformed).toBe(source);
    expect(warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// next/script
// ---------------------------------------------------------------------------

describe("rewriteImports — next/script", () => {
  it("removes the Script import and replaces open/close Script tags with script tags", () => {
    const source = [
      `import Script from "next/script";`,
      `export default function Analytics() {`,
      `  return <Script src="https://analytics.example.com/a.js"></Script>;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("analytics.tsx", source);

    expect(transformed).not.toContain(`from "next/script"`);
    expect(transformed).toContain(`<script`);
    expect(transformed).toContain(`</script>`);
    expect(transformed).not.toContain(`<Script`);
    expect(transformed).not.toContain(`</Script>`);
  });

  it("removes the strategy prop from the converted script tag", () => {
    const source = [
      `import Script from "next/script";`,
      `export default function Tracker() {`,
      `  return (`,
      `    <Script`,
      `      src="https://tracker.io/t.js"`,
      `      strategy="afterInteractive"`,
      `    ></Script>`,
      `  );`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("tracker.tsx", source);

    expect(transformed).toContain(`<script`);
    expect(transformed).not.toContain(`strategy`);
  });

  it("handles a self-closing Script tag", () => {
    const source = [
      `import Script from "next/script";`,
      `export default function Inline() {`,
      `  return <Script src="/init.js" strategy="beforeInteractive" />;`,
      `}`,
    ].join("\n");

    const { transformed } = rewriteImports("inline.tsx", source);

    expect(transformed).toContain(`<script`);
    expect(transformed).not.toContain(`strategy`);
    expect(transformed).not.toContain(`<Script`);
  });

  it("adds a warning about load-ordering differences", () => {
    const source = [
      `import Script from "next/script";`,
      `export default function Page() {`,
      `  return <Script src="/a.js" />;`,
      `}`,
    ].join("\n");

    const { warnings } = rewriteImports("page.tsx", source);

    expect(warnings.some((w) => w.toLowerCase().includes("next/script"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No matching imports — file should pass through unchanged
// ---------------------------------------------------------------------------

describe("rewriteImports — no component imports", () => {
  it("returns the source unchanged when none of the component imports are present", () => {
    const source = [
      `import React from "react";`,
      `import styles from "./Home.module.css";`,
      ``,
      `export default function Home() {`,
      `  return <main className={styles.main}><h1>Hello</h1></main>;`,
      `}`,
    ].join("\n");

    const { transformed, warnings } = rewriteImports("home.tsx", source);

    expect(transformed).toBe(source);
    expect(warnings).toHaveLength(0);
  });

  it("populates filename and original fields on the result regardless of transforms", () => {
    const source = `export const x = 1;`;

    const result = rewriteImports("constants.ts", source);

    expect(result.filename).toBe("constants.ts");
    expect(result.original).toBe(source);
  });
});
