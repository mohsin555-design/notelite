"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Database, Eye, EyeOff, FileText, PencilRuler, Plus } from "lucide-react";

import { Block } from "@/components/Block";
import { CanvasPanel } from "@/components/CanvasPanel";
import { DatabaseView } from "@/components/DatabaseView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBacklinks, getPageLinks } from "@/lib/page-links";
import { useNotionStore } from "@/lib/notion-store";
import { cn } from "@/lib/utils";

type EditorProps = {
  pageId?: string;
};

export function Editor({ pageId }: EditorProps) {
  const {
    pages,
    databases,
    saveStatus,
    ensurePage,
    updatePageTitle,
    updatePageContent,
    updatePageCanvas,
    addInlineDatabase,
  } = useNotionStore();
  const fallbackPageId = pages.find((candidate) => candidate.type === "page")?.id;
  const activePageId = pageId ?? fallbackPageId;
  const page = useMemo(
    () => pages.find((candidate) => candidate.id === activePageId),
    [activePageId, pages],
  );
  const [mode, setMode] = useState<"editor" | "canvas">("editor");
  const [focusMode, setFocusMode] = useState(false);
  const links = useMemo(() => (page ? getPageLinks(page, pages) : []), [page, pages]);
  const backlinks = useMemo(() => (page ? getBacklinks(page, pages) : []), [page, pages]);

  useEffect(() => {
    if (pageId) {
      ensurePage(pageId);
    }
  }, [ensurePage, pageId]);

  useEffect(() => {
    setMode("editor");
  }, [activePageId]);

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
        <div
          className={cn(
            "mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground",
            focusMode && "hidden",
          )}
        >
          <span>
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Ready"}
          </span>
          <div className="flex items-center rounded-lg border p-1">
            <Button
              type="button"
              variant={mode === "editor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("editor")}
            >
              <FileText />
              Editor
            </Button>
            <Button
              type="button"
              variant={mode === "canvas" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("canvas")}
            >
              <PencilRuler />
              Canvas
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addInlineDatabase(page.id)}
            >
              <Database />
              DB
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(true)}
            >
              <EyeOff />
              Focus
            </Button>
          </div>
        </div>

        {focusMode ? (
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFocusMode(false)}>
              <Eye />
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

        {mode === "editor" ? (
          <div className={cn(focusMode && "mx-auto w-full max-w-2xl")}>
            <Block
              content={page.content}
              onChange={(content) => updatePageContent(page.id, content)}
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
                  <DatabaseView key={databaseId} databaseId={databaseId} inline />
                ))}
              </div>
            ) : null}

            {!focusMode && databases.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-fit"
                onClick={() => addInlineDatabase(page.id, databases[0].id)}
              >
                <Plus />
                Add database view
              </Button>
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
