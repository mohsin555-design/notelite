"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Copy,
  ExternalLink,
  GalleryHorizontal,
  Kanban,
  List,
  MoreHorizontal,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type {
  Database,
  DatabaseProperty,
  DatabasePropertyType,
  DatabaseRow,
  DatabaseValue,
  DatabaseView as DatabaseViewModel,
  DatabaseViewType,
} from "@/lib/notion-types";
import { cn } from "@/lib/utils";
import { useNotionStore } from "@/lib/notion-store";
import { useClickOutside } from "@/lib/use-click-outside";

const propertyTypes: DatabasePropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "checkbox",
  "url",
  "email",
  "relation",
  "status",
  "tags",
  "rollup",
];

const viewIcons: Record<DatabaseViewType, typeof Table2> = {
  table: Table2,
  list: List,
  board: Kanban,
  calendar: CalendarDays,
  gallery: GalleryHorizontal,
};

function stringifyValue(value: DatabaseValue) {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

function matchesFilter(row: DatabaseRow, view: DatabaseViewModel) {
  if (!view.filter?.propertyId) {
    return true;
  }

  const value = row.properties[view.filter.propertyId];
  const target = view.filter.value;

  if (view.filter.operator === "checked") {
    return Boolean(value) === Boolean(target);
  }

  if (view.filter.operator === "contains") {
    return stringifyValue(value).toLowerCase().includes(stringifyValue(target).toLowerCase());
  }

  return stringifyValue(value) === stringifyValue(target);
}

function sortRows(rows: DatabaseRow[], view: DatabaseViewModel) {
  if (!view.sort?.propertyId) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    const left = stringifyValue(a.properties[view.sort!.propertyId]);
    const right = stringifyValue(b.properties[view.sort!.propertyId]);
    const result = left.localeCompare(right, undefined, { numeric: true });
    return view.sort!.direction === "asc" ? result : -result;
  });
}

function getDefaultValue(property: DatabaseProperty): DatabaseValue {
  if (property.type === "checkbox") return false;
  if (property.type === "number") return 0;
  if (property.type === "multi_select" || property.type === "tags" || property.type === "relation") return [];
  return "";
}

export function DatabaseView({
  databaseId,
  inline = false,
  parentPageId,
  onRemoveInline,
}: {
  databaseId: string;
  inline?: boolean;
  parentPageId?: string;
  onRemoveInline?: () => void;
}) {
  const router = useRouter();
  const {
    pages,
    databases,
    addDatabaseProperty,
    addDatabaseRow,
    addInlineDatabase,
    addDatabaseView,
    deleteDatabase,
    deleteDatabaseProperty,
    duplicateDatabase,
    duplicateDatabaseProperty,
    moveDatabase,
    moveDatabaseProperty,
    updateDatabaseCell,
    updateDatabaseProperty,
    updateDatabaseTitle,
    updateDatabaseView,
  } = useNotionStore();
  const database = databases.find((candidate) => candidate.id === databaseId);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [isDeleteDatabaseDialogOpen, setIsDeleteDatabaseDialogOpen] = useState(false);
  const [activePropertyMenuId, setActivePropertyMenuId] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<DatabaseRow | null>(null);
  const databaseMenuRef = useRef<HTMLDivElement | null>(null);
  const addViewMenuRef = useRef<HTMLDivElement | null>(null);
  const addPropertyMenuRef = useRef<HTMLDivElement | null>(null);
  const propertyMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(databaseMenuRef, () => setIsDatabaseMenuOpen(false), isDatabaseMenuOpen);
  useClickOutside(addViewMenuRef, () => setIsAddViewOpen(false), isAddViewOpen);
  useClickOutside(addPropertyMenuRef, () => setIsAddPropertyOpen(false), isAddPropertyOpen);
  useClickOutside(propertyMenuRef, () => setActivePropertyMenuId(null), activePropertyMenuId !== null);

  const activeView = useMemo(() => {
    if (!database) return null;
    return (
      database!.views.find((view) => view.id === database!.defaultViewId) ??
      database!.views[0]
    );
  }, [database]);

  const rows = useMemo(() => {
    if (!database || !activeView) return [];
    return sortRows(database!.rows.filter((row) => matchesFilter(row, activeView)), activeView);
  }, [activeView, database]);
  const openRowDetails = useMemo(() => {
    if (!database || !openRow) return null;
    return database.rows.find((row) => row.id === openRow.id) ?? openRow;
  }, [database, openRow]);

  if (!database || !activeView) {
    return <div className="text-sm text-muted-foreground">Database not found.</div>;
  }

  function updateView(patch: Partial<DatabaseViewModel>) {
    updateDatabaseView(database!.id, { ...activeView!, ...patch });
  }

  function renderPropertyInput(property: DatabaseProperty, row: DatabaseRow) {
    const value = row.properties[property.id] ?? getDefaultValue(property);

    if (property.type === "title") {
      return (
        <button
          type="button"
          onClick={() => setOpenRow(row)}
          className="font-medium hover:underline"
        >
          {stringifyValue(value) || "Untitled"}
        </button>
      );
    }

    if (property.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) =>
            updateDatabaseCell(database!.id, row.id, property.id, event.target.checked)
          }
        />
      );
    }

    if (property.type === "select" || property.type === "status") {
      return (
        <select
          value={stringifyValue(value)}
          onChange={(event) =>
            updateDatabaseCell(database!.id, row.id, property.id, event.target.value)
          }
          className="w-full rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">Empty</option>
          {(property.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (property.type === "multi_select" || property.type === "tags") {
      return (
        <Input
          value={Array.isArray(value) ? value.join(", ") : ""}
          onChange={(event) =>
            updateDatabaseCell(
              database!.id,
              row.id,
              property.id,
              event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            )
          }
          placeholder="tag, tag"
        />
      );
    }

    if (property.type === "relation") {
      const relatedDatabase = databases.find(
        (candidate) => candidate.id === property.relationDatabaseId,
      );
      const relatedRows = relatedDatabase?.rows ?? [];
      return (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(event) =>
            updateDatabaseCell(
              database!.id,
              row.id,
              property.id,
              Array.from(event.target.selectedOptions, (option) => option.value),
            )
          }
          className="min-h-16 w-full rounded-md border bg-background px-2 py-1 text-sm"
        >
          {relatedRows.map((relatedRow) => (
            <option key={relatedRow.id} value={relatedRow.pageId}>
              {pages.find((page) => page.id === relatedRow.pageId)?.title ?? "Untitled"}
            </option>
          ))}
        </select>
      );
    }

    if (property.type === "rollup") {
      const relation = database!.properties.find(
        (candidate) => candidate.id === property.rollupRelationPropertyId,
      );
      const related = relation ? row.properties[relation.id] : [];
      return <span>{Array.isArray(related) ? related.length : 0}</span>;
    }

    return (
      <Input
        type={property.type === "number" ? "number" : property.type === "date" ? "date" : "text"}
        value={stringifyValue(value)}
        onChange={(event) =>
          updateDatabaseCell(
            database!.id,
            row.id,
            property.id,
            property.type === "number" ? Number(event.target.value) : event.target.value,
          )
        }
        placeholder={property.name}
      />
    );
  }

  function handleDuplicateDatabase() {
    const copiedDatabase = duplicateDatabase(database!.id);
    if (copiedDatabase) {
      if (inline && parentPageId) {
        addInlineDatabase(parentPageId, copiedDatabase.id);
      } else if (copiedDatabase.parentId) {
        router.push(`/page/${copiedDatabase.parentId}`);
      } else {
        router.push("/dashboard");
      }
    }
    setIsDatabaseMenuOpen(false);
  }

  function handleDeleteDatabase() {
    setIsDatabaseMenuOpen(false);
    setIsDeleteDatabaseDialogOpen(true);
  }

  function confirmDeleteDatabase() {
    if (!database) {
      return;
    }

    deleteDatabase(database.id);
    setIsDeleteDatabaseDialogOpen(false);
    if (!inline) {
      router.push("/dashboard");
    }
  }

  function renderDatabaseMenu() {
    if (!isDatabaseMenuOpen) {
      return null;
    }

    return (
      <div className="absolute right-0 top-9 z-40 w-72 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl">
        <button
          type="button"
          onClick={handleDuplicateDatabase}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
        >
          <Copy className="size-4" />
          Duplicate database
        </button>
        <label className="block border-t px-3 py-2 text-xs font-medium text-muted-foreground">
          Move to
        </label>
        <select
          value={database!.parentId ?? parentPageId ?? ""}
          onChange={(event) => {
            const nextParentId = event.target.value || null;
            moveDatabase(database!.id, nextParentId);
            if (inline && parentPageId && nextParentId && nextParentId !== parentPageId) {
              onRemoveInline?.();
              addInlineDatabase(nextParentId, database!.id);
            }
            setIsDatabaseMenuOpen(false);
          }}
          className="mb-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {pages.filter((page) => page.type === "page").map((page) => (
            <option key={page.id} value={page.id}>
              {page.title || "Untitled"}
            </option>
          ))}
        </select>
        {inline && onRemoveInline ? (
          <button
            type="button"
            onClick={() => {
              onRemoveInline();
              setIsDatabaseMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
          >
            <X className="size-4" />
            Remove from this page
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDeleteDatabase}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
          Delete database
        </button>
      </div>
    );
  }

  function renderPropertyHeader(property: DatabaseProperty, index: number) {
    const isOpen = activePropertyMenuId === property.id;
    const canEditType = property.type !== "title";

    return (
      <div ref={isOpen ? propertyMenuRef : null} className="relative">
        <button
          type="button"
          onClick={() => {
            setIsAddPropertyOpen(false);
            setIsAddViewOpen(false);
            setIsDatabaseMenuOpen(false);
            setActivePropertyMenuId(isOpen ? null : property.id);
          }}
          className="flex h-7 w-full items-center justify-between gap-2 rounded-md px-1 text-left hover:bg-muted"
        >
          <span className="truncate">{property.name}</span>
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-8 z-30 w-72 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl">
            <Input
              value={property.name}
              onChange={(event) =>
                updateDatabaseProperty(database!.id, { ...property, name: event.target.value })
              }
              className="mb-1 h-9"
            />
            <select
              value={property.type}
              disabled={!canEditType}
              onChange={(event) =>
                updateDatabaseProperty(database!.id, {
                  ...property,
                  type: event.target.value as DatabasePropertyType,
                })
              }
              className="mb-1 h-9 w-full rounded-md border bg-background px-2 text-sm disabled:opacity-50"
            >
              {property.type === "title" ? <option value="title">title</option> : null}
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => moveDatabaseProperty(database!.id, property.id, "left")}
              disabled={index <= 1}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-40"
            >
              <ArrowLeft className="size-4" />
              Move left
            </button>
            <button
              type="button"
              onClick={() => moveDatabaseProperty(database!.id, property.id, "right")}
              disabled={index === database!.properties.length - 1}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-40"
            >
              <ArrowRight className="size-4" />
              Move right
            </button>
            <button
              type="button"
              onClick={() => duplicateDatabaseProperty(database!.id, property.id)}
              disabled={!canEditType}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-40"
            >
              <Copy className="size-4" />
              Duplicate property
            </button>
            <button
              type="button"
              onClick={() => {
                deleteDatabaseProperty(database!.id, property.id);
                setActivePropertyMenuId(null);
              }}
              disabled={!canEditType}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              Delete property
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderRows() {
    if (activeView!.type === "list") {
      return (
        <div className="divide-y rounded-lg border">
          {rows.map((row) => (
            <Link key={row.id} href={`/page/${row.pageId}`} className="block px-3 py-2 hover:bg-muted">
              {stringifyValue(row.properties.title) || "Untitled"}
            </Link>
          ))}
        </div>
      );
    }

    if (activeView!.type === "board") {
      const groupProperty = database!.properties.find((property) => property.id === activeView!.groupBy) ?? database!.properties.find((property) => property.type === "status");
      const groups = groupProperty?.options?.length ? groupProperty.options : ["Empty"];
      return (
        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <div key={group} className="rounded-lg border bg-muted/30 p-2">
              <div className="mb-2 text-sm font-medium">{group}</div>
              <div className="space-y-2">
                {rows
                  .filter((row) => stringifyValue(row.properties[groupProperty?.id ?? ""]) === group)
                  .map((row) => (
                    <Link key={row.id} href={`/page/${row.pageId}`} className="block rounded-md border bg-background p-3 text-sm hover:bg-muted">
                      {stringifyValue(row.properties.title) || "Untitled"}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeView!.type === "calendar") {
      const dateProperty = database!.properties.find((property) => property.type === "date");
      return (
        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <Link key={row.id} href={`/page/${row.pageId}`} className="rounded-lg border p-3 hover:bg-muted">
              <div className="text-xs text-muted-foreground">
                {stringifyValue(row.properties[dateProperty?.id ?? ""] || "No date")}
              </div>
              <div className="font-medium">{stringifyValue(row.properties.title) || "Untitled"}</div>
            </Link>
          ))}
        </div>
      );
    }

    if (activeView!.type === "gallery") {
      return (
        <div className="grid gap-3 md:grid-cols-3">
          {rows.map((row) => (
            <Link key={row.id} href={`/page/${row.pageId}`} className="min-h-32 rounded-lg border p-4 hover:bg-muted">
              <div className="font-medium">{stringifyValue(row.properties.title) || "Untitled"}</div>
              <div className="mt-2 text-sm text-muted-foreground">{stringifyValue(row.properties.status)}</div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              {database!.properties.map((property, index) => (
                <th key={property.id} className="border-b px-3 py-2 text-left font-medium">
                  {renderPropertyHeader(property, index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {database!.properties.map((property) => (
                  <td key={property.id} className="min-w-36 border-b px-3 py-2 align-top">
                    {renderPropertyInput(property, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className={cn("space-y-4", inline && "rounded-lg border p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={database!.title}
          onChange={(event) => updateDatabaseTitle(database!.id, event.target.value)}
          className="h-auto max-w-sm border-0 px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="relative flex items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setIsDatabaseMenuOpen(false);
              addDatabaseRow(database!.id);
            }}
            className="justify-start"
          >
            <Plus />
            New
          </Button>
          <div ref={databaseMenuRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Database actions"
              onClick={() => {
                setIsAddPropertyOpen(false);
                setIsAddViewOpen(false);
                setActivePropertyMenuId(null);
                setIsDatabaseMenuOpen((isOpen) => !isOpen);
              }}
            >
              <MoreHorizontal />
            </Button>
            {renderDatabaseMenu()}
          </div>
        </div>
      </div>
      {isDeleteDatabaseDialogOpen ? (
        <ConfirmDialog
          title="Delete database"
          description={`Delete "${database!.title}"? This removes its views and rows.`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setIsDeleteDatabaseDialogOpen(false)}
          onConfirm={confirmDeleteDatabase}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {database!.views.map((view) => {
          const Icon = viewIcons[view.type];
          return (
            <Button
              key={view.id}
              type="button"
              variant={view.id === activeView!.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => updateView({ ...view })}
            >
              <Icon />
              {view.name}
            </Button>
          );
        })}
        <div ref={addViewMenuRef} className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddPropertyOpen(false);
              setIsDatabaseMenuOpen(false);
              setActivePropertyMenuId(null);
              setIsAddViewOpen((isOpen) => !isOpen);
            }}
          >
            <Plus />
            New view
          </Button>
          {isAddViewOpen ? (
            <div className="absolute left-0 top-9 z-30 w-56 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl">
              {(["table", "list", "board", "calendar", "gallery"] as DatabaseViewType[]).map((type) => {
                const Icon = viewIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      addDatabaseView(database!.id, type);
                      setIsAddViewOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left capitalize hover:bg-muted"
                  >
                    <Icon className="size-4" />
                    {type}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <select
          value={activeView!.filter?.propertyId ?? ""}
          onChange={(event) =>
            updateView({
              filter: event.target.value
                ? { propertyId: event.target.value, operator: "contains", value: "" }
                : undefined,
            })
          }
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">No filter</option>
          {database!.properties.map((property) => (
            <option key={property.id} value={property.id}>Filter: {property.name}</option>
          ))}
        </select>
        <Input
          value={stringifyValue(activeView!.filter?.value ?? "")}
          onChange={(event) =>
            updateView({
              filter: activeView!.filter
                ? { ...activeView!.filter, value: event.target.value }
                : undefined,
            })
          }
          placeholder="Filter value"
        />
        <select
          value={activeView!.sort?.propertyId ?? ""}
          onChange={(event) =>
            updateView({
              sort: event.target.value
                ? { propertyId: event.target.value, direction: "asc" }
                : undefined,
            })
          }
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">No sort</option>
          {database!.properties.map((property) => (
            <option key={property.id} value={property.id}>Sort: {property.name}</option>
          ))}
        </select>
        <select
          value={activeView!.groupBy ?? ""}
          onChange={(event) => updateView({ groupBy: event.target.value || undefined })}
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">No grouping</option>
          {database!.properties.map((property) => (
            <option key={property.id} value={property.id}>Group: {property.name}</option>
          ))}
        </select>
      </div>

      <div ref={addPropertyMenuRef} className="relative flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setIsAddViewOpen(false);
            setIsDatabaseMenuOpen(false);
            setActivePropertyMenuId(null);
            setIsAddPropertyOpen((isOpen) => !isOpen);
          }}
        >
          <Plus />
          Add property
        </Button>
        {isAddPropertyOpen ? (
          <div className="absolute left-0 top-10 z-30 grid w-[30rem] grid-cols-2 gap-1 rounded-lg border bg-popover p-2 text-sm text-popover-foreground shadow-xl">
            {propertyTypes
              .filter((type) => type !== "title")
              .map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    addDatabaseProperty(database!.id, type);
                    setIsAddPropertyOpen(false);
                  }}
                  className="rounded-md px-3 py-2 text-left capitalize hover:bg-muted"
                >
                  {type.replace("_", " ")}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      {renderRows()}

      {openRowDetails ? (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOpenRow(null)}>
          <aside
            className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/page/${openRowDetails.pageId}`}>
                  <ExternalLink />
                  Open full page
                </Link>
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpenRow(null)}>
                <X />
              </Button>
            </div>
            <Input
              value={stringifyValue(openRowDetails.properties.title)}
              onChange={(event) =>
                updateDatabaseCell(database!.id, openRowDetails.id, "title", event.target.value)
              }
              className="mb-6 h-auto border-0 px-0 text-4xl font-bold shadow-none focus-visible:ring-0"
            />
            <div className="space-y-3">
              {database!.properties
                .filter((property) => property.type !== "title")
                .map((property) => (
                  <div key={property.id} className="grid gap-2 border-b pb-3 md:grid-cols-[10rem_1fr]">
                    <div className="text-sm text-muted-foreground">{property.name}</div>
                    <div>{renderPropertyInput(property, openRowDetails)}</div>
                  </div>
                ))}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
