"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { CanvasIcon, FolderLineIcon, PageIcon } from "@/components/NoteliteIcons";
import { NewItemMenu } from "@/components/NewItemMenu";
import { Button } from "@/components/ui/button";
import { WorkspaceItemContextMenu, getFolderColorClasses } from "@/components/FolderContextMenu";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type ItemMenuState = {
  itemId: string;
  x: number;
  y: number;
} | null;

const SIDEBAR_ITEM_LIMIT = 8;

function isCanvasPage(page: Page) {
  const canvas = page.canvas as { elements?: unknown[] } | undefined;
  return page.type === "page" && (Boolean(canvas?.elements?.length) || page.title.toLowerCase().includes("canvas"));
}

function itemHref(item: Page) {
  return item.type === "folder" ? `/library?view=list&folder=${item.id}` : `/page/${item.id}`;
}

function SidebarItemIcon({ item }: { item: Page }) {
  if (item.type === "folder") {
    return <FolderLineIcon className={cn("size-4 shrink-0", getFolderColorClasses(item.folderColor).icon)} />;
  }

  if (isCanvasPage(item)) {
    return <CanvasIcon className="size-4 shrink-0 text-[#1a1a1a]" />;
  }

  return <PageIcon className="size-4 shrink-0 text-[#1a1a1a]" />;
}

function SidebarItemRow({
  item,
  isActive,
  onOpenItemMenu,
  onDropItem,
}: {
  item: Page;
  isActive: boolean;
  onOpenItemMenu: (itemId: string, x: number, y: number) => void;
  onDropItem: (activeId: string, overId: string) => void;
}) {
  function openMenuFromButton(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    onOpenItemMenu(item.id, rect.left, rect.bottom + 6);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const activeId = event.dataTransfer.getData("text/plain");
    if (activeId) {
      onDropItem(activeId, item.id);
    }
  }

  return (
    <div
      className={cn(
        "group flex h-[25px] items-center gap-2 rounded-lg px-2 text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2]",
        isActive && "bg-[#e6e6e6]",
      )}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenItemMenu(item.id, event.clientX, event.clientY);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span
        draggable
        aria-label={`Drag ${item.title || "item"}`}
        role="button"
        tabIndex={0}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex size-4 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
      >
        <SidebarItemIcon item={item} />
      </span>
      <Link href={itemHref(item)} className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-semibold">
          {item.title.trim() || (item.type === "folder" ? "New Folder" : isCanvasPage(item) ? "Canvas" : "Untitled")}
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Open ${item.title || "item"} actions`}
        onClick={openMenuFromButton}
        onContextMenu={openMenuFromButton}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#1a1a1a] opacity-0 transition-opacity hover:bg-white group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}

function SidebarSection({
  title,
  items,
  moreHref,
  pathname,
  onOpenItemMenu,
  onDropItem,
}: {
  title: string;
  items: Page[];
  moreHref: string;
  pathname: string | null;
  onOpenItemMenu: (itemId: string, x: number, y: number) => void;
  onDropItem: (activeId: string, overId: string) => void;
}) {
  const visibleItems = items.slice(0, SIDEBAR_ITEM_LIMIT);

  return (
    <section className="space-y-1">
      <h2 className="px-2 text-sm font-semibold text-[#727272]">{title}</h2>
      <nav className="space-y-0">
        {visibleItems.map((item) => (
          <SidebarItemRow
            key={item.id}
            item={item}
            isActive={item.type === "page" && pathname === `/page/${item.id}`}
            onOpenItemMenu={onOpenItemMenu}
            onDropItem={onDropItem}
          />
        ))}
      </nav>
      {items.length > SIDEBAR_ITEM_LIMIT ? (
        <Link href={moreHref} className="flex h-[25px] items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#0d6fff] hover:bg-[#eef4ff]">
          <MoreHorizontal className="size-4" />
          More
        </Link>
      ) : null}
    </section>
  );
}

export function Sidebar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    pages,
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    createWorkspace,
    switchWorkspace,
    createFolder,
    createPage,
    movePage,
  } = useNotionStore();
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemMenuState>(null);
  const displayedWorkspace = activeWorkspace ?? workspaces[0] ?? {
    id: "workspace-main",
    name: "My workspace",
    initials: "MW",
    pages: [],
    databases: [],
  };
  const recentItems = useMemo(() => pages, [pages]);
  const favoriteItems = useMemo(() => pages.filter((page) => page.isFavorite), [pages]);
  const handleWorkspaceOutsideClick = useCallback(() => {
    setIsWorkspaceMenuOpen(false);
  }, []);

  useClickOutside(workspaceMenuRef, handleWorkspaceOutsideClick, isWorkspaceMenuOpen);

  function handleCreateWorkspace() {
    const name = window.prompt("Workspace name", "New workspace");
    if (name === null) {
      return;
    }

    createWorkspace(name);
    setItemMenu(null);
    setIsWorkspaceMenuOpen(false);
    router.push("/dashboard");
  }

  function handleSwitchWorkspace(workspaceId: string) {
    switchWorkspace(workspaceId);
    setItemMenu(null);
    setIsWorkspaceMenuOpen(false);
    router.push("/dashboard");
  }

  function handleNewPage() {
    const page = createPage(null, "New page");
    router.push(`/page/${page.id}`);
  }

  function handleNewFolder() {
    createFolder();
  }

  function handleNewCanvas() {
    const page = createPage(null, "New canvas");
    router.push(`/page/${page.id}`);
  }

  function handleSidebarDrop(activeId: string, overId: string) {
    if (activeId === overId) {
      return;
    }

    const overItem = pages.find((page) => page.id === overId);
    if (!overItem) {
      return;
    }

    if (overItem.type === "folder") {
      movePage(activeId, overItem.id);
      return;
    }

    movePage(activeId, overItem.parentId, overItem.id);
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[#d9d9d9] bg-[#f7f7f7] text-[#1a1a1a] transition-[width]",
        isSidebarCollapsed ? "w-12" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center gap-2 border-b border-[#d9d9d9] px-3",
          isSidebarCollapsed && "justify-center px-2",
        )}
      >
        {isSidebarCollapsed ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Open sidebar"
            onClick={() => setIsSidebarCollapsed(false)}
          >
            <ChevronsRight className="size-4 text-[#1a1a1a]" />
          </Button>
        ) : (
          <>
            <div ref={workspaceMenuRef} className="relative min-w-0 flex-1">
              <button
                type="button"
                aria-expanded={isWorkspaceMenuOpen}
                className="flex h-8 min-w-0 items-center gap-2 rounded-lg text-left"
                onClick={() => setIsWorkspaceMenuOpen((isOpen) => !isOpen)}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6e6e6] text-[10px] font-semibold text-black">
                  {displayedWorkspace.initials}
                </span>
                <span className="truncate text-sm font-bold">{displayedWorkspace.name}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-[#1a1a1a] transition-transform",
                    isWorkspaceMenuOpen && "rotate-180",
                  )}
                />
              </button>

              {isWorkspaceMenuOpen ? (
                <div className="absolute left-0 top-10 z-50 w-64 rounded-lg border border-[#d9d9d9] bg-white p-1.5 shadow-lg">
                  <div className="px-2 py-1.5 text-xs font-semibold text-[#727272]">Workspaces</div>
                  <div className="space-y-0.5">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        className={cn(
                          "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-[#f2f2f2]",
                          workspace.id === activeWorkspaceId && "bg-[#e6e6e6]",
                        )}
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ededed] text-[9px] font-semibold text-black">
                          {workspace.initials}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 border-t border-[#e6e6e6] pt-1">
                    <button
                      type="button"
                      className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium hover:bg-[#f2f2f2]"
                      onClick={handleCreateWorkspace}
                    >
                      <span className="text-lg leading-none">+</span>
                      <span className="truncate">Create workspace</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Collapse sidebar"
              onClick={() => setIsSidebarCollapsed(true)}
            >
              <ChevronsLeft className="size-4 text-[#1a1a1a]" />
            </Button>
          </>
        )}
      </div>

      {isSidebarCollapsed ? null : (
        <>
          <div className="space-y-3 px-3 py-4">
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start rounded-lg border border-[#d9d9d9] bg-white px-2 text-sm font-normal text-[#8e8e93] shadow-[inset_0_1px_0_rgba(31,35,40,0.04)] hover:bg-white"
              onClick={onOpenSearch}
            >
              <Search className="size-4 text-[#59636e]" />
              <span className="min-w-0 flex-1 truncate text-left">Search anything...</span>
              <span className="rounded-md border border-[#d9d9d9] bg-white px-1.5 py-0.5 text-xs font-semibold text-[#1a1a1a]">
                ⌘ K
              </span>
            </Button>

            <NewItemMenu
              align="left"
              className="w-full"
              buttonClassName="h-8 w-full justify-center rounded-md bg-black text-sm font-semibold text-white hover:bg-black/85"
              onCreateFolder={handleNewFolder}
              onCreatePage={handleNewPage}
              onCreateCanvas={handleNewCanvas}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pb-4">
            <SidebarSection
              title="Recent"
              items={recentItems}
              moreHref="/library?view=list&section=recent"
              pathname={pathname}
              onOpenItemMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
              onDropItem={handleSidebarDrop}
            />
            <SidebarSection
              title="Favorites"
              items={favoriteItems}
              moreHref="/library?view=list&section=favorites"
              pathname={pathname}
              onOpenItemMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
              onDropItem={handleSidebarDrop}
            />
          </div>

          <div className="space-y-0.5 px-2 pb-3">
            <Link
              href="/library"
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#f2f2f2]",
                pathname === "/library" && "bg-[#e6e6e6]",
              )}
            >
              <FolderLineIcon className="size-4 text-[#1a1a1a]" />
              <span className="truncate">Library</span>
            </Link>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold text-[#1a1a1a] hover:bg-[#f2f2f2]"
            >
              <Trash2 className="size-4 text-[#1a1a1a]" />
              <span className="truncate">Trash</span>
            </button>
          </div>

          <div className="flex h-12 items-center border-t border-[#d9d9d9] px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6e6e6] text-[10px] font-semibold text-black">
                UN
              </span>
              <span className="truncate text-sm font-bold">You</span>
            </div>
          </div>
        </>
      )}

      {itemMenu ? (
        (() => {
          const item = pages.find((page) => page.id === itemMenu.itemId);
          if (!item) {
            return null;
          }

          return (
            <WorkspaceItemContextMenu
              item={item}
              childCount={item.type === "folder" ? pages.filter((page) => page.parentId === item.id).length : 0}
              x={itemMenu.x}
              y={itemMenu.y}
              onClose={() => setItemMenu(null)}
            />
          );
        })()
      ) : null}
    </aside>
  );
}
