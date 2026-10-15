import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

it("keeps the library closed after a storage failure and retries loading the real library", async () => {
  const emptyLibrary: Library = {
    version: 1,
    seedLibraryVersion: 3,
    prompts: [],
    collections: [],
  };
  const bridge = {
    loadLibrary: vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary database lock"))
      .mockResolvedValueOnce(emptyLibrary),
    saveLibrary: vi.fn(async () => ({ saved: true as const })),
  } as unknown as NonNullable<Window["promptShelfDesktop"]>;
  Object.defineProperty(window, "promptShelfDesktop", {
    configurable: true,
    value: bridge,
  });

  render(<PromptShelf />);

  expect(
    await screen.findByRole("heading", {
      name: /we couldn’t open your saved prompts/i,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/your saved library has not been replaced/i),
  ).toBeInTheDocument();
  expect(bridge.loadLibrary).toHaveBeenCalledTimes(1);
  expect(bridge.saveLibrary).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: /retry loading/i }));

  expect(await screen.findByText("Library health")).toBeInTheDocument();
  expect(bridge.loadLibrary).toHaveBeenCalledTimes(2);
});
