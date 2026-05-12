"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Heart, Plus, Search } from "lucide-react";
import { useRef, useState } from "react";

import { FolderCreationModal } from "@/components/FolderCreationModal";
import { CanvasIcon, ContainerIcon, FolderFillIcon, FullWidthIcon, PageIcon, PageLayoutIcon } from "@/components/NoteliteIcons";
import { NewItemMenu } from "@/components/NewItemMenu";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import type { FolderColor } from "@/lib/folder-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAnchoredPopoverPosition } from "@/lib/popover-position";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

function getPlainText(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as { text?: string; content?: unknown[] };
  return [node.text ?? "", ...(node.content ?? []).map(getPlainText)].join(" ");
}

function SearchShortcut() {
  return (
    <span className="pointer-events-none absolute right-2 top-1/2 inline-flex h-[30px] -translate-y-1/2 items-center gap-1 rounded-md border border-[#d9d9d9] bg-white px-2 text-xs font-semibold text-[#1a1a1a] shadow-[0_1px_0_rgba(31,35,40,0.04)]">
      <span>⌘</span>
      <span>K</span>
    </span>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const { pages, createPage, createFolder } = useNotionStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [pageLayout, setPageLayout] = useState<"container" | "full">("container");
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  const pageItems = pages.filter((page) => page.type === "page");
  const favoriteItems = pages.filter((page) => page.isFavorite);
  const recentPages = pageItems.slice(0, 8);

  useClickOutside(moreMenuRef, () => {
    setIsMoreOpen(false);
    setIsLayoutOpen(false);
  }, isMoreOpen);

  function handleNewPage() {
    const page = createPage(null, "New page");
    router.push(`/page/${page.id}`);
  }

  function handleCreateFolder(name: string, folderColor: FolderColor, parentId: string | null) {
    const folder = createFolder(parentId, name, folderColor);
    router.push(`/page/${folder.id}`);
  }

  function handleNewCanvas() {
    const page = createPage(null, "New canvas");
    router.push(`/page/${page.id}`);
  }

  function handleOpenSearch() {
    window.dispatchEvent(new CustomEvent("notelite:open-workspace-search"));
  }

  const homeMenuPosition =
    isMoreOpen && typeof window !== "undefined" && moreButtonRef.current
      ? getAnchoredPopoverPosition(moreButtonRef.current.getBoundingClientRect(), {
          width: 160,
          height: 120,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        })
      : null;

  return (
    <ScrollArea className="h-full">
      <div className="min-h-screen bg-white">
        <div ref={moreMenuRef}>
          <PageHead
            title="Welcome to NoteLite"
            breadcrumbs={[]}
            breadcrumbCurrentLabel="Home"
            addControl={
              <NewItemMenu
                label="Add"
                align="right"
                buttonClassName="h-7 rounded-md border border-[#0062ff] bg-[#0062ff] px-2 text-xs font-semibold text-white shadow-[0_1px_0_rgba(31,35,40,0.04)] hover:bg-[#0052d4]"
                onCreateFolder={handleCreateFolder}
                onCreatePage={handleNewPage}
                onCreateCanvas={handleNewCanvas}
              />
            }
            onOpenMore={() => setIsMoreOpen((isOpen) => !isOpen)}
            moreButtonRef={moreButtonRef}
            moreMenu={
              isMoreOpen && homeMenuPosition ? (
                <div
                  className="fixed z-40 w-[160px] rounded-xl border border-[#e5e7eb] bg-white p-2 text-sm text-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                  style={homeMenuPosition}
                >
                  <div className="group/layout relative">
                    <button
                      type="button"
                      className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]"
                      onMouseEnter={() => setIsLayoutOpen(true)}
                      onClick={() => setIsLayoutOpen((isOpen) => !isOpen)}
                    >
                      <PageLayoutIcon className="size-4 text-[#1e1e1e]" />
                      <span className="flex-1">Page layout</span>
                      <ChevronRight className="size-4 text-[#727272]" />
                    </button>
                    {isLayoutOpen ? (
                      <div className="absolute right-full top-0 z-50 mr-2 w-[160px] rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                        <button
                          type="button"
                          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]"
                          onClick={() => setPageLayout("container")}
                        >
                          {pageLayout === "container" ? <Check className="size-4" /> : <span className="size-4" />}
                          <ContainerIcon className="size-4 text-[#1e1e1e]" />
                          Container
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]"
                          onClick={() => setPageLayout("full")}
                        >
                          {pageLayout === "full" ? <Check className="size-4" /> : <span className="size-4" />}
                          <FullWidthIcon className="size-4 text-[#1e1e1e]" />
                          Full width
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null
            }
          />
        </div>

        <div className="flex items-start justify-center px-6 py-4">
          <div className={cn("flex w-full flex-col items-stretch gap-5 pt-16 md:pt-[284px]", pageLayout === "container" ? "max-w-[840px]" : "max-w-[calc(100vw-360px)]")}>
            <button
              type="button"
              onClick={handleOpenSearch}
              className="relative flex h-10 w-full items-center rounded-lg border border-[#d9d9d9] bg-white px-3 text-left shadow-[inset_0_1px_0_rgba(31,35,40,0.04)] transition-colors hover:bg-[#fbfbfb]"
            >
              <Search className="mr-2 size-4 shrink-0 text-[#727272]" />
              <span className="min-w-0 flex-1 truncate text-sm text-[#8e8e93]">Search anything..</span>
              <SearchShortcut />
            </button>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-[#727272]">Recent</h2>
            <div className="grid grid-cols-1 gap-x-2 gap-y-[9px] sm:grid-cols-2 lg:grid-cols-4">
              {recentPages.length ? (
                recentPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/page/${page.id}`}
                    className="flex h-[59px] min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-[#d9d9d9] bg-white p-3 transition-colors hover:bg-[#f7f7f7]"
                  >
                    <PageIcon className="size-6 shrink-0 text-[#757575]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#1a1a1a]">
                        {page.title || "Untitled"}
                      </span>
                      <span className="block truncate text-xs text-[#727272]">
                        {getPlainText(page.content) || "No content yet."}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-[#d9d9d9] p-6 text-center text-sm text-[#727272]">
                  Create a page to see it here.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-[#727272]">Go to</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/library?view=list&section=favorites")}
                className="flex h-[91px] w-[180px] flex-col gap-2 rounded-lg border border-[#d9d9d9] bg-white p-3 text-left transition-colors hover:bg-[#f7f7f7]"
              >
                <Heart className="size-6 text-[#727272]" />
                <span>
                  <span className="block text-sm font-medium text-[#1a1a1a]">Favorites</span>
                  <span className="block text-xs text-[#727272]">
                    {favoriteItems.length} {favoriteItems.length === 1 ? "item" : "items"}
                  </span>
                </span>
              </button>

              <Link
                href="/library"
                className="flex h-[91px] w-[180px] flex-col gap-2 rounded-lg border border-[#d9d9d9] bg-white p-3 text-left transition-colors hover:bg-[#f7f7f7]"
              >
                <FolderFillIcon className="size-6 text-[#b3b3b3]" />
                <span>
                  <span className="block text-sm font-medium text-[#1a1a1a]">Library</span>
                  <span className="block text-xs text-[#727272]">
                    {pages.length} {pages.length === 1 ? "item" : "items"}
                  </span>
                </span>
              </Link>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-[115px] justify-start rounded-md border-[#d9d9d9] bg-white px-3 text-sm"
              onClick={() => setIsFolderModalOpen(true)}
            >
              <FolderFillIcon className="size-4 text-[#b3b3b3]" />
              Folder
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-[89px] justify-start rounded-md border-[#d9d9d9] bg-white px-3 text-sm"
              onClick={handleNewPage}
            >
              <Plus className="size-4" />
              Page
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-[103px] justify-start rounded-md border-[#d9d9d9] bg-white px-3 text-sm"
              onClick={handleNewCanvas}
            >
              <CanvasIcon className="size-4 text-[#757575]" />
              Canvas
            </Button>
          </div>
        </div>
        </div>
      </div>
      <FolderCreationModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={(name, folderColor, parentId) => {
          handleCreateFolder(name, folderColor, parentId);
          setIsFolderModalOpen(false);
        }}
      />
    </ScrollArea>
  );
}
