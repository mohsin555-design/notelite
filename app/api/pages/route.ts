import { readWorkspace, writeWorkspace } from "@/lib/page-storage";
import type { WorkspaceData } from "@/lib/notion-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspace = await readWorkspace();
  return Response.json(workspace);
}

export async function PUT(request: Request) {
  const workspace = (await request.json()) as WorkspaceData;

  if (!Array.isArray(workspace.pages) || !Array.isArray(workspace.databases)) {
    return Response.json({ error: "Invalid workspace payload" }, { status: 400 });
  }

  await writeWorkspace(workspace);
  return Response.json({ ok: true });
}
