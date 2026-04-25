"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CanvasData,
  Database,
  DatabaseProperty,
  DatabasePropertyType,
  DatabaseRow,
  DatabaseValue,
  DatabaseView,
  DatabaseViewType,
  Page,
  WorkspaceData,
} from "@/lib/notion-types";

const defaultContent: Page["content"] = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const initialPages: Page[] = [
  {
    id: "welcome",
    title: "Welcome to Notelite",
    type: "page",
    parentId: null,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "A complete block workspace" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Try [[Product roadmap]], add blocks, switch to focus mode, or open the Tasks database.",
            },
          ],
        },
      ],
    },
    canvas: { elements: [], appState: {}, files: {} },
    inlineDatabaseIds: ["tasks-db"],
  },
  {
    id: "projects",
    title: "Projects",
    type: "folder",
    parentId: null,
    content: { type: "doc", content: [] },
    canvas: { elements: [], appState: {}, files: {} },
  },
  {
    id: "product-roadmap",
    title: "Product roadmap",
    type: "page",
    parentId: "projects",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Roadmap" }],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Editor foundation" }] }],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Database views" }] }],
            },
          ],
        },
      ],
    },
    canvas: { elements: [], appState: {}, files: {} },
  },
  {
    id: "task-design",
    title: "Design database UI",
    type: "page",
    parentId: null,
    content: defaultContent,
    canvas: { elements: [], appState: {}, files: {} },
  },
  {
    id: "task-pwa",
    title: "Ship installable PWA",
    type: "page",
    parentId: null,
    content: defaultContent,
    canvas: { elements: [], appState: {}, files: {} },
  },
];

const initialDatabases: Database[] = [
  {
    id: "tasks-db",
    title: "Tasks",
    parentId: null,
    defaultViewId: "tasks-table",
    properties: [
      { id: "title", name: "Title", type: "title" },
      { id: "status", name: "Status", type: "status", options: ["Not started", "In progress", "Done"] },
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
];

type NotionStore = {
  pages: Page[];
  databases: Database[];
  isLoaded: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  createPage: (parentId?: string | null, title?: string) => Page;
  createFolder: (parentId?: string | null) => Page;
  createDatabase: (parentId?: string | null, title?: string) => Database;
  ensurePage: (id: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  updatePageContent: (pageId: string, content: Page["content"]) => void;
  updatePageCanvas: (pageId: string, canvas: CanvasData) => void;
  addInlineDatabase: (pageId: string, databaseId?: string) => Database;
  removeInlineDatabase: (pageId: string, databaseId: string) => void;
  movePage: (pageId: string, parentId: string | null, targetId?: string) => void;
  updateDatabaseTitle: (databaseId: string, title: string) => void;
  addDatabaseProperty: (databaseId: string, type: DatabasePropertyType) => void;
  updateDatabaseProperty: (databaseId: string, property: DatabaseProperty) => void;
  addDatabaseRow: (databaseId: string) => { row: DatabaseRow; page: Page };
  updateDatabaseCell: (
    databaseId: string,
    rowId: string,
    propertyId: string,
    value: DatabaseValue,
  ) => void;
  updateDatabaseView: (databaseId: string, view: DatabaseView) => void;
  addDatabaseView: (databaseId: string, type: DatabaseViewType) => DatabaseView;
};

const NotionStoreContext = createContext<NotionStore | null>(null);

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyCanvas(): CanvasData {
  return { elements: [], appState: {}, files: {} };
}

function createUntitledPage(
  id = createId("page"),
  parentId: string | null = null,
  title = "Untitled",
): Page {
  return {
    id,
    title,
    type: "page",
    parentId,
    content: defaultContent,
    canvas: createEmptyCanvas(),
    inlineDatabaseIds: [],
  };
}

function createUntitledFolder(parentId: string | null = null): Page {
  return {
    id: createId("folder"),
    title: "New Folder",
    type: "folder",
    parentId,
    content: { type: "doc", content: [] },
    canvas: createEmptyCanvas(),
    inlineDatabaseIds: [],
  };
}

function createDefaultDatabase(parentId: string | null = null, title = "New Database"): Database {
  const tableId = createId("view");
  return {
    id: createId("db"),
    title,
    parentId,
    defaultViewId: tableId,
    properties: [
      { id: "title", name: "Title", type: "title" },
      { id: createId("prop"), name: "Status", type: "status", options: ["Not started", "In progress", "Done"] },
      { id: createId("prop"), name: "Tags", type: "tags", options: ["General"] },
    ],
    rows: [],
    views: [
      { id: tableId, name: "Table", type: "table" },
      { id: createId("view"), name: "List", type: "list" },
      { id: createId("view"), name: "Board", type: "board", groupBy: "status" },
      { id: createId("view"), name: "Calendar", type: "calendar" },
      { id: createId("view"), name: "Gallery", type: "gallery" },
    ],
  };
}

function normalizeWorkspace(data: WorkspaceData): WorkspaceData {
  return {
    pages: (data.pages?.length ? data.pages : initialPages).map((page) => ({
      ...page,
      inlineDatabaseIds: page.inlineDatabaseIds ?? [],
    })),
    databases: data.databases?.length ? data.databases : initialDatabases,
  };
}

export function NotionStoreProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [databases, setDatabases] = useState<Database[]>(initialDatabases);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<NotionStore["saveStatus"]>("idle");

  useEffect(() => {
    let isActive = true;

    async function loadWorkspace() {
      try {
        const response = await fetch("/api/pages", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch workspace");
        }

        const data = normalizeWorkspace((await response.json()) as WorkspaceData);
        if (isActive) {
          setPages(data.pages);
          setDatabases(data.databases);
        }
      } catch {
        setSaveStatus("error");
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    }

    loadWorkspace();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSaveStatus("saving");

      try {
        const response = await fetch("/api/pages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pages, databases }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to save workspace");
        }

        setSaveStatus("saved");
      } catch {
        if (!controller.signal.aborted) {
          setSaveStatus("error");
        }
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [databases, isLoaded, pages]);

  const createPage = useCallback((parentId: string | null = null, title?: string) => {
    const page = createUntitledPage(createId("page"), parentId, title);
    setPages((currentPages) => [page, ...currentPages]);
    return page;
  }, []);

  const createFolder = useCallback((parentId: string | null = null) => {
    const folder = createUntitledFolder(parentId);
    setPages((currentPages) => [folder, ...currentPages]);
    return folder;
  }, []);

  const createDatabase = useCallback((parentId: string | null = null, title?: string) => {
    const database = createDefaultDatabase(parentId, title);
    setDatabases((currentDatabases) => [database, ...currentDatabases]);
    return database;
  }, []);

  const ensurePage = useCallback((id: string) => {
    setPages((currentPages) => {
      if (currentPages.some((page) => page.id === id)) {
        return currentPages;
      }

      return [createUntitledPage(id), ...currentPages];
    });
  }, []);

  const updatePageTitle = useCallback((pageId: string, title: string) => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId ? { ...page, title } : page,
      ),
    );
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) => ({
        ...database,
        rows: database.rows.map((row) =>
          row.pageId === pageId
            ? { ...row, properties: { ...row.properties, title } }
            : row,
        ),
      })),
    );
  }, []);

  const updatePageContent = useCallback((pageId: string, content: Page["content"]) => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId ? { ...page, content } : page,
      ),
    );
  }, []);

  const updatePageCanvas = useCallback((pageId: string, canvas: CanvasData) => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId ? { ...page, canvas } : page,
      ),
    );
  }, []);

  const addInlineDatabase = useCallback((pageId: string, databaseId?: string) => {
    let database = databaseId
      ? databases.find((candidate) => candidate.id === databaseId)
      : undefined;
    if (!database) {
      database = createDefaultDatabase(null, "Inline Database");
      setDatabases((currentDatabases) => [database!, ...currentDatabases]);
    }

    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              inlineDatabaseIds: Array.from(
                new Set([...(page.inlineDatabaseIds ?? []), database!.id]),
              ),
            }
          : page,
      ),
    );
    return database;
  }, [databases]);

  const removeInlineDatabase = useCallback((pageId: string, databaseId: string) => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              inlineDatabaseIds: (page.inlineDatabaseIds ?? []).filter((id) => id !== databaseId),
            }
          : page,
      ),
    );
  }, []);

  const movePage = useCallback((pageId: string, parentId: string | null, targetId?: string) => {
    setPages((currentPages) => {
      const movingPage = currentPages.find((page) => page.id === pageId);
      if (!movingPage || pageId === parentId) {
        return currentPages;
      }

      const childIds = new Set<string>();
      const collectChildren = (id: string) => {
        for (const page of currentPages) {
          if (page.parentId === id) {
            childIds.add(page.id);
            collectChildren(page.id);
          }
        }
      };
      collectChildren(pageId);

      if (parentId && childIds.has(parentId)) {
        return currentPages;
      }

      const updatedPages = currentPages.map((page) =>
        page.id === pageId ? { ...page, parentId } : page,
      );

      if (!targetId || targetId === pageId) {
        return updatedPages;
      }

      const fromIndex = updatedPages.findIndex((page) => page.id === pageId);
      const toIndex = updatedPages.findIndex((page) => page.id === targetId);
      if (fromIndex < 0 || toIndex < 0) {
        return updatedPages;
      }

      const reorderedPages = [...updatedPages];
      const [movedPage] = reorderedPages.splice(fromIndex, 1);
      reorderedPages.splice(toIndex, 0, movedPage);
      return reorderedPages;
    });
  }, []);

  const updateDatabaseTitle = useCallback((databaseId: string, title: string) => {
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId ? { ...database, title } : database,
      ),
    );
  }, []);

  const addDatabaseProperty = useCallback((databaseId: string, type: DatabasePropertyType) => {
    const property: DatabaseProperty = {
      id: createId("prop"),
      name: type.replace("_", " "),
      type,
      options:
        type === "select" || type === "multi_select" || type === "status" || type === "tags"
          ? ["Option"]
          : undefined,
    };
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId
          ? {
              ...database,
              properties: [...database.properties, property],
              rows: database.rows.map((row) => ({
                ...row,
                properties: { ...row.properties, [property.id]: type === "checkbox" ? false : "" },
              })),
            }
          : database,
      ),
    );
  }, []);

  const updateDatabaseProperty = useCallback((databaseId: string, property: DatabaseProperty) => {
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId
          ? {
              ...database,
              properties: database.properties.map((candidate) =>
                candidate.id === property.id ? property : candidate,
              ),
            }
          : database,
      ),
    );
  }, []);

  const addDatabaseRow = useCallback((databaseId: string) => {
    const page = createUntitledPage(createId("page"), null, "New entry");
    const row: DatabaseRow = {
      id: createId("row"),
      pageId: page.id,
      properties: { title: page.title },
    };

    setPages((currentPages) => [page, ...currentPages]);
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId
          ? { ...database, rows: [row, ...database.rows] }
          : database,
      ),
    );
    return { row, page };
  }, []);

  const updateDatabaseCell = useCallback(
    (databaseId: string, rowId: string, propertyId: string, value: DatabaseValue) => {
      let rowPageId: string | undefined;
      setDatabases((currentDatabases) =>
        currentDatabases.map((database) =>
          database.id === databaseId
            ? {
                ...database,
                rows: database.rows.map((row) => {
                  if (row.id !== rowId) {
                    return row;
                  }
                  rowPageId = row.pageId;
                  return {
                    ...row,
                    properties: { ...row.properties, [propertyId]: value },
                  };
                }),
              }
            : database,
        ),
      );

      if (propertyId === "title" && rowPageId && typeof value === "string") {
        setPages((currentPages) =>
          currentPages.map((page) =>
            page.id === rowPageId ? { ...page, title: value } : page,
          ),
        );
      }
    },
    [],
  );

  const updateDatabaseView = useCallback((databaseId: string, view: DatabaseView) => {
    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId
          ? {
              ...database,
              defaultViewId: view.id,
              views: database.views.map((candidate) =>
                candidate.id === view.id ? view : candidate,
              ),
            }
          : database,
      ),
    );
  }, []);

  const addDatabaseView = useCallback((databaseId: string, type: DatabaseViewType) => {
    const view: DatabaseView = {
      id: createId("view"),
      name: type[0].toUpperCase() + type.slice(1),
      type,
    };

    setDatabases((currentDatabases) =>
      currentDatabases.map((database) =>
        database.id === databaseId
          ? {
              ...database,
              defaultViewId: view.id,
              views: [...database.views, view],
            }
          : database,
      ),
    );
    return view;
  }, []);

  const value = useMemo(
    () => ({
      pages,
      databases,
      isLoaded,
      saveStatus,
      createPage,
      createFolder,
      createDatabase,
      ensurePage,
      updatePageTitle,
      updatePageContent,
      updatePageCanvas,
      addInlineDatabase,
      removeInlineDatabase,
      movePage,
      updateDatabaseTitle,
      addDatabaseProperty,
      updateDatabaseProperty,
      addDatabaseRow,
      updateDatabaseCell,
      updateDatabaseView,
      addDatabaseView,
    }),
    [
      pages,
      databases,
      isLoaded,
      saveStatus,
      createPage,
      createFolder,
      createDatabase,
      ensurePage,
      updatePageTitle,
      updatePageContent,
      updatePageCanvas,
      addInlineDatabase,
      removeInlineDatabase,
      movePage,
      updateDatabaseTitle,
      addDatabaseProperty,
      updateDatabaseProperty,
      addDatabaseRow,
      updateDatabaseCell,
      updateDatabaseView,
      addDatabaseView,
    ],
  );

  return (
    <NotionStoreContext.Provider value={value}>
      {children}
    </NotionStoreContext.Provider>
  );
}

export function useNotionStore() {
  const store = useContext(NotionStoreContext);

  if (!store) {
    throw new Error("useNotionStore must be used within NotionStoreProvider");
  }

  return store;
}
