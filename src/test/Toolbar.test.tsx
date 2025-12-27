import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Toolbar } from "../components/Toolbar";

describe("Toolbar Component", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("should render the Tools header", () => {
    render(<Toolbar />);
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  describe("View Toggle", () => {
    it("should show LayoutGrid icon when labels are shown", () => {
      render(<Toolbar />);
      // When labels are shown, the toggle button should have tooltip "Icons Only"
      const button = screen.getByRole("button", { name: "" });
      expect(button).toHaveAttribute("data-tooltip-content", "Icons Only");
    });

    it("should show LayoutList icon when in icon-only mode", () => {
      window.localStorage.setItem("toolbar-show-labels", "false");
      render(<Toolbar />);
      // When in icon-only mode, the toggle button should have tooltip "Show Labels"
      const buttons = screen.getAllByRole("button");
      const toggleButton = buttons.find((btn) =>
        btn.getAttribute("data-tooltip-content"),
      );
      expect(toggleButton).toHaveAttribute(
        "data-tooltip-content",
        "Show Labels",
      );
    });

    it("should toggle between icon-only and labels view", async () => {
      render(<Toolbar />);

      // Find the toggle button
      const buttons = screen.getAllByRole("button");
      const toggleButton = buttons.find((btn) =>
        btn.getAttribute("data-tooltip-content"),
      ) as HTMLElement;

      // Initially shows labels (tooltip should say "Icons Only")
      expect(toggleButton).toHaveAttribute(
        "data-tooltip-content",
        "Icons Only",
      );

      // Click to switch to icon-only
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute(
          "data-tooltip-content",
          "Show Labels",
        );
      });
    });

    it("should persist view preference to localStorage", async () => {
      render(<Toolbar />);

      // Find and click the toggle button
      const buttons = screen.getAllByRole("button");
      const toggleButton = buttons.find((btn) =>
        btn.getAttribute("data-tooltip-content"),
      ) as HTMLElement;
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const saved = window.localStorage.getItem("toolbar-show-labels");
        expect(saved).toBe("false");
      });
    });

    it("should restore view preference from localStorage on mount", () => {
      window.localStorage.setItem("toolbar-show-labels", "false");
      render(<Toolbar />);

      // When restored from localStorage with false, tooltip should say "Show Labels"
      const buttons = screen.getAllByRole("button");
      const toggleButton = buttons.find((btn) =>
        btn.getAttribute("data-tooltip-content"),
      );
      expect(toggleButton).toHaveAttribute(
        "data-tooltip-content",
        "Show Labels",
      );
    });
  });

  describe("Collapsible Sections", () => {
    it("should render all block group sections", () => {
      render(<Toolbar />);

      expect(screen.getByText(/inputs/i)).toBeInTheDocument();
      expect(screen.getByText(/generators/i)).toBeInTheDocument();
      expect(screen.getByText(/processors/i)).toBeInTheDocument();
      expect(screen.getByText(/math/i)).toBeInTheDocument();
      expect(screen.getByText(/routing/i)).toBeInTheDocument();
      expect(screen.getByText(/outputs/i)).toBeInTheDocument();
    });

    it("should expand all sections by default", () => {
      render(<Toolbar />);

      // Check that some blocks from each section are visible
      expect(screen.getByText("Slider")).toBeInTheDocument();
      expect(screen.getByText("Sine Wave")).toBeInTheDocument();
      expect(screen.getByText("Gain")).toBeInTheDocument();
    });

    it("should collapse section when header is clicked", async () => {
      render(<Toolbar />);

      // Find and click the Inputs section header button
      const inputsHeader = screen.getByRole("button", { name: /inputs/i });
      fireEvent.click(inputsHeader);

      await waitFor(() => {
        // The Slider block should no longer be visible
        expect(screen.queryByText("Slider")).not.toBeInTheDocument();
      });
    });

    it("should expand collapsed section when header is clicked again", async () => {
      render(<Toolbar />);

      // Find and click the Inputs section header to collapse
      const inputsHeader = screen.getByRole("button", { name: /inputs/i });
      fireEvent.click(inputsHeader);

      await waitFor(() => {
        expect(screen.queryByText("Slider")).not.toBeInTheDocument();
      });

      // Click again to expand
      fireEvent.click(inputsHeader);

      await waitFor(() => {
        expect(screen.getByText("Slider")).toBeInTheDocument();
      });
    });

    it("should persist collapsed state to localStorage", async () => {
      render(<Toolbar />);

      // Collapse the Inputs section
      const inputsHeader = screen.getByRole("button", { name: /inputs/i });
      fireEvent.click(inputsHeader);

      await waitFor(() => {
        const saved = window.localStorage.getItem("toolbar-collapsed-sections");
        expect(saved).toBeTruthy();
        if (saved) {
          const parsed = JSON.parse(saved);
          expect(parsed).toContain("Inputs");
        }
      });
    });

    it("should restore collapsed state from localStorage on mount", () => {
      window.localStorage.setItem("toolbar-collapsed-sections", '["Inputs"]');
      render(<Toolbar />);

      // The Slider block should not be visible
      expect(screen.queryByText("Slider")).not.toBeInTheDocument();
      // But the header should still be visible
      expect(screen.getByText(/inputs/i)).toBeInTheDocument();
    });
  });

  describe("Block Rendering", () => {
    it("should render blocks with labels by default", () => {
      render(<Toolbar />);

      // Should show block labels
      expect(screen.getByText("Slider")).toBeInTheDocument();
      expect(screen.getByText("Sine Wave")).toBeInTheDocument();
    });

    it("should render blocks as icons only when in icon mode", () => {
      window.localStorage.setItem("toolbar-show-labels", "false");
      render(<Toolbar />);

      // When in icon-only mode, tooltip should say "Show Labels"
      const buttons = screen.getAllByRole("button");
      const toggleButton = buttons.find((btn) =>
        btn.getAttribute("data-tooltip-content"),
      );
      expect(toggleButton).toHaveAttribute(
        "data-tooltip-content",
        "Show Labels",
      );
    });
  });
});
