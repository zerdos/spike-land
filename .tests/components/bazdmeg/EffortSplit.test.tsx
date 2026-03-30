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
          style: _style,
          ...props
        }: {
          children?: React.ReactNode;
          initial?: unknown;
          animate?: unknown;
          transition?: unknown;
          whileInView?: unknown;
          viewport?: unknown;
          style?: unknown;
          [key: string]: unknown;
        }) =>
          React.createElement(tag as keyof JSX.IntrinsicElements, props, children),
    },
  ),
}));

import { EffortSplit } from "../../../src/components/bazdmeg/EffortSplit";

describe("EffortSplit", () => {
  it("renders the section heading text", () => {
    render(<EffortSplit />);
    // "Where your time actually goes" is a styled <p>, not a heading element
    expect(screen.getByText(/where your time actually goes/i)).toBeInTheDocument();
  });

  it("renders the Shift Left sub-heading", () => {
    render(<EffortSplit />);
    expect(screen.getByText("Shift Left")).toBeInTheDocument();
  });

  it("renders the descriptive paragraph about stopping typing", () => {
    render(<EffortSplit />);
    expect(screen.getByText(/stop typing\. start thinking\./i)).toBeInTheDocument();
  });

  it("renders all four phase names", () => {
    render(<EffortSplit />);
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Testing")).toBeInTheDocument();
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Coding")).toBeInTheDocument();
  });

  it("renders phase descriptions", () => {
    render(<EffortSplit />);
    expect(screen.getByText(/understanding the problem, planning interview/i)).toBeInTheDocument();
    expect(screen.getByText(/writing tests, running agent-based tests/i)).toBeInTheDocument();
    expect(screen.getByText(/edge cases, maintainability, polish/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ai writes the code; you make sure the code is right/i),
    ).toBeInTheDocument();
  });

  it("renders the bar segment titles for non-zero phases", () => {
    render(<EffortSplit />);
    // Each bar segment has a title attribute with "Name: %"
    const { container } = render(<EffortSplit />);
    const planningSegment = container.querySelector('[title="Planning: 30%"]');
    expect(planningSegment).toBeInTheDocument();

    const testingSegment = container.querySelector('[title="Testing: 50%"]');
    expect(testingSegment).toBeInTheDocument();

    const qualitySegment = container.querySelector('[title="Quality: 20%"]');
    expect(qualitySegment).toBeInTheDocument();

    const codingSegment = container.querySelector('[title="Coding: 0%"]');
    expect(codingSegment).toBeInTheDocument();
  });

  it("shows percentage labels for phases with percentage > 10", () => {
    render(<EffortSplit />);
    // Planning=30% and Testing=50% should show their labels in the bar
    // Multiple occurrences expected (bar + legend)
    const thirtyPercents = screen.getAllByText(/30%/);
    expect(thirtyPercents.length).toBeGreaterThanOrEqual(1);

    const fiftyPercents = screen.getAllByText(/50%/);
    expect(fiftyPercents.length).toBeGreaterThanOrEqual(1);
  });

  it("renders inside a section element", () => {
    const { container } = render(<EffortSplit />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
