import { toast } from "sonner";
import { actions } from "@/lib/store";

export const ago = (timestamp: number | null) => {
  if (!timestamp) return "never";
  const seconds = (Date.now() - timestamp) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export async function copyText(text: string, id?: string) {
  try {
    if (window.promptShelfDesktop?.writeClipboard)
      await window.promptShelfDesktop.writeClipboard(text);
    else await navigator.clipboard.writeText(text);
    if (id) actions.markUsed(id);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Copy failed — clipboard unavailable");
  }
}
