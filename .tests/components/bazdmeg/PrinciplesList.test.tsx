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
          whileHover: _whileHover,
          viewport: _viewport,
          ...props
        }: {
          children?: React.ReactNode;
          initial?: unknown;
          animate?: unknown;
          transition?: unknown;
          whileInView?: unknown;
          whileHover?: unknown;
          viewport?: unknown;
          [key: string]: unknown;
        }) =>
          React.createElement(tag as keyof JSX.IntrinsicElements, props, children),
    },
  ),
}));

import { PrinciplesList } from "../../../src/components/bazdmeg/PrinciplesList";

describe("PrinciplesList", () => {
  it("renders the section heading", () => {
    render(<PrinciplesList />);
    expect(screen.getByRole("heading", { name: /the 8 core principles/i })).toBeInTheDocument();
  });

  it("renders all 8 principle titles", () => {
    render(<PrinciplesList />);

    const expectedTitles = [
      "Requirements Are The Product",
      "Discipline Before Automation",
      "Context Is Architecture",
      "Test The Lies",
      "Orchestrate, Do Not Operate",
      "Trust Is Earned In PRs",
      "Own What You Ship",
      "Sources Have Rank",
    ];

    for (const title of expectedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders all 8 principle subtitles", () => {
    render(<PrinciplesList />);

    const subtitles = [
      "The code is just the output",
      "You cannot automate chaos",
      "What the model knows when you ask",
      "Unit tests, E2E tests, agent tests",
      "Coordinate agents, not keystrokes",
      "Not in promises, not in demos",
      "If you cannot explain it at 3am, do not ship it",
      "Canonical spec > audit > chat",
    ];

    for (const subtitle of subtitles) {
      expect(screen.getByText(subtitle)).toBeInTheDocument();
    }
  });

  it("labels each card with Principle 1 through Principle 8", () => {
    render(<PrinciplesList />);

    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(`Principle ${i}`)).toBeInTheDocument();
    }
  });

  it("renders inside a section with id='principles'", () => {
    const { container } = render(<PrinciplesList />);
    const section = container.querySelector("section#principles");
    expect(section).toBeInTheDocument();
  });

  it("renders 8 card elements in the grid", () => {
    const { container } = render(<PrinciplesList />);
    // Each card contains a "Principle N" label — count matching elements
    const principleLabels = container.querySelectorAll("div.mb-2");
    expect(principleLabels).toHaveLength(8);
  });

  it("renders icons for all principles", () => {
    render(<PrinciplesList />);
    // Icons are text nodes with emoji; spot-check a couple
    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByText("🧪")).toBeInTheDocument();
    expect(screen.getByText("📚")).toBeInTheDocument();
  });

  it("renders each principle description", () => {
    render(<PrinciplesList />);
    expect(
      screen.getByText(/define exactly what you want before writing a single line/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/llms are incredibly convincing liars/i)).toBeInTheDocument();
    expect(screen.getByText(/you are responsible for every line of code/i)).toBeInTheDocument();
  });
});
