import type { Page } from "@/lib/notion-types";
import { getWorkspaceItemKind } from "@/lib/workspace-tree";

export type WorkspaceSortOption = "recent" | "title-asc" | "title-desc" | "kind";

export type FolderTarget = {
  id: string | null;
  title: string;
  depth: number;
};

export function getItemDisplayTitle(page: Pick<Page, "title" | "type" | "canvas">) {
  const title = page.title.trim();
  if (title) {
    return title;
  }

  return getWorkspaceItemKind(page) === "canvas"
    ? "Canvas"
    : page.type === "folder"
      ? "New Folder"
      : "Untitled";
}

export function getPageCreatedAt(page: Pick<Page, "createdAt">) {
  return page.createdAt ?? "2026-05-02T16:32:00.000Z";
}

export function formatCreatedOn(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function compareTitle(left: Page, right: Page) {
  return getItemDisplayTitle(left).localeCompare(getItemDisplayTitle(right), undefined, {
    sensitivity: "base",
  });
}

export function sortWorkspaceItems(items: Page[], sort: WorkspaceSortOption) {
  const nextItems = [...items];

  switch (sort) {
    case "title-asc":
      return nextItems.sort(compareTitle);
    case "title-desc":
      return nextItems.sort((left, right) => compareTitle(right, left));
    case "kind":
      return nextItems.sort((left, right) => {
        const kindOrder = ["folder", "page", "canvas"];
        const leftKind = kindOrder.indexOf(getWorkspaceItemKind(left));
        const rightKind = kindOrder.indexOf(getWorkspaceItemKind(right));
        return leftKind - rightKind || compareTitle(left, right);
      });
    case "recent":
    default:
      return nextItems.sort(
        (left, right) =>
          new Date(getPageCreatedAt(right)).getTime() - new Date(getPageCreatedAt(left)).getTime(),
      );
  }
}

export function getFolderTargets(pages: Page[], activeItem?: Pick<Page, "id" | "type"> | null): FolderTarget[] {
  const blockedIds = new Set<string>();

  if (activeItem?.type === "folder") {
    const visit = (folderId: string) => {
      blockedIds.add(folderId);
      for (const page of pages) {
        if (page.parentId === folderId && page.type === "folder") {
          visit(page.id);
        }
      }
    };

    visit(activeItem.id);
  } else if (activeItem?.id) {
    blockedIds.add(activeItem.id);
  }

  const roots = pages
    .filter((page) => page.type === "folder" && page.parentId === null && !blockedIds.has(page.id))
    .sort(compareTitle);

  const targets: FolderTarget[] = [{ id: null, title: "Workspace root", depth: 0 }];

  const appendChildren = (folder: Page, depth: number) => {
    targets.push({ id: folder.id, title: getItemDisplayTitle(folder), depth });

    const children = pages
      .filter((page) => page.type === "folder" && page.parentId === folder.id && !blockedIds.has(page.id))
      .sort(compareTitle);

    for (const child of children) {
      appendChildren(child, depth + 1);
    }
  };

  for (const root of roots) {
    appendChildren(root, 0);
  }

  return targets;
}
