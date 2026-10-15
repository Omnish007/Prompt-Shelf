import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import type { Library } from "@/lib/store";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (
    window as Window & { promptShelfDesktop?: Window["promptShelfDesktop"] }
  ).promptShelfDesktop;
});

describe("App", () => {
  it("renders PromptShelf inside ThemeProvider without crashing", async () => {
    const emptyLibrary: Library = {
      version: 1,
      seedLibraryVersion: 3,
      prompts: [],
      collections: [],
    };
    const bridge = {
      loadLibrary: vi.fn(async () => emptyLibrary),
      saveLibrary: vi.fn(async () => ({ saved: true as const })),
    } as unknown as NonNullable<Window["promptShelfDesktop"]>;
    Object.defineProperty(window, "promptShelfDesktop", {
      configurable: true,
      value: bridge,
    });

    render(<App />);
    expect(await screen.findByText("Library health")).toBeInTheDocument();
  });
});
