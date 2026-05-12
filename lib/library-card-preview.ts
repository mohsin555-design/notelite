export type LibraryCardPreview = {
  body: string;
  hasDescription: boolean;
  contentAlignment: "between" | "end";
};

function getPlainText(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as { text?: string; content?: unknown[] };
  return [node.text ?? "", ...(node.content ?? []).map(getPlainText)].join(" ");
}

export function getLibraryCardPreview(content: unknown): LibraryCardPreview {
  const body = getPlainText(content).replace(/\s+/g, " ").trim();
  const hasDescription = body.length > 0;

  return {
    body,
    hasDescription,
    contentAlignment: hasDescription ? "end" : "between",
  };
}
