"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Check,
  Copy,
  ExternalLink,
  FolderInput,
  Link2,
  PanelRight,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import { FolderLineIcon } from "@/components/NoteliteIcons";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

export const folderColorOptions = [
  { value: "amber", label: "Yellow", swatch: "bg-[#f7c34b]", card: "bg-[#f8c854]", icon: "text-[#bd8f25]" },
  { value: "green", label: "Green", swatch: "bg-[#48bd45]", card: "bg-[#62b947]", icon: "text-[#3d8f2c]" },
  { value: "red", label: "Red", swatch: "bg-[#e65350]", card: "bg-[#e95750]", icon: "text-[#b73d39]" },
  { value: "orange", label: "Orange", swatch: "bg-[#e98235]", card: "bg-[#e57f35]", icon: "text-[#b85d23]" },
] as const;

export function getFolderColorClasses(folderColor?: string) {
  return folderColorOptions.find((option) => option.value === folderColor) ?? folderColorOptions[0];
}

type FolderContextMenuProps = {
  folder: Page;
  childCount: number;
  x: number;
  y: number;
  onClose: () => void;
};

type WorkspaceItemContextMenuProps = {
  item: Page;
  childCount?: number;
  x: number;
  y: number;
  onClose: () => void;
};

type DialogMode = "rename" | "delete" | null;

function itemLabel(item: Page) {
  return item.type === "folder" ? "Folder" : "Page";
}

function itemFallbackTitle(item: Page) {
  return item.type === "folder" ? "New Folder" : "Untitled";
}

function ItemDialog({
  item,
  mode,
  onCancel,
  onDelete,
  onRename,
}: {
  item: Page;
  mode: Exclude<DialogMode, null>;
  onCancel: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const label = itemLabel(item).toLowerCase();
  const title = item.title || itemFallbackTitle(item);
  const [value, setValue] = useState(title);

  useEffect(() => {
    if (mode === "rename") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mode]);

  if (mode === "delete") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4">
        <div role="dialog" aria-modal="true" aria-labelledby="delete-item-title" className="w-full max-w-sm rounded-lg border bg-popover p-4 text-popover-foreground shadow-2xl">
          <h2 id="delete-item-title" className="text-base font-semibold text-foreground">
            Delete {label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Delete "{title}"? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-white hover:bg-destructive/90" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-item-title"
        className="w-full max-w-sm rounded-lg border bg-popover p-4 text-popover-foreground shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onRename(value);
        }}
      >
        <h2 id="rename-item-title" className="text-base font-semibold text-foreground">
          Rename {label}
        </h2>
        <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="rename-item-input">
          Name
        </label>
        <input
          ref={inputRef}
          id="rename-item-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function WorkspaceItemContextMenu({ item, childCount = 0, x, y, onClose }: WorkspaceItemContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const {
    pages,
    duplicatePage,
    duplicateFolder,
    deletePage,
    movePage,
    togglePageFavorite,
    updatePageFolderColor,
    updatePageTitle,
  } = useNotionStore();
  const isFolder = item.type === "folder";
  const label = itemLabel(item);
  const activeColor = getFolderColorClasses(item.folderColor);
  const itemUrl = typeof window !== "undefined" ? `${window.location.origin}/page/${item.id}` : "";

  const destinationFolders = useMemo(() => {
    const descendantIds = new Set<string>();

    function collectDescendants(folderId: string) {
      for (const page of pages) {
        if (page.parentId === folderId) {
          descendantIds.add(page.id);
          collectDescendants(page.id);
        }
      }
    }

    if (isFolder) {
      collectDescendants(item.id);
    }

    return pages.filter(
      (page) => page.type === "folder" && page.id !== item.id && !descendantIds.has(page.id),
    );
  }, [isFolder, item.id, pages]);

  useClickOutside(menuRef, onClose, !dialogMode);

  async function copyLink() {
    await navigator.clipboard?.writeText(itemUrl);
    onClose();
  }

  function handleMoveItem(parentId: string | null) {
    movePage(item.id, parentId);
    onClose();
  }

  function handleRenameItem(nextName: string) {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      return;
    }

    updatePageTitle(item.id, trimmedName);
    onClose();
  }

  function handleDeleteItem() {
    deletePage(item.id);
    onClose();
  }

  return (
    <>
      {!dialogMode ? (
        <div
          ref={menuRef}
          className="fixed z-50 w-[340px] rounded-lg border border-[#e6e6e6] bg-white p-2 text-sm text-[#2b2b2b] shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
          style={{
            left: typeof window === "undefined" ? x : Math.max(8, Math.min(x, window.innerWidth - 356)),
            top: typeof window === "undefined" ? y : Math.max(8, Math.min(y, window.innerHeight - 520)),
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="px-2 pb-2 pt-1 text-sm font-semibold text-[#8e8e8e]">
            {label}
          </div>

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => {
              togglePageFavorite(item.id);
              onClose();
            }}
          >
            <Star className={cn("size-5 shrink-0", item.isFavorite && "fill-current")} />
            <span className="flex-1">{item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
          </button>

          <div className="my-2 h-px bg-[#e9e9e9]" />

          <div>
            <button type="button" className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]" onClick={copyLink}>
              <Link2 className="size-5 shrink-0" />
              <span className="flex-1">Copy link</span>
            </button>
            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
              onClick={() => {
                if (isFolder) {
                  duplicateFolder(item.id);
                } else {
                  duplicatePage(item.id);
                }
                onClose();
              }}
            >
              <Copy className="size-5 shrink-0" />
              <span className="flex-1">Duplicate</span>
              <span className="text-sm font-semibold text-[#9b9b9b]">⌘D</span>
            </button>
            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
              onClick={() => setDialogMode("rename")}
            >
              <Pencil className="size-5 shrink-0" />
              <span className="flex-1">Rename</span>
              <span className="text-sm font-semibold text-[#9b9b9b]">⌘⇧R</span>
            </button>
            <div className="group/move relative">
              <button type="button" className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]">
                <FolderInput className="size-5 shrink-0" />
                <span className="flex-1">Move to</span>
                <span className="text-sm font-semibold text-[#9b9b9b]">⌘⇧P</span>
              </button>
              <div className="invisible absolute left-full top-0 z-10 ml-1 max-h-72 w-60 overflow-y-auto rounded-lg border border-[#e6e6e6] bg-white p-1 text-sm text-[#2b2b2b] shadow-xl group-hover/move:visible">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[#f5f5f5]"
                  onClick={() => handleMoveItem(null)}
                >
                  <FolderLineIcon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">Workspace root</span>
                  {item.parentId === null ? <Check className="size-4 text-muted-foreground" /> : null}
                </button>
                {destinationFolders.map((destination) => (
                  <button
                    key={destination.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[#f5f5f5]"
                    onClick={() => handleMoveItem(destination.id)}
                  >
                    <FolderLineIcon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{destination.title || "New Folder"}</span>
                    {item.parentId === destination.id ? <Check className="size-4 text-muted-foreground" /> : null}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
              onClick={() => setDialogMode("delete")}
            >
              <Trash2 className="size-5 shrink-0" />
              <span className="flex-1">Move to Trash</span>
            </button>
          </div>

          {isFolder ? (
            <>
              <div className="my-2 h-px bg-[#e9e9e9]" />
            <div className="group/color relative">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
              >
                <span className={cn("size-5 shrink-0 rounded-full", activeColor.swatch)} />
                <span className="flex-1">Folder Color</span>
                <ChevronRight className="size-4 text-[#9b9b9b]" />
              </button>
              <div className="invisible absolute left-full top-0 z-10 ml-1 w-48 rounded-lg border border-[#e6e6e6] bg-white p-1 text-sm text-[#2b2b2b] shadow-xl group-hover/color:visible">
                {folderColorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[#f5f5f5]"
                    onClick={() => {
                      updatePageFolderColor(item.id, option.value);
                      onClose();
                    }}
                  >
                    <span className={cn("size-4 rounded-full", option.swatch)} />
                    <span className="flex-1">{option.label}</span>
                    {item.folderColor === option.value ? <Check className="size-4 text-muted-foreground" /> : null}
                  </button>
                ))}
              </div>
            </div>
            </>
          ) : null}

          <div className="my-2 h-px bg-[#e9e9e9]" />

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => {
              window.open(`/page/${item.id}`, "_blank", "noopener,noreferrer");
              onClose();
            }}
          >
            <ExternalLink className="size-5 shrink-0" />
            <span className="flex-1">Open in new tab</span>
            <span className="text-sm font-semibold text-[#9b9b9b]">⌘⇧↵</span>
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={onClose}
          >
            <PanelRight className="size-5 shrink-0" />
            <span className="flex-1">Open in side peek</span>
            <span className="text-sm font-semibold text-[#9b9b9b]">⌥Click</span>
          </button>

          <div className="mt-2 border-t border-[#e9e9e9] px-2 pt-3 text-sm leading-6 text-[#9b9b9b]">
            <div>Last edited by Mohsin Ali</div>
            <div>May 2, 2026, 4:32 PM</div>
          </div>
        </div>
      ) : (
        <ItemDialog
          item={item}
          mode={dialogMode}
          onCancel={onClose}
          onDelete={handleDeleteItem}
          onRename={handleRenameItem}
        />
      )}
    </>
  );
}

export function FolderContextMenu({ folder, childCount, x, y, onClose }: FolderContextMenuProps) {
  return (
    <WorkspaceItemContextMenu
      item={folder}
      childCount={childCount}
      x={x}
      y={y}
      onClose={onClose}
    />
  );
}
