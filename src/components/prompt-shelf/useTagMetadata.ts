import { useMemo } from "react";
import type { Library } from "@/lib/store";
import type { View } from "./types";

export function useTagMetadata(lib: Library | null, view: View) {
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of lib?.prompts ?? []) {
      if (p.status === "active") {
        for (const t of p.tags) {
          counts.set(t, (counts.get(t) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [lib?.prompts]);

  const allTagsWithCounts = useMemo(() => {
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [tagCounts]);

  const sidebarTags = useMemo(() => {
    const top = allTagsWithCounts.slice(0, 8);
    if (view.k === "tag" && !top.some((t) => t.tag === view.tag)) {
      const activeCount = tagCounts.get(view.tag) ?? 0;
      return [...top, { tag: view.tag, count: activeCount }];
    }
    return top;
  }, [allTagsWithCounts, view, tagCounts]);

  const availableViewTags = useMemo(() => {
    const viewPrompts = (lib?.prompts ?? []).filter((p) => {
      if (p.status !== "active" && view.k !== "archived" && view.k !== "trash")
        return false;
      if (view.k === "collection") return p.collectionId === view.id;
      if (view.k === "favorites") return p.favorite;
      if (view.k === "pinned") return p.pinned;
      if (view.k === "templates") return p.vars.length > 0;
      if (view.k === "recent") return !!p.lastUsedAt;
      return true;
    });
    const counts = new Map<string, number>();
    for (const p of viewPrompts) {
      for (const t of p.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [lib?.prompts, view]);

  return { allTagsWithCounts, sidebarTags, availableViewTags };
}
