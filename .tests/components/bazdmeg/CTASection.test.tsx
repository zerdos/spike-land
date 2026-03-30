import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({
          children,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          whileInView: _whileInView,
          viewport: _viewport,
          ...props
        }: {
          children?: React.ReactNode;
          initial?: unknown;
          animate?: unknown;
          transition?: unknown;
          whileInView?: unknown;
          viewport?: unknown;
          [key: string]: unknown;
        }) =>
          React.createElement(tag as keyof JSX.IntrinsicElements, props, children),
    },
  ),
}));

import { CTASection } from "../../../src/components/bazdmeg/CTASection";

describe("CTASection", () => {
  it("renders the Adopt the BAZDMEG Method heading", () => {
    render(<CTASection />);
    expect(screen.getByRole("heading", { name: /adopt the bazdmeg method/i })).toBeInTheDocument();
  });

  it("renders the motivational paragraph about quality gates", () => {
    render(<CTASection />);
    expect(screen.getByText(/stop letting ai generate slop/i)).toBeInTheDocument();
    expect(screen.getByText(/enforce the 8 principles on/i)).toBeInTheDocument();
  });

  it("renders the Get the Skill link", () => {
    render(<CTASection />);
    const link = screen.getByRole("link", { name: /get the skill/i });
    expect(link).toBeInTheDocument();
  });

  it("Get the Skill link points to the correct GitHub URL", () => {
    render(<CTASection />);
    const link = screen.getByRole("link", { name: /get the skill/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/spike-land-ai/spike-land/tree/main/.claude/skills/bazdmeg",
    );
  });

  it("Get the Skill link opens in a new tab with rel noreferrer", () => {
    render(<CTASection />);
    const link = screen.getByRole("link", { name: /get the skill/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders the View Documentation link", () => {
    render(<CTASection />);
    const link = screen.getByRole("link", { name: /view documentation/i });
    expect(link).toBeInTheDocument();
  });

  it("View Documentation link points to the GitHub repo", () => {
    render(<CTASection />);
    const link = screen.getByRole("link", { name: /view documentation/i });
    expect(link).toHaveAttribute("href", "https://github.com/spike-land-ai/spike-land");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders both CTA links side by side", () => {
    render(<CTASection />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });

  it("renders inside a section element", () => {
    const { container } = render(<CTASection />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
