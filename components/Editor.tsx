"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Database,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
  Trash2,
} from "lucide-react";

import { Block } from "@/components/Block";
import { CanvasPanel } from "@/components/CanvasPanel";
import { DatabaseView } from "@/components/DatabaseView";
import { CanvasIcon } from "@/components/NoteliteIcons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBacklinks, getPageLinks } from "@/lib/page-links";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type EditorProps = {
  pageId?: string;
};

export function Editor({ pageId }: EditorProps) {
  const router = useRouter();
  const {
    pages,
    saveStatus,
    createPage,
    duplicatePage,
    deletePage,
    ensurePage,
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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [isDeletePageDialogOpen, setIsDeletePageDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const pageMenuRef = useRef<HTMLDivElement | null>(null);
  const links = useMemo(() => (page ? getPageLinks(page, pages) : []), [page, pages]);
  const backlinks = useMemo(() => (page ? getBacklinks(page, pages) : []), [page, pages]);

  useClickOutside(shareMenuRef, () => setIsShareOpen(false), isShareOpen);
  useClickOutside(pageMenuRef, () => setIsPageMenuOpen(false), isPageMenuOpen);

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

  function handleDuplicatePage() {
    if (!page) return;
    const copiedPage = duplicatePage(page.id);
    if (copiedPage) {
      router.push(`/page/${copiedPage.id}`);
    }
  }

  function handleDeletePage() {
    if (!page) {
      return;
    }

    setIsPageMenuOpen(false);
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

  function handleCopyPageLink() {
    void navigator.clipboard?.writeText(window.location.href);
    setIsPageMenuOpen(false);
    setIsShareOpen(false);
  }

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
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This folder can hold pages. Drag pages onto it from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12 md:px-10">
        {!focusMode ? (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
            <div className="relative flex items-center gap-1">
              <span>
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                    ? "Edited just now"
                    : saveStatus === "error"
                      ? "Save failed"
                      : "Ready"}
              </span>
              <div ref={shareMenuRef} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsPageMenuOpen(false);
                    setIsShareOpen((isOpen) => !isOpen);
                  }}
                >
                  <Share2 />
                  Share
                </Button>

                {isShareOpen ? (
                  <div className="absolute right-0 top-9 z-40 w-96 rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-xl">
                    <div className="mb-3 flex gap-2 border-b pb-3">
                      <Input placeholder="Email or group, separated by commas" />
                      <Button type="button" onClick={handleCopyPageLink}>
                        Share
                      </Button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">General access</span>
                      <span className="text-xs text-muted-foreground">Can view</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPageLink}
                      className="mt-2 flex w-full items-center justify-between rounded-md border px-3 py-2 hover:bg-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Link2 className="size-4" />
                        Anyone with the link
                      </span>
                      <span>Copy link</span>
                    </button>
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Comments"
                onClick={() => setShowComments((isOpen) => !isOpen)}
              >
                <MessageSquare />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Favorite">
                <Star />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode(mode === "canvas" ? "editor" : "canvas")}
              >
                <CanvasIcon className="size-4 text-[#757575]" />
                {mode === "canvas" ? "Editor" : "Canvas"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFocusMode(true)}>
                Focus
              </Button>
              <div ref={pageMenuRef} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Page actions"
                  onClick={() => {
                    setIsShareOpen(false);
                    setIsPageMenuOpen((isOpen) => !isOpen);
                  }}
                >
                  <MoreHorizontal />
                </Button>

                {isPageMenuOpen ? (
                  <div className="absolute right-0 top-9 z-40 w-72 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl">
                  <button
                    type="button"
                    onClick={handleCopyPageLink}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Link2 className="size-4" />
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicatePage}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Copy className="size-4" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addInlineDatabase(page.id);
                      setIsPageMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Database className="size-4" />
                    Add database
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const child = createPage(page.id, "New sub-page");
                      setIsPageMenuOpen(false);
                      router.push(`/page/${child.id}`);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Plus className="size-4" />
                    Add new sub-page
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePage}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                    Move to Trash
                  </button>
                  </div>
                ) : null}
              </div>
            </div>
            {isDeletePageDialogOpen ? (
              <ConfirmDialog
                title="Move page to trash"
                description={`Move "${page.title || "Untitled"}" to trash? This cannot be undone.`}
                confirmLabel="Move to Trash"
                destructive
                onCancel={() => setIsDeletePageDialogOpen(false)}
                onConfirm={confirmDeletePage}
              />
            ) : null}
          </div>
        ) : (
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFocusMode(false)}>
              Exit focus
            </Button>
          </div>
        )}

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
    </ScrollArea>
  );
}
