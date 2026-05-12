import type { Page } from "@/lib/notion-types";

export type WorkspaceItemKind = "folder" | "page" | "canvas";

export function getWorkspaceItemKind(page: Pick<Page, "type" | "title" | "canvas">): WorkspaceItemKind {
  if (page.type === "folder") {
    return "folder";
  }

  const canvas = page.canvas as { elements?: unknown[] } | undefined;
  if (Boolean(canvas?.elements?.length) || page.title.toLowerCase().includes("canvas")) {
    return "canvas";
  }

  return "page";
}

export function isCanvasPage(page: Page) {
  return getWorkspaceItemKind(page) === "canvas";
}

export function getFolderChildren(pages: Page[], folderId: string) {
  return pages.filter((page) => page.parentId === folderId);
}

export function getPageBreadcrumbs(pages: Page[], page: Pick<Page, "id" | "parentId">) {
  const byId = new Map(pages.map((candidate) => [candidate.id, candidate]));
  const breadcrumbs: Page[] = [];
  const visited = new Set([page.id]);
  let parentId = page.parentId;

  while (parentId) {
    if (visited.has(parentId)) {
      break;
    }

    const parent = byId.get(parentId);
    if (!parent) {
      break;
    }

    breadcrumbs.unshift(parent);
    visited.add(parent.id);
    parentId = parent.parentId;
  }

  return breadcrumbs;
}
