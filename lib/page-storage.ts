import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { WorkspaceData } from "@/lib/notion-types";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "pages.json");

const defaultWorkspace: WorkspaceData = {
  pages: [
    {
      id: "welcome",
      title: "Welcome to Notelite",
      type: "page",
      parentId: null,
      inlineDatabaseIds: ["tasks-db"],
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "A block editor with TipTap" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Use headings, bullet lists, numbered lists, folders, and the canvas tab.",
              },
            ],
          },
        ],
      },
      canvas: { elements: [], appState: {}, files: {} },
    },
    {
      id: "projects",
      title: "Projects",
      type: "folder",
      parentId: null,
      content: { type: "doc", content: [] },
      canvas: { elements: [], appState: {}, files: {} },
      inlineDatabaseIds: [],
    },
    {
      id: "task-design",
      title: "Design database UI",
      type: "page",
      parentId: null,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      canvas: { elements: [], appState: {}, files: {} },
      inlineDatabaseIds: [],
    },
    {
      id: "task-pwa",
      title: "Ship installable PWA",
      type: "page",
      parentId: null,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      canvas: { elements: [], appState: {}, files: {} },
      inlineDatabaseIds: [],
    },
  ],
  databases: [
    {
      id: "tasks-db",
      title: "Tasks",
      parentId: null,
      defaultViewId: "tasks-table",
      properties: [
        { id: "title", name: "Title", type: "title" },
        {
          id: "status",
          name: "Status",
          type: "status",
          options: ["Not started", "In progress", "Done"],
        },
        { id: "tags", name: "Tags", type: "tags", options: ["UX", "Editor", "PWA"] },
        { id: "due", name: "Due", type: "date" },
        { id: "done", name: "Done", type: "checkbox" },
        { id: "effort", name: "Effort", type: "number" },
      ],
      rows: [
        {
          id: "row-design",
          pageId: "task-design",
          properties: {
            title: "Design database UI",
            status: "In progress",
            tags: ["UX", "Editor"],
            due: "2026-04-30",
            done: false,
            effort: 5,
          },
        },
        {
          id: "row-pwa",
          pageId: "task-pwa",
          properties: {
            title: "Ship installable PWA",
            status: "Done",
            tags: ["PWA"],
            due: "2026-04-26",
            done: true,
            effort: 2,
          },
        },
      ],
      views: [
        { id: "tasks-table", name: "Table", type: "table", sort: { propertyId: "due", direction: "asc" } },
        { id: "tasks-list", name: "List", type: "list" },
        { id: "tasks-board", name: "Board", type: "board", groupBy: "status" },
        { id: "tasks-calendar", name: "Calendar", type: "calendar", groupBy: "due" },
        { id: "tasks-gallery", name: "Gallery", type: "gallery" },
      ],
    },
  ],
};

async function ensureDataFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeWorkspace(defaultWorkspace);
  }
}

export async function readWorkspace(): Promise<WorkspaceData> {
  await ensureDataFile();

  const rawData = await readFile(dataFile, "utf8");
  const workspace = JSON.parse(rawData) as WorkspaceData;
  return {
    pages: workspace.pages ?? defaultWorkspace.pages,
    databases: workspace.databases ?? defaultWorkspace.databases,
  };
}

export async function writeWorkspace(workspace: WorkspaceData) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(workspace, null, 2)}\n`, "utf8");
}
