import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PromptShelf from "@/components/PromptShelf";
import type { Library } from "@/lib/store";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (
    window as Window & { promptShelfDesktop?: Window["promptShelfDesktop"] }
  ).promptShelfDesktop;
});

it("transitions from its loading state to the library without changing hook order", async () => {
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
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  render(<PromptShelf />);

  expect(await screen.findByText("Library health")).toBeInTheDocument();
  const reactErrors = consoleError.mock.calls.flat().join(" ");
  expect(reactErrors).not.toMatch(
    /change in the order of hooks|rendered (more|fewer) hooks/i,
  );
});
