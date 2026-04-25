import { readWorkspace, writeWorkspace } from "@/lib/page-storage";
import type { Page } from "@/lib/notion-types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workspace = await readWorkspace();
  const page = workspace.pages.find((candidate) => candidate.id === id);

  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  return Response.json(page);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const nextPage = (await request.json()) as Page;
  const workspace = await readWorkspace();
  const pageIndex = workspace.pages.findIndex((candidate) => candidate.id === id);

  if (pageIndex < 0) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  workspace.pages[pageIndex] = { ...nextPage, id };
  await writeWorkspace(workspace);
  return Response.json(workspace.pages[pageIndex]);
}
