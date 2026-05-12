"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Database,
  FolderPlus,
  MessageSquare,
  Star,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { Block } from "@/components/Block";
import { CanvasPanel } from "@/components/CanvasPanel";
import { DatabaseView } from "@/components/DatabaseView";
import { FolderCreationModal } from "@/components/FolderCreationModal";
import { WorkspaceItemContextMenu } from "@/components/FolderContextMenu";
import { NewItemMenu } from "@/components/NewItemMenu";
import { CanvasIcon, FolderListIcon, PageIcon } from "@/components/NoteliteIcons";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FolderColor } from "@/lib/folder-utils";
import { getBacklinks, getPageLinks } from "@/lib/page-links";
import { useNotionStore } from "@/lib/notion-store";
import { sortWorkspaceItems, type WorkspaceSortOption } from "@/lib/workspace-items";
import { getFolderChildren, getPageBreadcrumbs, getWorkspaceItemKind } from "@/lib/workspace-tree";
import { cn } from "@/lib/utils";

type EditorProps = {
  pageId?: string;
};

export function Editor({ pageId }: EditorProps) {
  const router = useRouter();
  const {
    pages,
    saveStatus,
    createFolder,
    createPage,
    deletePage,
    ensurePage,
    movePage,
    togglePageFavorite,
    updatePageTitle,
    updatePageContent,
    updatePageCanvas,
    addInlineDatabase,
    removeInlineDatabase,
    updateDatabaseView,
  } = useNotionStore();
  const fallbackPageId = pages.find((candidate) => candidate.type === "page")?.id;
  const activePageId = pageId ?? fallbackPageId;
  const page = useMemo(
    () => pages.find((candidate) => candidate.id === activePageId),
    [activePageId, pages],
  );
  const [mode, setMode] = useState<"editor" | "canvas">("editor");
  const [focusMode, setFocusMode] = useState(false);
  const [itemMenu, setItemMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [isDeletePageDialogOpen, setIsDeletePageDialogOpen] = useState(false);
  const [isSubfolderModalOpen, setIsSubfolderModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [folderQuery, setFolderQuery] = useState("");
  const [folderSort, setFolderSort] = useState<WorkspaceSortOption>("recent");
  const pageMenuRef = useRef<HTMLDivElement | null>(null);
  const links = useMemo(() => (page ? getPageLinks(page, pages) : []), [page, pages]);
  const backlinks = useMemo(() => (page ? getBacklinks(page, pages) : []), [page, pages]);
  const breadcrumbs = useMemo(() => (page ? getPageBreadcrumbs(pages, page) : []), [page, pages]);
  const folderChildren = useMemo(
    () => (page?.type === "folder" ? getFolderChildren(pages, page.id) : []),
    [page, pages],
  );

  useEffect(() => {
    if (pageId) {
      ensurePage(pageId);
    }
  }, [ensurePage, pageId]);

  useEffect(() => {
    setMode("editor");
  }, [activePageId]);

  function handleCreateInlineDatabase(viewType?: "table" | "list" | "board" | "calendar" | "gallery") {
    if (!page) {
      return;
    }

    const database = addInlineDatabase(page.id);
    const view = viewType ? database.views.find((candidate) => candidate.type === viewType) : undefined;
    if (view) {
      updateDatabaseView(database.id, view);
    }
  }

  function createChildFolder(name: string, folderColor: FolderColor, parentId: string | null) {
    if (!page || page.type !== "folder") {
      return;
    }

    const folder = createFolder(parentId ?? page.id, name, folderColor);
    setIsSubfolderModalOpen(false);
    router.push(`/page/${folder.id}`);
  }

  function createFolderChild(kind: "page" | "canvas") {
    if (!page || page.type !== "folder") {
      return;
    }

    const child = createPage(page.id, kind === "canvas" ? "New canvas" : "New page");
    router.push(`/page/${child.id}`);
  }

  function createChildItem(
    kind: "folder" | "page" | "canvas",
    name?: string,
    folderColor?: FolderColor,
    parentId?: string | null,
  ) {
    if (!page) {
      return;
    }

    if (kind === "folder") {
      const folder = createFolder(parentId ?? page.id, name, folderColor);
      router.push(`/page/${folder.id}`);
      return;
    }

    const child = createPage(page.id, kind === "canvas" ? "New canvas" : "New page");
    router.push(`/page/${child.id}`);
  }

  function handleFolderDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!page || page.type !== "folder") {
      return;
    }

    event.preventDefault();
    const activeId = event.dataTransfer.getData("text/plain");
    if (activeId && activeId !== page.id) {
      movePage(activeId, page.id);
    }
  }

  function handleDeletePage() {
    if (!page) {
      return;
    }

    setItemMenu(null);
    setIsDeletePageDialogOpen(true);
  }

  function confirmDeletePage() {
    if (!page) {
      return;
    }

    deletePage(page.id);
    setIsDeletePageDialogOpen(false);
    router.push("/dashboard");
  }

  function renderPageHead() {
    if (!page) {
      return null;
    }

    return (
      <div ref={pageMenuRef}>
        <PageHead
          title={page.title}
          breadcrumbs={breadcrumbs}
          breadcrumbCurrentLabel={page.title || "Untitled"}
          addControl={
            <NewItemMenu
              label="Add"
              align="right"
              buttonClassName="h-7 rounded-md border border-[#2c2c2c] bg-[#2c2c2c] px-2 text-xs font-semibold text-[#f3f3f3] shadow-[0_1px_0_rgba(31,35,40,0.04)] hover:bg-[#1f1f1f]"
              onCreateFolder={(name, folderColor, parentId) => createChildItem("folder", name, folderColor, parentId)}
              onCreatePage={() => createChildItem("page")}
              onCreateCanvas={() => createChildItem("canvas")}
            />
          }
          secondaryActions={
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Comments"
                className="h-7 w-7 rounded-md bg-white/80 p-1.5 text-[#1e1e1e] hover:bg-[#f5f5f5]"
                onClick={() => setShowComments((isOpen) => !isOpen)}
              >
                <MessageSquare className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Favorite"
                className="h-7 w-7 rounded-md bg-white/80 p-1.5 text-[#1e1e1e] hover:bg-[#f5f5f5]"
                onClick={() => togglePageFavorite(page.id)}
              >
                <Star className={cn("size-4", page.isFavorite && "fill-current")} />
              </Button>
            </>
          }
          onOpenMore={() => {
            const rect = pageMenuRef.current?.getBoundingClientRect();
            if (!rect) {
              return;
            }

            setItemMenu({
              itemId: page.id,
              x: rect.right - 12,
              y: rect.bottom + 8,
            });
          }}
        />
      </div>
    );
  }

  function renderDeleteDialog() {
    if (!page || !isDeletePageDialogOpen) {
      return null;
    }

    return (
      <ConfirmDialog
        title={`Move ${page.type === "folder" ? "folder" : "page"} to trash`}
        description={`Move "${page.title || "Untitled"}" to trash? This cannot be undone.`}
        confirmLabel="Move to Trash"
        destructive
        onCancel={() => setIsDeletePageDialogOpen(false)}
        onConfirm={confirmDeletePage}
      />
    );
  }

  const filteredFolderChildren = useMemo(() => {
    const normalizedQuery = folderQuery.trim().toLowerCase();
    const matchingChildren = normalizedQuery
      ? folderChildren.filter((child) => child.title.toLowerCase().includes(normalizedQuery))
      : folderChildren;

    return sortWorkspaceItems(matchingChildren, folderSort);
  }, [folderChildren, folderQuery, folderSort]);

  if (!activePageId || !page) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">No pages yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a page from the sidebar to start writing.
          </p>
        </div>
      </div>
    );
  }

  if (page.type === "folder") {
    return (
      <ScrollArea className="h-full">
        {renderPageHead()}
        <div
          className="mx-auto flex min-h-[calc(100vh-61px)] w-full max-w-5xl flex-col px-6 py-12 md:px-10"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={handleFolderDrop}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <FolderListIcon childCount={folderChildren.length} folderColor={page.folderColor} className="size-12" />
            <Input
              value={page.title}
              onChange={(event) => updatePageTitle(page.id, event.target.value)}
              placeholder="Untitled"
              aria-label="Folder title"
              className="mt-5 h-auto border-0 px-0 py-0 text-center text-4xl font-bold tracking-normal shadow-none focus-visible:ring-0 md:text-5xl"
            />

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsSubfolderModalOpen(true)}>
                <FolderPlus />
                Subfolder
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => createFolderChild("page")}>
                <PageIcon className="size-4 text-[#757575]" />
                Page
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => createFolderChild("canvas")}>
                <CanvasIcon className="size-4 text-[#757575]" />
                Canvas
              </Button>
            </div>

            {!folderChildren.length ? (
              <div className="mt-16 w-full rounded-lg border border-dashed border-[#d9d9d9] bg-white px-6 py-10">
                <div className="text-base font-semibold text-[#1a1a1a]">This folder is empty</div>
                <div className="mt-2 text-sm text-[#727272]">
                  Add a subfolder, page, or canvas here, or drag an item from the sidebar.
                </div>
              </div>
            ) : null}
          </div>

          {folderChildren.length ? (
            <section className="mt-12">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-[#727272]">Items</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#727272]" />
                    <input
                      value={folderQuery}
                      onChange={(event) => setFolderQuery(event.target.value)}
                      placeholder="Search in folder"
                      className="h-9 w-full rounded-lg border border-[#d8d8d8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#8e8e93] focus:ring-2 focus:ring-[#8e8e93]/20 sm:w-[220px]"
                    />
                  </div>
                  <select
                    value={folderSort}
                    onChange={(event) => setFolderSort(event.target.value as WorkspaceSortOption)}
                    className="h-9 rounded-lg border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus:border-[#8e8e93] focus:ring-2 focus:ring-[#8e8e93]/20"
                  >
                    <option value="recent">Recently created</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="kind">Type</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFolderChildren.map((child) => {
                  const kind = getWorkspaceItemKind(child);
                  const childCount = kind === "folder" ? pages.filter((candidate) => candidate.parentId === child.id).length : 0;
                  const Icon = kind === "canvas" ? CanvasIcon : PageIcon;

                  return (
                    <div
                      key={child.id}
                      className="group flex h-[68px] min-w-0 items-center gap-3 rounded-lg border border-[#d9d9d9] bg-white px-3 transition-colors hover:bg-[#f7f7f7]"
                    >
                      <Link href={`/page/${child.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        {kind === "folder" ? (
                          <FolderListIcon childCount={childCount} folderColor={child.folderColor} className="size-6 shrink-0" />
                        ) : (
                          <Icon className="size-6 shrink-0 text-[#757575]" />
                        )}
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-semibold text-[#1f1f1f]">
                            {child.title || (kind === "folder" ? "Untitled" : kind === "canvas" ? "Canvas" : "Untitled")}
                          </span>
                          <span className="block truncate text-xs text-[#727272]">
                            {kind === "folder" ? `${childCount} ${childCount === 1 ? "item" : "items"}` : kind === "canvas" ? "Canvas" : "Page"}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-[#efefef] group-hover:opacity-100"
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setItemMenu({ itemId: child.id, x: rect.left, y: rect.bottom + 6 });
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
        <FolderCreationModal
          isOpen={isSubfolderModalOpen}
          onClose={() => setIsSubfolderModalOpen(false)}
          onCreate={createChildFolder}
        />
        {itemMenu && page ? (
          <WorkspaceItemContextMenu
            item={pages.find((candidate) => candidate.id === itemMenu.itemId) ?? page}
            childCount={pages.filter((candidate) => candidate.parentId === itemMenu.itemId).length}
            x={itemMenu.x}
            y={itemMenu.y}
            onClose={() => setItemMenu(null)}
          />
        ) : null}
        {renderDeleteDialog()}
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      {renderPageHead()}
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12 md:px-10">
        <div className="mb-4 flex justify-end text-xs text-muted-foreground">
          <span>
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Edited just now"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Ready"}
          </span>
        </div>

        {focusMode ? (
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFocusMode(false)}>
              Exit focus
            </Button>
          </div>
        ) : null}

        <Input
          value={page.title}
          onChange={(event) => updatePageTitle(page.id, event.target.value)}
          placeholder="Untitled"
          aria-label="Page title"
          className="mb-7 h-auto border-0 px-0 py-0 text-4xl font-bold tracking-tight shadow-none focus-visible:ring-0 md:text-5xl"
        />

        {showComments ? (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="mb-3 font-medium">Comments</div>
            <Input placeholder="Add a comment..." />
          </div>
        ) : null}

        {!focusMode && mode === "editor" ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Get started with</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => handleCreateInlineDatabase("table")}>
              <Database />
              Database
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setMode("canvas")}>
              <CanvasIcon className="size-4 text-[#757575]" />
              Canvas
            </Button>
          </div>
        ) : null}

        {mode === "editor" ? (
          <div className={cn(focusMode && "mx-auto w-full max-w-2xl")}>
            <Block
              content={page.content}
              onChange={(content) => updatePageContent(page.id, content)}
              onCreateInlineDatabase={handleCreateInlineDatabase}
            />

            {!focusMode && (links.length > 0 || backlinks.length > 0) ? (
              <div className="mt-8 grid gap-4 border-t pt-4 text-sm md:grid-cols-2">
                <div>
                  <div className="mb-2 font-medium">Page links</div>
                  <div className="space-y-1">
                    {links.map((linkedPage) => (
                      <Link key={linkedPage.id} href={`/page/${linkedPage.id}`} className="block text-muted-foreground hover:text-foreground">
                        [[{linkedPage.title}]]
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-medium">Backlinks</div>
                  <div className="space-y-1">
                    {backlinks.map((linkedPage) => (
                      <Link key={linkedPage.id} href={`/page/${linkedPage.id}`} className="block text-muted-foreground hover:text-foreground">
                        {linkedPage.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {!focusMode && (page.inlineDatabaseIds ?? []).length > 0 ? (
              <div className="mt-8 space-y-6">
                {(page.inlineDatabaseIds ?? []).map((databaseId) => (
                  <DatabaseView
                    key={databaseId}
                    databaseId={databaseId}
                    inline
                    parentPageId={page.id}
                    onRemoveInline={() => removeInlineDatabase(page.id, databaseId)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <CanvasPanel
            canvas={page.canvas}
            onChange={(canvas) => updatePageCanvas(page.id, canvas)}
          />
        )}
      </div>
      {itemMenu && page ? (
        <WorkspaceItemContextMenu
          item={pages.find((candidate) => candidate.id === itemMenu.itemId) ?? page}
          childCount={pages.filter((candidate) => candidate.parentId === itemMenu.itemId).length}
          x={itemMenu.x}
          y={itemMenu.y}
          onClose={() => setItemMenu(null)}
        />
      ) : null}
      {renderDeleteDialog()}
    </ScrollArea>
  );
}
