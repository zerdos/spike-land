import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// framer-motion uses animation APIs not available in jsdom. Mock the entire
// module so that motion.div renders as a plain div passing through its children
// and standard HTML props.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
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

import { HeroSection } from "../../../src/components/bazdmeg/HeroSection";

describe("HeroSection", () => {
  it("renders the BAZDMEG Method heading", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("heading", { level: 1, name: /the bazdmeg method/i }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle badge text", () => {
    render(<HeroSection />);
    expect(screen.getByText(/quality gates for ai-assisted development/i)).toBeInTheDocument();
  });

  it("renders the descriptive paragraph", () => {
    render(<HeroSection />);
    expect(screen.getByText(/eight principles for ai-assisted development/i)).toBeInTheDocument();
  });

  it("renders the Explore the 8 Principles anchor link", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /explore the 8 principles/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#principles");
  });

  it("renders the Read the Spec link pointing to GitHub", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /read the spec/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/spike-land-ai/spike-land");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders inside a section element", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
