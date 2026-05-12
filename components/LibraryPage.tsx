"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Grid2X2, LayoutList, MoreHorizontal, Search, Table2 } from "lucide-react";

import { CanvasIcon, FolderListIcon, PageIcon } from "@/components/NoteliteIcons";
import { NewItemMenu } from "@/components/NewItemMenu";
import { PageHead } from "@/components/PageHead";
import { WorkspaceItemContextMenu } from "@/components/FolderContextMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLibraryCardPreview } from "@/lib/library-card-preview";
import type { FolderColor } from "@/lib/folder-utils";
import { getFolderColorOption } from "@/lib/folder-utils";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { sortWorkspaceItems, type WorkspaceSortOption } from "@/lib/workspace-items";
import { cn } from "@/lib/utils";
import { isCanvasPage } from "@/lib/workspace-tree";

type LibraryFilter = "all" | "folder" | "pages" | "canvas";
type LibrarySection = "all" | "recent" | "favorites" | "trash";
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
          <FolderListIcon childCount={childCount} folderColor={folder.folderColor} className="size-6 shrink-0" />
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
      <Link
        href={`/page/${folder.id}`}
        className="notelite-folder-card"
        data-folder-color={folder.folderColor ?? "neutral"}
        data-folder-state={childCount > 0 ? "full" : "empty"}
      >
        {childCount > 0 ? (
          <>
            <span className="notelite-folder-card__sheet notelite-folder-card__sheet--back" aria-hidden="true" />
            <span className="notelite-folder-card__sheet notelite-folder-card__sheet--front" aria-hidden="true" />
          </>
        ) : null}
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
  const preview = getLibraryCardPreview(item.content);
  const body = preview.body;

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
            <span className="block truncate text-xs text-[#727272]">{body || "No description"}</span>
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
      <Link
        href={`/page/${item.id}`}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2",
          preview.contentAlignment === "between" ? "justify-between" : "justify-end",
        )}
      >
        <Icon className="size-8 text-[#757575]" />
        <span className="min-w-0 overflow-hidden">
          <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{item.title || (kind === "canvas" ? "Canvas" : "Untitled")}</span>
          {preview.hasDescription ? (
            <span className="line-clamp-3 text-xs leading-4 text-[#727272]">{body}</span>
          ) : null}
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
  const searchParams = useSearchParams();
  const { pages, createFolder, createPage } = useNotionStore();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [section, setSection] = useState<LibrarySection>("all");
  const [view, setView] = useState<LibraryView>("grid");
  const [sort, setSort] = useState<WorkspaceSortOption>("recent");
  const [query, setQuery] = useState("");
  const [itemMenu, setItemMenu] = useState<ItemMenuState>(null);
  const folders = useMemo(() => pages.filter((page) => page.type === "folder"), [pages]);
  const documentItems = useMemo(() => pages.filter((page) => page.type === "page"), [pages]);
  const canvasItems = useMemo(() => pages.filter(isCanvasPage), [pages]);
  const pageItems = useMemo(
    () => pages.filter((page) => page.type === "page" && !isCanvasPage(page)),
    [pages],
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folders[0]?.id ?? null);

  useEffect(() => {
    const nextView = searchParams.get("view");
    const nextSection = searchParams.get("section");

    if (nextView === "grid" || nextView === "list" || nextView === "split") {
      setView(nextView);
    }

    if (nextSection === "recent" || nextSection === "favorites" || nextSection === "trash") {
      setSection(nextSection);
      setFilter("all");
      setView("list");
    } else {
      setSection("all");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedFolderId || !folders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(folders[0]?.id ?? null);
    }
  }, [folders, selectedFolderId]);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = (page: Page) =>
    `${page.title} ${getPlainText(page.content)}`.toLowerCase().includes(normalizedQuery);
  const visibleFolders = useMemo(
    () => sortWorkspaceItems(normalizedQuery ? folders.filter(matches) : folders, sort),
    [folders, normalizedQuery, sort],
  );
  const visiblePages = useMemo(
    () => sortWorkspaceItems(normalizedQuery ? pageItems.filter(matches) : pageItems, sort),
    [normalizedQuery, pageItems, sort],
  );
  const visibleCanvases = useMemo(
    () => sortWorkspaceItems(normalizedQuery ? canvasItems.filter(matches) : canvasItems, sort),
    [canvasItems, normalizedQuery, sort],
  );
  const visibleRecentItems = useMemo(
    () => sortWorkspaceItems(normalizedQuery ? documentItems.filter(matches) : documentItems, sort),
    [documentItems, normalizedQuery, sort],
  );
  const visibleFavoriteItems = useMemo(
    () => sortWorkspaceItems(
      (normalizedQuery ? pages.filter(matches) : pages).filter((page) => page.isFavorite),
      sort,
    ),
    [normalizedQuery, pages, sort],
  );
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? folders[0];
  const selectedFolderPages = sortWorkspaceItems(
    pages.filter((page) => selectedFolder && page.parentId === selectedFolder.id && page.type === "page"),
    sort,
  );

  function createAndOpenPage(title: string) {
    const page = createPage(null, title);
    router.push(`/page/${page.id}`);
  }

  function handleCreateFolder(name: string, folderColor: FolderColor, parentId: string | null) {
    const folder = createFolder(parentId, name, folderColor);
    router.push(`/page/${folder.id}`);
  }

  function renderItemRow(item: Page) {
    if (item.type === "folder") {
      return <FolderTile key={item.id} folder={item} pages={pages} view="row" onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })} />;
    }

    return (
      <ItemCard
        key={item.id}
        item={item}
        pages={pages}
        kind={isCanvasPage(item) ? "canvas" : "page"}
        view="row"
        onOpenMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
      />
    );
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
    if (section === "recent") {
      return <SectionList label="Recent" items={visibleRecentItems.map(renderItemRow)} />;
    }

    if (section === "favorites") {
      return <SectionList label="Favorites" items={visibleFavoriteItems.map(renderItemRow)} />;
    }

    if (section === "trash") {
      return <SectionList label="Trash" items={[]} emptyLabel="Trash is empty" />;
    }

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
              const color = getFolderColorOption(folder.folderColor);
              const childCount = childCountFor(pages, folder.id);
              return (
                <div key={folder.id} className={cn("group flex h-[41px] items-center border-b border-[#d8d8d8] px-2", isSelected && "bg-[#f2f2f2]")}>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSelectedFolderId(folder.id)}>
                    <FolderListIcon childCount={childCount} folderColor={folder.folderColor} className={cn("size-4 shrink-0", color.icon)} />
                    <span className="truncate text-sm font-semibold">{folder.title || "New Folder"}</span>
                    <span className="text-xs text-[#727272]">- {childCount} items</span>
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
        <div>
          <PageHead
            title="Library"
            breadcrumbs={[]}
            breadcrumbCurrentLabel="Library"
            secondaryActions={
              <div className="relative hidden w-[260px] sm:block">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#727272]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search in library"
                  className="h-7 w-full rounded-md border border-[#d9d9d9] bg-white pl-8 pr-2 text-sm outline-none shadow-[inset_0_1px_0_rgba(31,35,40,0.04)] focus:border-[#8e8e93]"
                />
              </div>
            }
            addControl={
              <NewItemMenu
                label="Add"
                align="right"
                buttonClassName="h-7 rounded-md border border-[#2c2c2c] bg-[#2c2c2c] px-2 text-xs font-semibold text-[#f3f3f3] shadow-[0_1px_0_rgba(31,35,40,0.04)] hover:bg-[#1f1f1f]"
                onCreateFolder={handleCreateFolder}
                onCreatePage={() => createAndOpenPage("New page")}
                onCreateCanvas={() => createAndOpenPage("New canvas")}
              />
            }
            onOpenMore={() => {}}
          />
        </div>
        <header className="border-b border-[#d8d8d8] px-4">
          <div className="flex h-10 items-center justify-between">
            <nav className="flex items-center gap-6 text-sm">
              {[
                { value: "all", label: "All", count: pages.length },
                { value: "folder", label: "Folder", count: folders.length },
                { value: "pages", label: "Pages", count: pageItems.length },
                { value: "canvas", label: "Canvas", count: canvasItems.length },
              ].map((tab) => (
                <button key={tab.value} type="button" onClick={() => { setFilter(tab.value as LibraryFilter); setSection("all"); }} className={cn("flex items-center gap-1.5 text-[#5f6770]", section === "all" && filter === tab.value && "font-semibold text-[#1f1f1f]")}>
                  {tab.label}
                  <CountPill count={tab.count} />
                </button>
              ))}
              <button type="button" onClick={() => { setSection("favorites"); setView("list"); setFilter("all"); }} className={cn("flex items-center gap-1.5 text-[#5f6770]", section === "favorites" && "font-semibold text-[#1f1f1f]")}>
                Favorites
                <CountPill count={visibleFavoriteItems.length} />
              </button>
            </nav>
            <div className="flex items-center gap-2">
              <div className="flex h-8 items-center rounded-md border border-[#d8d8d8] bg-white p-0.5">
                {[
                  { value: "grid", icon: Grid2X2, label: "Grid" },
                  { value: "list", icon: LayoutList, label: "List" },
                  { value: "split", icon: Table2, label: "Split" },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setView(option.value as LibraryView)}
                      className={cn("flex size-7 items-center justify-center rounded text-[#1f1f1f] hover:bg-[#f2f2f2]", view === option.value && "bg-[#eeeeee]")}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 rounded-md border border-[#d8d8d8] bg-white px-2">
                <ChevronDown className="size-4 text-[#727272]" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as WorkspaceSortOption)}
                  className="h-8 bg-transparent text-sm font-semibold text-[#1f1f1f] outline-none"
                >
                  <option value="recent">Recent</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="kind">Type</option>
                </select>
              </div>
            </div>
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

function SectionList({ label, items, emptyLabel }: { label: string; items: ReactNode[]; emptyLabel?: string }) {
  if (!items.length && !emptyLabel) return null;
  return (
    <section className="space-y-3">
      <div className="text-sm font-medium text-[#727272]">{label}</div>
      {items.length ? (
        <div className="space-y-2">{items}</div>
      ) : (
        <div className="rounded-lg border border-[#d8d8d8] bg-white px-3 py-6 text-sm text-[#727272]">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
