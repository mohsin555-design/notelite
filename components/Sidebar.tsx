"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  LogOut,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CanvasIcon, CaretDownIcon, FolderListIcon, HomeIcon, LibraryIcon, MoreIcon, PageIcon } from "@/components/NoteliteIcons";
import { NewItemMenu } from "@/components/NewItemMenu";
import { Button } from "@/components/ui/button";
import { WorkspaceItemContextMenu } from "@/components/FolderContextMenu";
import type { FolderColor } from "@/lib/folder-utils";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";
import { isCanvasPage } from "@/lib/workspace-tree";

type ItemMenuState = {
  itemId: string;
  x: number;
  y: number;
} | null;
type SidebarSectionKind = "recent" | "favorites";
type DropPosition = "before" | "after";
type DragIndicatorState = {
  itemId: string;
  position: DropPosition;
} | null;

const SIDEBAR_ITEM_LIMIT = 8;

function itemHref(item: Page) {
  return `/page/${item.id}`;
}

function SidebarItemIcon({ item, childCount }: { item: Page; childCount: number }) {
  if (item.type === "folder") {
    return <FolderListIcon childCount={childCount} folderColor={item.folderColor} className="size-4 shrink-0" />;
  }

  if (isCanvasPage(item)) {
    return <CanvasIcon className="size-4 shrink-0 text-[#1a1a1a]" />;
  }

  return <PageIcon className="size-4 shrink-0 text-[#1a1a1a]" />;
}

function SidebarItemRow({
  item,
  isActive,
  section,
  childCount,
  dropPosition,
  onOpenItemMenu,
  onDragOverItem,
  onClearDragIndicator,
  onDropItem,
}: {
  item: Page;
  isActive: boolean;
  section: SidebarSectionKind;
  childCount: number;
  dropPosition: DropPosition | null;
  onOpenItemMenu: (itemId: string, x: number, y: number) => void;
  onDragOverItem: (itemId: string, position: DropPosition) => void;
  onClearDragIndicator: () => void;
  onDropItem: (activeId: string, overId: string, targetSection: SidebarSectionKind, sourceSection: SidebarSectionKind | null, position: DropPosition) => void;
}) {
  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.setData("application/notelite-sidebar-section", section);
  }

  function openMenuFromButton(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    onOpenItemMenu(item.id, rect.left, rect.bottom + 6);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    onDragOverItem(item.id, position);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const activeId = event.dataTransfer.getData("text/plain");
    const sourceSection = event.dataTransfer.getData("application/notelite-sidebar-section") as SidebarSectionKind | "";
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    onClearDragIndicator();
    if (activeId) {
      onDropItem(activeId, item.id, section, sourceSection || null, position);
    }
  }

  return (
    <div
      draggable
      className={cn(
        "group relative flex h-6 items-center gap-2 rounded-lg px-2 text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2] active:cursor-grabbing",
        isActive && "bg-white",
      )}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenItemMenu(item.id, event.clientX, event.clientY);
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onClearDragIndicator}
      onDrop={handleDrop}
    >
      {dropPosition ? (
        <span
          className={cn(
            "pointer-events-none absolute left-2 right-2 z-10 h-0.5 rounded-full bg-[#0062ff]",
            dropPosition === "before" ? "-top-0.5" : "-bottom-0.5",
          )}
        />
      ) : null}
      <span
        aria-label={`Drag ${item.title || "item"}`}
        className="flex size-4 shrink-0 touch-none cursor-grab items-center justify-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <GripVertical className="size-4 text-[#757575]" />
      </span>
      <Link href={itemHref(item)} className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarItemIcon item={item} childCount={childCount} />
        <span className="truncate text-[14px] font-medium leading-[normal]">
          {item.title.trim() || (item.type === "folder" ? "New Folder" : isCanvasPage(item) ? "Canvas" : "Untitled")}
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Open ${item.title || "item"} actions`}
        onClick={openMenuFromButton}
        onContextMenu={openMenuFromButton}
        className="flex size-5 shrink-0 items-center justify-center rounded-md text-[#1a1a1a] opacity-0 transition-opacity hover:bg-[#f2f2f2] group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <MoreIcon className="size-4 text-[#1e1e1e]" />
      </button>
    </div>
  );
}

function SidebarSection({
  title,
  items,
  pages,
  section,
  moreHref,
  pathname,
  activeFolderId,
  onOpenItemMenu,
  onDropItem,
  onDropToSection,
}: {
  title: string;
  items: Page[];
  pages: Page[];
  section: SidebarSectionKind;
  moreHref: string;
  pathname: string | null;
  activeFolderId: string | null;
  onOpenItemMenu: (itemId: string, x: number, y: number) => void;
  onDropItem: (activeId: string, overId: string, targetSection: SidebarSectionKind, sourceSection: SidebarSectionKind | null, position: DropPosition) => void;
  onDropToSection: (activeId: string, targetSection: SidebarSectionKind, sourceSection: SidebarSectionKind | null) => void;
}) {
  const visibleItems = items.slice(0, SIDEBAR_ITEM_LIMIT);
  const hasMore = items.length > SIDEBAR_ITEM_LIMIT;
  const [dragIndicator, setDragIndicator] = useState<DragIndicatorState>(null);

  function handleSectionDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleSectionDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragIndicator(null);
    const activeId = event.dataTransfer.getData("text/plain");
    const sourceSection = event.dataTransfer.getData("application/notelite-sidebar-section") as SidebarSectionKind | "";
    if (activeId) {
      onDropToSection(activeId, section, sourceSection || null);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="px-4 text-[12px] font-medium leading-[normal] text-[#757575]">{title}</h2>
      <nav className="min-h-7 space-y-0.5 px-2" onDragOver={handleSectionDragOver} onDrop={handleSectionDrop}>
        {visibleItems.map((item) => (
          <SidebarItemRow
            key={item.id}
            item={item}
            childCount={pages.filter((page) => page.parentId === item.id).length}
            section={section}
            dropPosition={dragIndicator?.itemId === item.id ? dragIndicator.position : null}
            isActive={pathname === `/page/${item.id}` || (item.type === "folder" && activeFolderId === item.id)}
            onOpenItemMenu={onOpenItemMenu}
            onDragOverItem={(itemId, position) => setDragIndicator({ itemId, position })}
            onClearDragIndicator={() => setDragIndicator(null)}
            onDropItem={onDropItem}
          />
        ))}
        {hasMore ? (
          <Link href={moreHref} className="flex h-6 items-center gap-2 rounded-lg px-2 text-[14px] font-medium text-[#0062ff] hover:bg-[#f2f2f2]">
            <MoreIcon className="size-4" />
            More
          </Link>
        ) : null}
      </nav>
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
    togglePageFavorite,
  } = useNotionStore();
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemMenuState>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const displayedWorkspace = activeWorkspace ?? workspaces[0] ?? {
    id: "workspace-main",
    name: "My workspace",
    initials: "MW",
    pages: [],
    databases: [],
  };
  const documentItems = useMemo(() => pages.filter((page) => page.type === "page"), [pages]);
  const recentItems = useMemo(() => documentItems, [documentItems]);
  const favoriteItems = useMemo(() => pages.filter((page) => page.isFavorite), [pages]);
  const handleWorkspaceOutsideClick = useCallback(() => {
    setIsWorkspaceMenuOpen(false);
  }, []);
  const handleUserOutsideClick = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  useClickOutside(workspaceMenuRef, handleWorkspaceOutsideClick, isWorkspaceMenuOpen);
  useClickOutside(userMenuRef, handleUserOutsideClick, isUserMenuOpen);

  useEffect(() => {
    function syncActiveFolder() {
      setActiveFolderId(new URLSearchParams(window.location.search).get("folder"));
    }

    syncActiveFolder();
    window.addEventListener("popstate", syncActiveFolder);

    return () => window.removeEventListener("popstate", syncActiveFolder);
  }, [pathname]);

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

  function handleNewFolder(name: string, folderColor: FolderColor, parentId: string | null) {
    const folder = createFolder(parentId, name, folderColor);
    router.push(`/page/${folder.id}`);
  }

  function handleNewCanvas() {
    const page = createPage(null, "New canvas");
    router.push(`/page/${page.id}`);
  }

  function handleNavigateHome() {
    router.push("/dashboard");
  }

  function handleNavigateLibrary() {
    router.push("/library");
  }

  function handleOpenSettings() {
    setIsUserMenuOpen(false);
    router.push("/dashboard?settings=account");
  }

  function handleLogout() {
    setIsUserMenuOpen(false);
  }

  function syncDraggedItemSection(activeId: string, targetSection: SidebarSectionKind, sourceSection: SidebarSectionKind | null) {
    if (!sourceSection || sourceSection === targetSection) {
      return;
    }

    const activeItem = pages.find((page) => page.id === activeId);
    if (!activeItem) {
      return;
    }

    if (targetSection === "favorites" && !activeItem.isFavorite) {
      togglePageFavorite(activeId);
    }

    if (targetSection === "recent" && activeItem.isFavorite) {
      togglePageFavorite(activeId);
    }
  }

  function handleSidebarDrop(
    activeId: string,
    overId: string,
    targetSection: SidebarSectionKind,
    sourceSection: SidebarSectionKind | null,
    position: DropPosition,
  ) {
    syncDraggedItemSection(activeId, targetSection, sourceSection);

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
    if (position === "after") {
      movePage(overItem.id, overItem.parentId, activeId);
    }
  }

  function handleSectionDrop(
    activeId: string,
    targetSection: SidebarSectionKind,
    sourceSection: SidebarSectionKind | null,
  ) {
    syncDraggedItemSection(activeId, targetSection, sourceSection);
  }

  const isHomeActive = pathname === "/dashboard";
  const isLibraryActive = pathname?.startsWith("/library") ?? false;

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[#e2e6eb] bg-[#f7f8fa] text-[#1a1a1a] transition-[width]",
        isSidebarCollapsed ? "w-12" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center gap-2 border-b border-[#e2e6eb] px-3",
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-medium text-[#0062ff]">
                  {displayedWorkspace.initials}
                </span>
                <span className="truncate text-[14px] font-medium">{displayedWorkspace.name}</span>
                <CaretDownIcon
                  className={cn(
                    "size-4 shrink-0 text-[#1e1e1e] transition-transform",
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
          <div className="px-3 pt-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Home"
                onClick={handleNavigateHome}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[36px] border text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2]",
                  isHomeActive
                    ? "border-[#d9d9d9] bg-white shadow-[0_1px_0_rgba(31,35,40,0.04)]"
                    : "border-transparent bg-transparent",
                )}
              >
                <HomeIcon className="size-4 shrink-0" />
              </button>
              <button
                type="button"
                aria-label="Library"
                onClick={handleNavigateLibrary}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[36px] border text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2]",
                  isLibraryActive
                    ? "border-[#d9d9d9] bg-white shadow-[0_1px_0_rgba(31,35,40,0.04)]"
                    : "border-transparent bg-transparent",
                )}
              >
                <LibraryIcon className="size-4 shrink-0" />
              </button>
              <button
                type="button"
                aria-label="Search"
                onClick={onOpenSearch}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-[36px] text-[#1a1a1a] transition-colors hover:bg-[#f2f2f2]"
              >
                <Search className="size-4 shrink-0" />
              </button>
              <NewItemMenu
                align="left"
                label=""
                className="shrink-0"
                buttonClassName="h-8 w-8 rounded-full bg-[#0062ff] p-0 text-white hover:bg-[#0052d4] [&>svg]:mr-0"
                onCreateFolder={handleNewFolder}
                onCreatePage={handleNewPage}
                onCreateCanvas={handleNewCanvas}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pt-4">
            <SidebarSection
              title="Recent"
              section="recent"
              items={recentItems}
              pages={pages}
              moreHref="/library?view=list&section=recent"
              pathname={pathname}
              activeFolderId={activeFolderId}
              onOpenItemMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
              onDropItem={handleSidebarDrop}
              onDropToSection={handleSectionDrop}
            />
            <SidebarSection
              title="Favorites"
              section="favorites"
              items={favoriteItems}
              pages={pages}
              moreHref="/library?view=list&section=favorites"
              pathname={pathname}
              activeFolderId={activeFolderId}
              onOpenItemMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
              onDropItem={handleSidebarDrop}
              onDropToSection={handleSectionDrop}
            />
          </div>

          <div className="px-2 pb-4">
            <button
              type="button"
              onClick={() => router.push("/library?view=list&section=trash")}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[14px] font-medium text-[#1a1a1a] hover:bg-[#f2f2f2]"
            >
              <Trash2 className="size-4 shrink-0 text-[#1a1a1a]" />
              <span className="truncate">Trash</span>
            </button>
          </div>

          <div ref={userMenuRef} className="relative border-t border-[#d9d9d9] px-2 py-2">
            {isUserMenuOpen ? (
              <div className="absolute bottom-14 left-2 z-50 w-[calc(100%-16px)] rounded-lg border border-[#d9d9d9] bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-[#1a1a1a] hover:bg-[#f2f2f2]"
                  onClick={handleOpenSettings}
                >
                  <Settings className="size-4 shrink-0" />
                  <span className="truncate">Settings</span>
                </button>
                <button
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-[#1a1a1a] hover:bg-[#f2f2f2]"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className="truncate">Logout</span>
                </button>
              </div>
            ) : null}
            <button
              type="button"
              aria-expanded={isUserMenuOpen}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-1 text-left hover:bg-[#f2f2f2]"
              onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-medium text-[#0062ff]">
                {displayedWorkspace.initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">Mohsin ali sayyed</span>
              <CaretDownIcon className={cn("size-4 shrink-0 text-[#1e1e1e] transition-transform", isUserMenuOpen && "rotate-180")} />
            </button>
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
