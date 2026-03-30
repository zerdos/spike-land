import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioCard } from "../../../src/components/agency/portfolio-card";

describe("PortfolioCard", () => {
  describe("required props", () => {
    it("renders the title", () => {
      render(<PortfolioCard title="My Project" description="A cool project" />);
      expect(screen.getByText("My Project")).toBeInTheDocument();
    });

    it("renders the description", () => {
      render(<PortfolioCard title="My Project" description="A cool project" />);
      expect(screen.getByText("A cool project")).toBeInTheDocument();
    });

    it("renders title in an h3 element", () => {
      render(<PortfolioCard title="My Project" description="A cool project" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("My Project");
    });
  });

  describe("optional imageUrl prop", () => {
    it("does not render an img when imageUrl is omitted", () => {
      render(<PortfolioCard title="No Image" description="No image here" />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("renders an img when imageUrl is provided", () => {
      render(
        <PortfolioCard
          title="With Image"
          description="Has image"
          imageUrl="https://example.com/image.png"
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.png");
    });

    it("sets the img alt to the title value", () => {
      render(
        <PortfolioCard
          title="Alt Test"
          description="desc"
          imageUrl="https://example.com/img.jpg"
        />,
      );
      expect(screen.getByAltText("Alt Test")).toBeInTheDocument();
    });
  });

  describe("optional link prop", () => {
    it("does not render a link when link is omitted", () => {
      render(<PortfolioCard title="No Link" description="No link here" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders a link when link is provided", () => {
      render(
        <PortfolioCard
          title="With Link"
          description="Has link"
          link="https://example.com/project"
        />,
      );
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("link href points to the provided URL", () => {
      render(
        <PortfolioCard
          title="With Link"
          description="Has link"
          link="https://example.com/project"
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/project");
    });

    it("link opens in a new tab with rel noopener noreferrer", () => {
      render(<PortfolioCard title="With Link" description="desc" link="https://example.com" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("link text reads View Project", () => {
      render(<PortfolioCard title="Link Text" description="desc" link="https://example.com" />);
      expect(screen.getByRole("link")).toHaveTextContent("View Project");
    });
  });

  describe("all props together", () => {
    it("renders image and link simultaneously when both provided", () => {
      render(
        <PortfolioCard
          title="Full Card"
          description="All props"
          imageUrl="https://example.com/img.png"
          link="https://example.com/project"
        />,
      );
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(screen.getByText("Full Card")).toBeInTheDocument();
      expect(screen.getByText("All props")).toBeInTheDocument();
    });
  });
});
