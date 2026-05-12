"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  FolderInput,
  Link2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import { FolderCreationModal } from "@/components/FolderCreationModal";
import { MoveItemModal } from "@/components/MoveItemModal";
import { folderColorOptions, getFolderColorOption, type FolderColor } from "@/lib/folder-utils";
import type { Page } from "@/lib/notion-types";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";
import { useWorkspaceTabs } from "@/lib/workspace-tabs";
import {
  formatCreatedOn,
  getFolderTargets,
  getItemDisplayTitle,
  getPageCreatedAt,
} from "@/lib/workspace-items";
import { cn } from "@/lib/utils";

export { folderColorOptions, getFolderColorOption as getFolderColorClasses };

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

type DialogMode = "rename" | "delete" | "move" | "duplicate-folder" | null;

function itemLabel(item: Page) {
  return item.type === "folder" ? "Folder" : "Page";
}

function ItemDialog({
  item,
  onCancel,
  onDelete,
  onRename,
}: {
  item: Page;
  onCancel: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const label = itemLabel(item).toLowerCase();
  const title = getItemDisplayTitle(item);
  const [value, setValue] = useState(title);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 px-4">
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

function DeleteDialog({
  item,
  onCancel,
  onDelete,
}: {
  item: Page;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const label = itemLabel(item).toLowerCase();
  const title = getItemDisplayTitle(item);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 px-4">
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

export function WorkspaceItemContextMenu({ item, childCount = 0, x, y, onClose }: WorkspaceItemContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [copied, setCopied] = useState(false);
  const {
    pages,
    createFolder,
    duplicatePage,
    duplicateFolder,
    deletePage,
    movePage,
    togglePageFavorite,
    updatePageFolderColor,
    updatePageTitle,
  } = useNotionStore();
  const workspaceTabs = useWorkspaceTabs();
  const isFolder = item.type === "folder";
  const label = itemLabel(item);
  const activeColor = getFolderColorOption(item.folderColor);
  const itemUrl = typeof window !== "undefined" ? `${window.location.origin}/page/${item.id}` : "";

  const folderTargets = useMemo(() => getFolderTargets(pages, item), [item, pages]);

  useClickOutside(menuRef, onClose, !dialogMode);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
      onClose();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [copied, onClose]);

  async function copyLink() {
    await navigator.clipboard?.writeText(itemUrl);
    setCopied(true);
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

  function handleDuplicateFolder(name: string, folderColor: string, parentId: string | null) {
    duplicateFolder(item.id, { title: name, parentId, folderColor });
    onClose();
  }

  function handleOpenInNewTab() {
    workspaceTabs?.openTab({
      id: `tab-${item.id}-${Date.now()}`,
      href: `/page/${item.id}`,
      label: getItemDisplayTitle(item),
    });
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

          <button type="button" className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]" onClick={copyLink}>
            {copied ? <Check className="size-5 shrink-0 fill-current" /> : <Link2 className="size-5 shrink-0" />}
            <span className="flex-1">{copied ? "Copied" : "Copy link"}</span>
          </button>

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => {
              if (isFolder) {
                setDialogMode("duplicate-folder");
                return;
              }

              duplicatePage(item.id);
              onClose();
            }}
          >
            <Copy className="size-5 shrink-0" />
            <span className="flex-1">Duplicate</span>
          </button>

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => setDialogMode("rename")}
          >
            <Pencil className="size-5 shrink-0" />
            <span className="flex-1">Rename</span>
          </button>

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => setDialogMode("move")}
          >
            <FolderInput className="size-5 shrink-0" />
            <span className="flex-1">{isFolder ? "Move folder" : "Move"}</span>
          </button>

          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
            onClick={() => setDialogMode("delete")}
          >
            <Trash2 className="size-5 shrink-0" />
            <span className="flex-1">Move to Trash</span>
          </button>

          {isFolder ? (
            <>
              <div className="my-2 h-px bg-[#e9e9e9]" />
              <div className="group/color relative">
                <button
                  type="button"
                  className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-[#f5f5f5]"
                >
                  <span className={cn("size-5 shrink-0 rounded-full", activeColor.swatch)} />
                  <span className="flex-1">Folder color</span>
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
                      {activeColor.value === option.value ? <Check className="size-4 text-muted-foreground" /> : null}
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
            onClick={handleOpenInNewTab}
          >
            <ExternalLink className="size-5 shrink-0" />
            <span className="flex-1">Open in new tab</span>
          </button>

          <div className="mt-2 border-t border-[#e9e9e9] px-2 pt-3 text-sm leading-6 text-[#9b9b9b]">
            <div>Created on {formatCreatedOn(getPageCreatedAt(item))}</div>
          </div>
        </div>
      ) : null}

      {dialogMode === "rename" ? (
        <ItemDialog item={item} onCancel={onClose} onDelete={handleDeleteItem} onRename={handleRenameItem} />
      ) : null}

      {dialogMode === "delete" ? (
        <DeleteDialog item={item} onCancel={onClose} onDelete={handleDeleteItem} />
      ) : null}

      {dialogMode === "duplicate-folder" ? (
        <FolderCreationModal
          isOpen
          title="Duplicate folder"
          submitLabel="Duplicate"
          initialName={`${getItemDisplayTitle(item)} Copy`}
          initialColor={(item.folderColor ?? "neutral") as FolderColor}
          folderTargets={folderTargets}
          initialParentId={item.parentId}
          onClose={onClose}
          onCreate={handleDuplicateFolder}
        />
      ) : null}

      {dialogMode === "move" ? (
        <MoveItemModal
          isOpen
          title={isFolder ? "Move folder" : "Move item"}
          currentParentId={item.parentId}
          targets={folderTargets}
          onClose={onClose}
          onMove={handleMoveItem}
          onCreateFolder={(name, parentId, folderColor) => {
            createFolder(parentId, name, folderColor);
          }}
        />
      ) : null}
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
