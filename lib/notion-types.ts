import type { JSONContent } from "@tiptap/core";

export type CanvasData = {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};

export type Block = {
  id: string;
  type: "text";
  content: string;
};

export type Page = {
  id: string;
  title: string;
  type: "page" | "folder";
  parentId: string | null;
  content: JSONContent;
  canvas: CanvasData;
  inlineDatabaseIds?: string[];
  folderColor?: string;
  isFavorite?: boolean;
};

export type DatabasePropertyType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "relation"
  | "status"
  | "tags"
  | "rollup";

export type DatabaseProperty = {
  id: string;
  name: string;
  type: DatabasePropertyType;
  options?: string[];
  relationDatabaseId?: string;
  rollupRelationPropertyId?: string;
};

export type DatabaseValue = string | number | boolean | string[] | null;

export type DatabaseRow = {
  id: string;
  pageId: string;
  properties: Record<string, DatabaseValue>;
};

export type DatabaseViewType = "table" | "list" | "board" | "calendar" | "gallery";

export type DatabaseFilter = {
  propertyId: string;
  operator: "is" | "contains" | "checked" | "on";
  value: DatabaseValue;
};

export type DatabaseSort = {
  propertyId: string;
  direction: "asc" | "desc";
};

export type DatabaseView = {
  id: string;
  name: string;
  type: DatabaseViewType;
  filter?: DatabaseFilter;
  sort?: DatabaseSort;
  groupBy?: string;
};

export type Database = {
  id: string;
  title: string;
  parentId: string | null;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  defaultViewId: string;
};

export type WorkspaceData = {
  pages: Page[];
  databases: Database[];
};
