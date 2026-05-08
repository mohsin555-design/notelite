"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Grid2X2,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Table2,
} from "lucide-react";

import { CanvasIcon, FolderFillIcon, PageIcon } from "@/components/NoteliteIcons";
import { Button } from "@/components/ui/button";
import { WorkspaceItemContextMenu } from "@/components/FolderContextMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type LibraryFilter = "all" | "folder" | "pages" | "canvas";
type LibraryView = "grid" | "list" | "split";
type ItemMenuState = {
  itemId: string;
  x: number;
  y: number;
} | null;

function getPlainText(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as { text?: string; content?: unknown[] };
  return [node.text ?? "", ...(node.content ?? []).map(getPlainText)].join(" ");
}

function childCountFor(pages: Page[], folderId: string) {
  return pages.filter((page) => page.parentId === folderId).length;
}

function isCanvasPage(page: Page) {
  const canvas = page.canvas as { elements?: unknown[] } | undefined;
  return page.type === "page" && (Boolean(canvas?.elements?.length) || page.title.toLowerCase().includes("canvas"));
}

function parentLabel(pages: Page[], page: Page) {
  if (!page.parentId) return "Library";
  return pages.find((candidate) => candidate.id === page.parentId)?.title || "Folder";
}

function openMenuCoordinates(event: MouseEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom + 6 };
}

function CountPill({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-[#eef1f3] px-1.5 py-0.5 text-xs font-semibold text-[#66707a]">
      {count}
    </span>
  );
}

function NewMenu({
  onCreateFolder,
  onCreatePage,
  onCreateCanvas,
}: {
  onCreateFolder: () => void;
  onCreatePage: () => void;
  onCreateCanvas: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        className="h-8 rounded-md bg-[#1f1f1f] px-3 text-sm text-white hover:bg-black"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Plus className="size-4" />
        New
        <ChevronDown className="size-3.5" />
      </Button>
      {isOpen ? (
        <div className="absolute right-0 top-10 z-40 w-36 rounded-xl border border-[#e5e7eb] bg-white p-2 text-sm text-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => { onCreateFolder(); setIsOpen(false); }}>
            <FolderFillIcon className="size-4 text-[#1a1a1a]" />
            Folder
          </button>
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => { onCreatePage(); setIsOpen(false); }}>
            <PageIcon className="size-4 text-[#1a1a1a]" />
            Page
          </button>
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => { onCreateCanvas(); setIsOpen(false); }}>
            <CanvasIcon className="size-4 text-[#1a1a1a]" />
            Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FolderTile({
  folder,
  pages,
  view,
  onOpenMenu,
}: {
  folder: Page;
  pages: Page[];
  view: "grid" | "row";
  onOpenMenu: (itemId: string, x: number, y: number) => void;
}) {
  const childCount = childCountFor(pages, folder.id);

  function openMenuFromButton(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = openMenuCoordinates(event);
    onOpenMenu(folder.id, x, y);
  }

  if (view === "row") {
    return (
      <div
        className="group flex h-[61px] items-center rounded-lg border border-[#d8d8d8] bg-white px-3 transition-colors hover:bg-[#f7f7f7]"
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenMenu(folder.id, event.clientX, event.clientY);
        }}
      >
        <Link href={`/page/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <FolderFillIcon className={cn("size-6 shrink-0", folder.folderColor === "green" ? "text-[#13b65f]" : folder.folderColor === "red" ? "text-[#ff2626]" : folder.folderColor === "orange" ? "text-[#e57f35]" : "text-[#b3b3b3]")} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{folder.title || "New Folder"}</span>
            <span className="block text-xs text-[#727272]">{childCount} {childCount === 1 ? "item" : "items"}</span>
          </span>
        </Link>
        <button type="button" aria-label={`Open ${folder.title || "folder"} actions`} className="flex size-7 items-center justify-center rounded-md opacity-0 hover:bg-[#eeeeee] group-hover:opacity-100" onClick={openMenuFromButton}>
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative"
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(folder.id, event.clientX, event.clientY);
      }}
    >
      <Link href={`/page/${folder.id}`} className="notelite-folder-card" data-folder-color={folder.folderColor ?? "amber"}>
        <span className="notelite-folder-card__container">
          <span className="notelite-folder-card__meta">
            <span className="notelite-folder-card__name">{folder.title || "New Folder"}</span>
            <span className="notelite-folder-card__count">{childCount} {childCount === 1 ? "item" : "items"}</span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Open ${folder.title || "folder"} actions`}
        onClick={openMenuFromButton}
        className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-md bg-white/70 text-[#1a1a1a] opacity-0 hover:bg-[#f2f2f2] group-hover:opacity-100"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}

function ItemCard({
  item,
  pages,
  kind,
  view,
  onOpenMenu,
}: {
  item: Page;
  pages: Page[];
  kind: "page" | "canvas";
  view: "grid" | "row";
  onOpenMenu: (itemId: string, x: number, y: number) => void;
}) {
  const Icon = kind === "canvas" ? CanvasIcon : PageIcon;
  const body = getPlainText(item.content) || "This would be the text which is in the page";

  function openMenuFromButton(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = openMenuCoordinates(event);
    onOpenMenu(item.id, x, y);
  }

  if (view === "row") {
    return (
      <div
        className="group flex h-[61px] items-center rounded-lg border border-[#d8d8d8] bg-white px-3 transition-colors hover:bg-[#f7f7f7]"
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenMenu(item.id, event.clientX, event.clientY);
        }}
      >
        <Link href={`/page/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Icon className="size-6 shrink-0 text-[#757575]" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#1f1f1f]">
              {item.title || (kind === "canvas" ? "Canvas" : "Untitled")}
              <span className="font-normal text-[#727272]"> - {parentLabel(pages, item)}</span>
            </span>
            <span className="block truncate text-xs text-[#727272]">{body}</span>
          </span>
        </Link>
        <button type="button" aria-label={`Open ${item.title || kind} actions`} className="flex size-7 items-center justify-center rounded-md opacity-0 hover:bg-[#eeeeee] group-hover:opacity-100" onClick={openMenuFromButton}>
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative flex h-[135px] w-[181px] rounded-lg border border-[#d8d8d8] bg-white p-3 transition-colors hover:bg-[#f7f7f7]"
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(item.id, event.clientX, event.clientY);
      }}
    >
      <Link href={`/page/${item.id}`} className="flex min-w-0 flex-1 flex-col justify-end gap-2">
        <Icon className="size-8 text-[#757575]" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{item.title || (kind === "canvas" ? "Canvas" : "Untitled")}</span>
          <span className="line-clamp-3 block text-xs leading-4 text-[#727272]">{body}</span>
        </span>
      </Link>
      <button type="button" aria-label={`Open ${item.title || kind} actions`} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md opacity-0 hover:bg-[#eeeeee] group-hover:opacity-100" onClick={openMenuFromButton}>
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}

export function LibraryPage() {
  const router = useRouter();
  const { pages, createFolder, createPage } = useNotionStore();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [view, setView] = useState<LibraryView>("grid");
  const [query, setQuery] = useState("");
  const [itemMenu, setItemMenu] = useState<ItemMenuState>(null);
  const folders = useMemo(() => pages.filter((page) => page.type === "folder"), [pages]);
  const canvasItems = useMemo(() => pages.filter(isCanvasPage), [pages]);
  const pageItems = useMemo(
    () => pages.filter((page) => page.type === "page" && !isCanvasPage(page)),
    [pages],
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folders[0]?.id ?? null);

  useEffect(() => {
    if (!selectedFolderId || !folders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(folders[0]?.id ?? null);
    }
  }, [folders, selectedFolderId]);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = (page: Page) =>
    `${page.title} ${getPlainText(page.content)}`.toLowerCase().includes(normalizedQuery);
  const visibleFolders = normalizedQuery ? folders.filter(matches) : folders;
  const visiblePages = normalizedQuery ? pageItems.filter(matches) : pageItems;
  const visibleCanvases = normalizedQuery ? canvasItems.filter(matches) : canvasItems;
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? folders[0];
  const selectedFolderPages = pages.filter((page) => selectedFolder && page.parentId === selectedFolder.id && page.type === "page");

  function createAndOpenPage(title: string) {
    const page = createPage(null, title);
    router.push(`/page/${page.id}`);
  }

  function renderGrid() {
    if (filter === "folder") {
      return (
        <div className="notelite-folder-grid">
          {visibleFolders.map((folder) => <FolderTile key={folder.id} folder={folder} pages={pages} view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)}
        </div>
      );
    }

    if (filter === "pages") {
      return <SectionGrid label="Pages" items={visiblePages.map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="page" view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} />;
    }

    if (filter === "canvas") {
      return <SectionGrid label="Canvas" items={visibleCanvases.map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="canvas" view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} />;
    }

    return (
      <div className="space-y-6">
        <SectionGrid label="Pages" items={visiblePages.slice(0, 4).map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="page" view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} />
        <SectionGrid label="Canvas" items={visibleCanvases.slice(0, 2).map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="canvas" view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} />
        <section className="space-y-3">
          <div className="text-sm font-medium text-[#727272]">Folder</div>
          <div className="notelite-folder-grid">
            {visibleFolders.map((folder) => <FolderTile key={folder.id} folder={folder} pages={pages} view="grid" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)}
          </div>
        </section>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="space-y-6">
        {(filter === "all" || filter === "pages") ? <SectionList label="Pages" items={visiblePages.map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="page" view="row" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} /> : null}
        {(filter === "all" || filter === "canvas") ? <SectionList label="Canvas" items={visibleCanvases.map((page) => <ItemCard key={page.id} item={page} pages={pages} kind="canvas" view="row" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} /> : null}
        {(filter === "all" || filter === "folder") ? <SectionList label="Folder" items={visibleFolders.map((folder) => <FolderTile key={folder.id} folder={folder} pages={pages} view="row" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />)} /> : null}
      </div>
    );
  }

  function renderSplit() {
    return (
      <div className="grid min-h-[calc(100vh-144px)] grid-cols-[380px_1fr] gap-6">
        <section className="border-r border-[#d8d8d8] pr-6">
          <div className="mb-3 text-sm font-medium text-[#727272]">Folder</div>
          <div className="space-y-0">
            {visibleFolders.map((folder) => {
              const isSelected = selectedFolder?.id === folder.id;
              const color = folder.folderColor === "green" ? "text-[#13b65f]" : folder.folderColor === "red" ? "text-[#ff2626]" : folder.folderColor === "orange" ? "text-[#e57f35]" : "text-[#b3b3b3]";
              return (
                <div key={folder.id} className={cn("group flex h-[41px] items-center border-b border-[#d8d8d8] px-2", isSelected && "bg-[#f2f2f2]")}>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSelectedFolderId(folder.id)}>
                    <FolderFillIcon className={cn("size-4 shrink-0", color)} />
                    <span className="truncate text-sm font-semibold">{folder.title || "New Folder"}</span>
                    <span className="text-xs text-[#727272]">- {childCountFor(pages, folder.id)} items</span>
                  </button>
                  <button type="button" className="flex size-7 items-center justify-center rounded-md opacity-0 hover:bg-[#e8e8e8] group-hover:opacity-100" onClick={(event) => {
                    const { x, y } = openMenuCoordinates(event);
                    setItemMenu({ itemId: folder.id, x, y });
                  }}>
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        <section className="pl-0">
          <div className="mb-5 text-sm text-[#727272]">{selectedFolder?.title || "Folder"}</div>
          <div className="space-y-0">
            {selectedFolderPages.map((page) => (
              <Link key={page.id} href={`/page/${page.id}`} className="flex h-[41px] items-center gap-2 border-b border-[#d8d8d8] px-2 text-sm">
                <PageIcon className="size-4 shrink-0 text-[#757575]" />
                <span className="font-semibold">{page.title || "Untitled"}</span>
                <span className="text-[#727272]">22 Nov 2025, 7:19 PM</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="min-h-screen bg-white">
        <header className="border-b border-[#d8d8d8] px-4 pt-4">
          <div className="grid h-10 grid-cols-[260px_1fr_280px] items-start gap-4">
            <h1 className="text-2xl font-bold tracking-normal text-[#1f1f1f]">Library</h1>
            <div className="relative mx-auto w-full max-w-[360px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#727272]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search in library" className="h-8 w-full rounded-lg border border-[#d0d0d0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#8e8e93]" />
            </div>
            <div className="flex justify-end gap-2">
              <NewMenu onCreateFolder={() => createFolder()} onCreatePage={() => createAndOpenPage("New page")} onCreateCanvas={() => createAndOpenPage("New canvas")} />
              <div className="flex h-8 items-center rounded-md border border-[#d8d8d8] bg-white p-0.5">
                {[
                  { value: "grid", icon: Grid2X2, label: "Grid" },
                  { value: "list", icon: LayoutList, label: "List" },
                  { value: "split", icon: Table2, label: "Split" },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button key={option.value} type="button" aria-label={option.label} title={option.label} onClick={() => setView(option.value as LibraryView)} className={cn("flex size-7 items-center justify-center rounded text-[#1f1f1f] hover:bg-[#f2f2f2]", view === option.value && "bg-[#eeeeee]")}>
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="More library actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex h-10 items-center justify-between">
            <nav className="flex items-center gap-6 text-sm">
              {[
                { value: "all", label: "All", count: pages.length },
                { value: "folder", label: "Folder", count: folders.length },
                { value: "pages", label: "Pages", count: pageItems.length },
                { value: "canvas", label: "Canvas", count: canvasItems.length },
              ].map((tab) => (
                <button key={tab.value} type="button" onClick={() => setFilter(tab.value as LibraryFilter)} className={cn("flex items-center gap-1.5 text-[#5f6770]", filter === tab.value && "font-semibold text-[#1f1f1f]")}>
                  {tab.label}
                  <CountPill count={tab.count} />
                </button>
              ))}
            </nav>
            <button type="button" className="flex items-center gap-1 text-sm font-semibold text-[#1f1f1f]">
              Recent
              <ChevronDown className="size-4" />
            </button>
          </div>
        </header>

        <main className="px-4 py-4">
          {view === "split" ? renderSplit() : view === "list" ? renderList() : renderGrid()}
        </main>
      </div>

      {itemMenu ? (
        (() => {
          const item = pages.find((page) => page.id === itemMenu.itemId);
          if (!item) return null;
          return (
            <WorkspaceItemContextMenu
              item={item}
              childCount={item.type === "folder" ? childCountFor(pages, item.id) : 0}
              x={itemMenu.x}
              y={itemMenu.y}
              onClose={() => setItemMenu(null)}
            />
          );
        })()
      ) : null}
    </ScrollArea>
  );
}

function SectionGrid({ label, items }: { label: string; items: ReactNode[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div className="text-sm font-medium text-[#727272]">{label}</div>
      <div className="flex flex-wrap gap-4">{items}</div>
    </section>
  );
}

function SectionList({ label, items }: { label: string; items: ReactNode[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div className="text-sm font-medium text-[#727272]">{label}</div>
      <div className="space-y-2">{items}</div>
    </section>
  );
}
