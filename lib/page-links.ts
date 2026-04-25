import type { JSONContent } from "@tiptap/core";
import type { Page } from "@/lib/notion-types";

export function getPlainText(content: JSONContent): string {
  const text: string[] = [];

  function walk(node: JSONContent) {
    if (node.text) {
      text.push(node.text);
    }

    for (const child of node.content ?? []) {
      walk(child);
    }
  }

  walk(content);
  return text.join(" ");
}

export function getLinkedPageTitles(content: JSONContent) {
  const matches = getPlainText(content).matchAll(/\[\[([^\]]+)\]\]/g);
  return Array.from(matches, (match) => match[1].trim()).filter(Boolean);
}

export function getPageLinks(page: Page, pages: Page[]) {
  const titles = getLinkedPageTitles(page.content).map((title) => title.toLowerCase());
  return pages.filter((candidate) => titles.includes(candidate.title.toLowerCase()));
}

export function getBacklinks(page: Page, pages: Page[]) {
  return pages.filter((candidate) => {
    if (candidate.id === page.id || candidate.type !== "page") {
      return false;
    }

    return getLinkedPageTitles(candidate.content).some(
      (title) => title.toLowerCase() === page.title.toLowerCase(),
    );
  });
}
