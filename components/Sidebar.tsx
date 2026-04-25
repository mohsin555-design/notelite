"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Folder,
  FolderPlus,
  GripVertical,
  Plus,
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

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Page } from "@/lib/notion-types";
import { cn } from "@/lib/utils";
import { useNotionStore } from "@/lib/notion-store";

type VisibleItem = Page & {
  depth: number;
  childCount: number;
};

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
}: {
  item: VisibleItem;
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
  onToggleFolder: (folderId: string) => void;
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
          <button
            type="button"
            onClick={() => onToggleFolder(item.id)}
            className={cn(
              "flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-left text-sm font-medium text-sidebar-foreground hover:bg-muted",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
            <Folder className="size-4 text-muted-foreground" />
            <span className="truncate">{item.title.trim() || "New Folder"}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {item.childCount || ""}
            </span>
          </button>
        ) : (
          <Button
            asChild
            variant="ghost"
            className={cn(
              "h-8 w-full justify-start px-2 text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Link href={href}>
              <FileText className="text-muted-foreground" />
              <span className="truncate">{item.title.trim() || "Untitled"}</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { pages, databases, createPage, createFolder, createDatabase, movePage } = useNotionStore();
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
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

  function handleCreateFolder() {
    createFolder();
  }

  function handleCreateDatabase() {
    const database = createDatabase();
    router.push(`/database/${database.id}`);
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
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="min-w-0 text-sm font-semibold tracking-tight"
          >
            Notelite
          </Link>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="New page"
            onClick={handleCreatePage}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" className="justify-start" onClick={handleCreatePage}>
            <Plus />
            Page
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="justify-start"
            onClick={handleCreateFolder}
          >
            <FolderPlus />
            Folder
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="justify-start"
            onClick={handleCreateDatabase}
          >
            <Database />
            DB
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
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
                  />
                );
              })}
            </nav>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      <div className="border-t px-2 py-3">
        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          Databases
        </div>
        <nav className="space-y-1">
          {databases.map((database) => {
            const href = `/database/${database.id}`;
            const isActive = pathname === href;

            return (
              <Button
                key={database.id}
                asChild
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start px-2 text-sidebar-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Link href={href}>
                  <Database className="text-muted-foreground" />
                  <span className="truncate">{database.title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
