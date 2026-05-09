"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { CanvasIcon, FolderListIcon, PageIcon } from "@/components/NoteliteIcons";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotionStore } from "@/lib/notion-store";
import { cn } from "@/lib/utils";

type WorkspaceSearchProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type SearchItem = {
  id: string;
  href: string;
  title: string;
  type: "Page" | "Canvas" | "Folder";
  parentLabel: string;
  body: string;
  childCount?: number;
  folderColor?: string;
};

type SearchGroup = {
  label: string;
  items: SearchItem[];
};

function getPlainText(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as { text?: string; content?: unknown[] };
  return [node.text ?? "", ...(node.content ?? []).map(getPlainText)].join(" ");
}

function getIcon(type: SearchItem["type"]) {
  if (type === "Canvas") return CanvasIcon;
  return PageIcon;
}

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-[#d9d9d9] bg-white px-1.5 text-[11px] font-medium leading-none text-[#727272] shadow-[inset_0_1px_0_rgba(31,35,40,0.04)]">
      {children}
    </kbd>
  );
}

export function WorkspaceSearch({ isOpen, onOpenChange }: WorkspaceSearchProps) {
  const router = useRouter();
  const { pages, databases } = useNotionStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchItems = useMemo<SearchItem[]>(() => {
    const folderCounts = new Map<string, number>();
    pages.forEach((page) => {
      if (page.parentId) {
        folderCounts.set(page.parentId, (folderCounts.get(page.parentId) ?? 0) + 1);
      }
    });

    const pageItems = pages.map((page) => {
      const parent = pages.find((candidate) => candidate.id === page.parentId);
      const inlineDatabaseText = (page.inlineDatabaseIds ?? [])
        .map((databaseId) => databases.find((database) => database.id === databaseId)?.title)
        .filter(Boolean)
        .join(" ");

      return {
        id: page.id,
        href: `/page/${page.id}`,
        title: page.title || "Untitled",
        type: page.type === "folder" ? "Folder" : "Page",
        parentLabel: parent?.title ?? "Workspace",
        body:
          page.type === "folder"
            ? `${folderCounts.get(page.id) ?? 0} items`
            : `${getPlainText(page.content)} ${inlineDatabaseText}`.trim(),
        childCount: page.type === "folder" ? folderCounts.get(page.id) ?? 0 : undefined,
        folderColor: page.type === "folder" ? page.folderColor : undefined,
      } satisfies SearchItem;
    });

    const canvasItems = pages
      .filter((page) => page.type === "page")
      .filter((page) => {
        const canvas = page.canvas as { elements?: unknown[] } | undefined;
        return Boolean(canvas?.elements?.length) || page.title.toLowerCase().includes("canvas");
      })
      .map((page) => {
        const parent = pages.find((candidate) => candidate.id === page.parentId);
        return {
          id: `canvas-${page.id}`,
          href: `/page/${page.id}`,
          title: `${page.title || "Untitled"} canvas`,
          type: "Canvas",
          parentLabel: parent?.title ?? "Workspace",
          body: "Canvas",
        } satisfies SearchItem;
      });

    return [...pageItems, ...canvasItems];
  }, [databases, pages]);

  const groups = useMemo<SearchGroup[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = (item: SearchItem) =>
      `${item.title} ${item.type} ${item.parentLabel} ${item.body}`
        .toLowerCase()
        .includes(normalizedQuery);
    const source = normalizedQuery ? searchItems.filter(matches) : searchItems;

    return [
      { label: "Pages", items: source.filter((item) => item.type === "Page").slice(0, 4) },
      { label: "Canvas", items: source.filter((item) => item.type === "Canvas").slice(0, 3) },
      { label: "Folder", items: source.filter((item) => item.type === "Folder").slice(0, 4) },
    ].filter((group) => group.items.length > 0);
  }, [query, searchItems]);

  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const selectedItem = flatResults[selectedIndex] ?? flatResults[0];

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (isModifierPressed && (key === "k" || key === "p")) {
        event.preventDefault();
        onOpenChange(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange]);

  useEffect(() => {
    function handleOpenSearch() {
      onOpenChange(true);
    }

    window.addEventListener("notelite:open-workspace-search", handleOpenSearch);
    return () => window.removeEventListener("notelite:open-workspace-search", handleOpenSearch);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.setTimeout(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSearch();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex > Math.max(flatResults.length - 1, 0)) {
      setSelectedIndex(Math.max(flatResults.length - 1, 0));
    }
  }, [flatResults.length, selectedIndex]);

  function closeSearch() {
    onOpenChange(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function openItem(item: SearchItem | undefined) {
    if (!item) {
      return;
    }

    closeSearch();
    router.push(item.href);
  }

  if (!isOpen) {
    return null;
  }

  let rowIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[5px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSearch();
        }
      }}
    >
      <div className="fixed left-1/2 top-1/2 flex w-[min(840px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-0.5">
        <div className="relative flex h-10 items-center rounded-lg border border-[#d9d9d9] bg-white px-3 shadow-[inset_0_1px_0_rgba(31,35,40,0.04)]">
          <Search className="mr-2 size-4 shrink-0 text-[#727272]" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeSearch();
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((index) => Math.min(index + 1, Math.max(flatResults.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                openItem(selectedItem);
              }
            }}
            placeholder="Search anything..."
            className="h-full border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-[#8e8e93] focus-visible:ring-0"
          />
          <span className="ml-2 rounded-md bg-white px-2 py-1 text-xs font-semibold uppercase leading-none text-[#1a1a1a]">
            ESC
          </span>
        </div>

        <div className="overflow-hidden rounded-lg bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.12)]">
          <ScrollArea className="max-h-[min(440px,calc(100vh-180px))]">
            <div className="space-y-3">
              {groups.length ? (
                groups.map((group) => (
                  <section key={group.label} className="space-y-1">
                    <div className="px-2 text-xs font-medium text-[#727272]">{group.label}</div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        rowIndex += 1;
                        const currentIndex = rowIndex;
                        const Icon = getIcon(item.type);
                        const detail =
                          item.type === "Folder"
                            ? `${item.childCount ?? 0} ${(item.childCount ?? 0) === 1 ? "item" : "items"}`
                            : item.parentLabel;

                        return (
                          <button
                            key={`${item.type}-${item.id}`}
                            type="button"
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            onClick={() => openItem(item)}
                            className={cn(
                              "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2]",
                              currentIndex === selectedIndex && "bg-[#f2f2f2]",
                            )}
                          >
                            {item.type === "Folder" ? (
                              <FolderListIcon childCount={item.childCount ?? 0} folderColor={item.folderColor} className="size-4 shrink-0" />
                            ) : (
                              <Icon className="size-4 shrink-0 text-[#757575]" />
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {item.title}
                              <span className="font-normal text-[#727272]"> - {detail}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-[#727272]">
                  No matching pages, canvases, or folders.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-2 flex h-[30px] items-center justify-between border-t border-transparent px-2 text-xs text-[#727272]">
            <span className="inline-flex items-center gap-1">
              <ShortcutKey>⌘</ShortcutKey>
              <ShortcutKey>K</ShortcutKey>
              <span>or</span>
              <ShortcutKey>⌘</ShortcutKey>
              <ShortcutKey>P</ShortcutKey>
              <span>to search</span>
            </span>
            <span>↵ Open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
