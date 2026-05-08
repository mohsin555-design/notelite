"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { FolderLineIcon, PageIcon } from "@/components/NoteliteIcons";
import { Button } from "@/components/ui/button";
import { WorkspaceItemContextMenu, getFolderColorClasses } from "@/components/FolderContextMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Page } from "@/lib/notion-types";
import { cn } from "@/lib/utils";
import { useNotionStore } from "@/lib/notion-store";

type VisibleItem = Page & {
  depth: number;
  childCount: number;
};
type ItemMenuState = {
  itemId: string;
  x: number;
  y: number;
} | null;

function buildVisibleTree(
  pages: Page[],
  collapsedFolderIds: Set<string>,
  parentId: string | null = null,
  depth = 0,
): VisibleItem[] {
  return pages
    .filter((page) => page.parentId === parentId)
    .flatMap((page) => {
      const children = pages.filter((candidate) => candidate.parentId === page.id);
      const item = { ...page, depth, childCount: children.length };

      if (page.type !== "folder" || collapsedFolderIds.has(page.id)) {
        return [item];
      }

      return [
        item,
        ...buildVisibleTree(pages, collapsedFolderIds, page.id, depth + 1),
      ];
    });
}

function SortableTreeItem({
  item,
  href,
  isActive,
  isCollapsed,
  onToggleFolder,
  onOpenItemMenu,
}: {
  item: VisibleItem;
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
  onToggleFolder: (folderId: string) => void;
  onOpenItemMenu: (itemId: string, x: number, y: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function openMenuFromButton(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    onOpenItemMenu(item.id, rect.left, rect.bottom + 6);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group flex items-center gap-1 rounded-lg", isDragging && "opacity-60")}
    >
      <button
        type="button"
        aria-label={`Drag ${item.title}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      <div className="min-w-0 flex-1" style={{ paddingLeft: item.depth * 12 }}>
        {item.type === "folder" ? (
          <div
            onContextMenu={(event) => {
              event.preventDefault();
              onOpenItemMenu(item.id, event.clientX, event.clientY);
            }}
            className={cn(
              "flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-sidebar-foreground hover:bg-muted",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => onToggleFolder(item.id)}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <FolderLineIcon className={cn("size-4 shrink-0", getFolderColorClasses(item.folderColor).icon)} />
              <span className="truncate">{item.title.trim() || "New Folder"}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {item.childCount || ""}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Open ${item.title || "folder"} actions`}
              onClick={openMenuFromButton}
              onContextMenu={openMenuFromButton}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        ) : (
          <div
            onContextMenu={(event) => {
              event.preventDefault();
              onOpenItemMenu(item.id, event.clientX, event.clientY);
            }}
            className={cn(
              "flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-sm text-sidebar-foreground hover:bg-muted",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Link href={href} className="flex min-w-0 flex-1 items-center gap-1.5">
              <PageIcon className="size-4 shrink-0 text-[#757575]" />
              <span className="truncate">{item.title.trim() || "Untitled"}</span>
            </Link>
            <button
              type="button"
              aria-label={`Open ${item.title || "page"} actions`}
              onClick={openMenuFromButton}
              onContextMenu={openMenuFromButton}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pages, createPage, movePage } = useNotionStore();
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [itemMenu, setItemMenu] = useState<ItemMenuState>(null);
  const visibleItems = useMemo(
    () => buildVisibleTree(pages, collapsedFolderIds),
    [collapsedFolderIds, pages],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function handleCreatePage() {
    const page = createPage();
    router.push(`/page/${page.id}`);
  }

  function handleToggleFolder(folderId: string) {
    setCollapsedFolderIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(folderId)) {
        nextIds.delete(folderId);
      } else {
        nextIds.add(folderId);
      }
      return nextIds;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!overId || activeId === overId) {
      return;
    }

    const overPage = pages.find((page) => page.id === overId);
    if (!overPage) {
      return;
    }

    if (overPage.type === "folder") {
      movePage(activeId, overPage.id);
      setCollapsedFolderIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(overPage.id);
        return nextIds;
      });
      return;
    }

    movePage(activeId, overPage.parentId, overPage.id);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[#d9d9d9] bg-[#f7f7f7] text-[#1a1a1a]">
      <div className="flex h-12 items-center gap-2 border-b border-[#d9d9d9] px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 rounded-lg py-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6e6e6] text-[10px] font-medium text-black">
              MW
            </span>
            <span className="truncate text-sm font-semibold">My workspace</span>
            <ChevronDown className="size-4 shrink-0 text-[#727272]" />
          </Link>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Collapse sidebar">
          <ChevronsLeft className="size-4 text-[#727272]" />
        </Button>
      </div>

      <div className="space-y-2.5 px-3 py-3">
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start rounded-lg border border-[#d9d9d9] bg-white px-2 text-xs font-normal text-[#8e8e93] hover:bg-white"
            onClick={onOpenSearch}
          >
            <Search className="size-4 text-[#727272]" />
            <span className="min-w-0 flex-1 truncate text-left">Search anything...</span>
            <span className="rounded border border-[#d9d9d9] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#1a1a1a]">
              ⌘ K
            </span>
          </Button>
        </div>
        <Button
          type="button"
          className="h-8 w-full justify-center rounded-md bg-black text-xs font-semibold text-white hover:bg-black/85"
          onClick={handleCreatePage}
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        <div className="mb-1 px-2 text-xs font-medium text-[#727272]">Recent</div>
        <DndContext
          id="notelite-sidebar-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleItems.map((page) => page.id)}
            strategy={verticalListSortingStrategy}
          >
            <nav className="space-y-1">
              {visibleItems.map((page) => {
                const href = `/page/${page.id}`;
                const isActive = pathname === href;
                const isCollapsed = collapsedFolderIds.has(page.id);

                return (
                  <SortableTreeItem
                    key={page.id}
                    item={page}
                    href={href}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    onToggleFolder={handleToggleFolder}
                    onOpenItemMenu={(itemId, x, y) => setItemMenu({ itemId, x, y })}
                  />
                );
              })}
            </nav>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      <div className="space-y-0.5 px-2 pb-3">
        <Link
          href="/library"
          className={cn(
            "flex h-7 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f2f2f2]",
            pathname === "/library" && "bg-[#e6e6e6]",
          )}
        >
          <BookOpen className="size-4 text-[#727272]" />
          <span className="truncate">Library</span>
        </Link>
        <button
          type="button"
          className="flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-[#1a1a1a] hover:bg-[#f2f2f2]"
        >
          <Trash2 className="size-4 text-[#727272]" />
          <span className="truncate">Trash</span>
        </button>
      </div>

      <div className="flex h-12 items-center border-t border-[#d9d9d9] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6e6e6] text-[10px] font-medium text-black">
            UN
          </span>
          <span className="truncate text-sm font-semibold">You</span>
        </div>
      </div>
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
