"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  AtSign,
  Bookmark,
  CalendarDays,
  CheckSquare,
  Columns3,
  Code,
  Database as DatabaseIcon,
  File,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Minus,
  MousePointerClick,
  Pilcrow,
  Quote,
  Smile,
  Table2,
  TextQuote,
  Video,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { DatabaseViewType, Page } from "@/lib/notion-types";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type BlockProps = {
  content: Page["content"];
  onChange: (content: Page["content"]) => void;
  onCreateInlineDatabase?: (viewType?: DatabaseViewType) => void;
};

type SlashMenuState = {
  x: number;
  y: number;
  range: { from: number; to: number };
  selectedIndex: number;
};

type SlashCommand = {
  label: string;
  description: string;
  category: "Basic blocks" | "Media" | "Database" | "Advanced blocks" | "Inline";
  icon: typeof Pilcrow;
  run: () => void;
};

export function Block({ content, onChange, onCreateInlineDatabase }: BlockProps) {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const slashMenuRef = useRef<SlashMenuState | null>(null);
  const slashPopoverRef = useRef<HTMLDivElement | null>(null);
  const slashCommandsRef = useRef<SlashCommand[]>([]);
  const filteredSlashCommandsRef = useRef<SlashCommand[]>([]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "notelite-prose min-h-[420px] rounded-md px-1 pb-32 pt-1 outline-none focus-mode:mx-auto focus-mode:max-w-2xl",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "/") {
          window.setTimeout(() => {
            const position = view.state.selection.from;
            const coords = view.coordsAtPos(position);
            setSlashMenu({
              x: coords.left,
              y: coords.bottom + 8,
              range: { from: Math.max(position - 1, 0), to: position },
              selectedIndex: 0,
            });
          });
          return false;
        }

        const currentSlashMenu = slashMenuRef.current;
        if (!currentSlashMenu) {
          return false;
        }

        if (event.key === "Escape") {
          setSlashMenu(null);
          return true;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? {
                  ...current,
                  selectedIndex: Math.min(
                    current.selectedIndex + 1,
                    Math.max(filteredSlashCommandsRef.current.length - 1, 0),
                  ),
                }
              : current,
          );
          return true;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? { ...current, selectedIndex: Math.max(current.selectedIndex - 1, 0) }
              : current,
          );
          return true;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          filteredSlashCommandsRef.current[currentSlashMenu.selectedIndex]?.run();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    slashMenuRef.current = slashMenu;
  }, [slashMenu]);

  useClickOutside(slashPopoverRef, () => setSlashMenu(null), Boolean(slashMenu));

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentContent = editor.getJSON();
    if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  const runFromSlash = (command: () => void) => {
    if (!slashMenu) {
      command();
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange({ from: slashMenu.range.from, to: editor.state.selection.from })
      .run();
    window.setTimeout(command);
    setSlashMenu(null);
  };

  const slashCommands: SlashCommand[] = [
    {
      label: "Text",
      description: "Plain paragraph block",
      category: "Basic blocks",
      icon: Pilcrow,
      run: () => runFromSlash(() => editor.chain().focus().setParagraph().run()),
    },
    {
      label: "Heading 1",
      description: "Large section heading",
      category: "Basic blocks",
      icon: Heading1,
      run: () => runFromSlash(() => editor.chain().focus().toggleHeading({ level: 1 }).run()),
    },
    {
      label: "Heading 2",
      description: "Medium section heading",
      category: "Basic blocks",
      icon: Heading2,
      run: () => runFromSlash(() => editor.chain().focus().toggleHeading({ level: 2 }).run()),
    },
    {
      label: "Heading 3",
      description: "Small section heading",
      category: "Basic blocks",
      icon: Heading3,
      run: () => runFromSlash(() => editor.chain().focus().toggleHeading({ level: 3 }).run()),
    },
    {
      label: "Heading 4",
      description: "Compact heading",
      category: "Basic blocks",
      icon: Heading3,
      run: () => runFromSlash(() => editor.chain().focus().toggleHeading({ level: 4 }).run()),
    },
    {
      label: "Bulleted list",
      description: "Simple bullet list",
      category: "Basic blocks",
      icon: List,
      run: () => runFromSlash(() => editor.chain().focus().toggleBulletList().run()),
    },
    {
      label: "Numbered list",
      description: "Ordered list",
      category: "Basic blocks",
      icon: ListOrdered,
      run: () => runFromSlash(() => editor.chain().focus().toggleOrderedList().run()),
    },
    {
      label: "Checklist",
      description: "To-do items with checkboxes",
      category: "Basic blocks",
      icon: CheckSquare,
      run: () => runFromSlash(() => editor.chain().focus().toggleTaskList().run()),
    },
    {
      label: "Toggle list",
      description: "Collapsible note starter",
      category: "Basic blocks",
      icon: List,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertContent("> Toggle title\n\nHidden details").run(),
        ),
    },
    {
      label: "Callout",
      description: "Highlighted note block",
      category: "Basic blocks",
      icon: TextQuote,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertContent("> 💡 Callout").run(),
        ),
    },
    {
      label: "Code block",
      description: "Formatted code area",
      category: "Media",
      icon: Code,
      run: () => runFromSlash(() => editor.chain().focus().toggleCodeBlock().run()),
    },
    {
      label: "Quote",
      description: "Indented quote block",
      category: "Basic blocks",
      icon: Quote,
      run: () => runFromSlash(() => editor.chain().focus().toggleBlockquote().run()),
    },
    {
      label: "Divider",
      description: "Horizontal separator",
      category: "Basic blocks",
      icon: Minus,
      run: () => runFromSlash(() => editor.chain().focus().setHorizontalRule().run()),
    },
    {
      label: "Image",
      description: "Embed by URL",
      category: "Media",
      icon: ImageIcon,
      run: () =>
        runFromSlash(() => {
        const src = window.prompt("Image URL");
        if (src) {
          editor.chain().focus().setImage({ src }).run();
        }
        }),
    },
    {
      label: "Video",
      description: "Add a video URL",
      category: "Media",
      icon: Video,
      run: () =>
        runFromSlash(() => {
          const src = window.prompt("Video URL");
          if (src) {
            editor.chain().focus().insertContent(`Video: ${src}`).run();
          }
        }),
    },
    {
      label: "Audio",
      description: "Add an audio URL",
      category: "Media",
      icon: Volume2,
      run: () =>
        runFromSlash(() => {
          const src = window.prompt("Audio URL");
          if (src) {
            editor.chain().focus().insertContent(`Audio: ${src}`).run();
          }
        }),
    },
    {
      label: "File",
      description: "Attach a file link",
      category: "Media",
      icon: File,
      run: () =>
        runFromSlash(() => {
          const src = window.prompt("File URL");
          if (src) {
            editor.chain().focus().insertContent(`File: ${src}`).run();
          }
        }),
    },
    {
      label: "Web bookmark",
      description: "Save a link card",
      category: "Media",
      icon: Bookmark,
      run: () =>
        runFromSlash(() => {
          const src = window.prompt("Bookmark URL");
          if (src) {
            editor.chain().focus().insertContent(`🔖 ${src}`).run();
          }
        }),
    },
    {
      label: "Table",
      description: "Basic editable table",
      category: "Basic blocks",
      icon: Table2,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        ),
    },
    {
      label: "Page link",
      description: "Create a [[page]] reference",
      category: "Basic blocks",
      icon: Link2,
      run: () => runFromSlash(() => editor.chain().focus().insertContent("[[Page name]]").run()),
    },
    {
      label: "Button",
      description: "Inline action placeholder",
      category: "Advanced blocks",
      icon: MousePointerClick,
      run: () => runFromSlash(() => editor.chain().focus().insertContent("[ Button ]").run()),
    },
    {
      label: "Table of contents",
      description: "Section placeholder",
      category: "Advanced blocks",
      icon: List,
      run: () => runFromSlash(() => editor.chain().focus().insertContent("Table of contents").run()),
    },
    {
      label: "2 columns",
      description: "Two-column table layout",
      category: "Advanced blocks",
      icon: Columns3,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertTable({ rows: 1, cols: 2, withHeaderRow: false }).run(),
        ),
    },
    {
      label: "3 columns",
      description: "Three-column table layout",
      category: "Advanced blocks",
      icon: Columns3,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertTable({ rows: 1, cols: 3, withHeaderRow: false }).run(),
        ),
    },
    {
      label: "Database table",
      description: "Inline database view",
      category: "Database",
      icon: DatabaseIcon,
      run: () => runFromSlash(() => onCreateInlineDatabase?.("table")),
    },
    {
      label: "Database board",
      description: "Inline Kanban view",
      category: "Database",
      icon: DatabaseIcon,
      run: () => runFromSlash(() => onCreateInlineDatabase?.("board")),
    },
    {
      label: "Database list",
      description: "Inline list view",
      category: "Database",
      icon: DatabaseIcon,
      run: () => runFromSlash(() => onCreateInlineDatabase?.("list")),
    },
    {
      label: "Database calendar",
      description: "Inline calendar view",
      category: "Database",
      icon: CalendarDays,
      run: () => runFromSlash(() => onCreateInlineDatabase?.("calendar")),
    },
    {
      label: "Database gallery",
      description: "Inline card gallery",
      category: "Database",
      icon: DatabaseIcon,
      run: () => runFromSlash(() => onCreateInlineDatabase?.("gallery")),
    },
    {
      label: "Mention a person",
      description: "Insert @ mention",
      category: "Inline",
      icon: AtSign,
      run: () => runFromSlash(() => editor.chain().focus().insertContent("@Mohsin").run()),
    },
    {
      label: "Date or reminder",
      description: "Insert today's date",
      category: "Inline",
      icon: CalendarDays,
      run: () =>
        runFromSlash(() =>
          editor.chain().focus().insertContent(new Date().toLocaleDateString()).run(),
        ),
    },
    {
      label: "Emoji",
      description: "Insert a simple emoji",
      category: "Inline",
      icon: Smile,
      run: () => runFromSlash(() => editor.chain().focus().insertContent("✨").run()),
    },
  ];
  slashCommandsRef.current = slashCommands;

  const slashQuery = slashMenu
    ? editor.state.doc
        .textBetween(slashMenu.range.from + 1, editor.state.selection.from, "\n", "\n")
        .trim()
        .toLowerCase()
    : "";
  const filteredSlashCommands = slashCommands.filter((command) =>
    `${command.label} ${command.description} ${command.category}`.toLowerCase().includes(slashQuery),
  );
  filteredSlashCommandsRef.current = filteredSlashCommands;
  const groupedSlashCommands = filteredSlashCommands.reduce<Record<string, SlashCommand[]>>(
    (groups, command) => {
      groups[command.category] = [...(groups[command.category] ?? []), command];
      return groups;
    },
    {},
  );

  return (
    <div className="relative">
      <EditorContent editor={editor} />

      {slashMenu ? (
        <div
          ref={slashPopoverRef}
          className="fixed z-50 max-h-[28rem] w-96 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl"
          style={{ left: slashMenu.x, top: slashMenu.y }}
        >
          <div className="border-b px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium">/</span>
            {slashQuery ? slashQuery : "Type to search"}
          </div>
          {filteredSlashCommands.length ? (
            (() => {
              let visibleIndex = 0;
              return Object.entries(groupedSlashCommands).map(([category, commands]) => (
                <div key={category} className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {category}
                  </div>
                  {commands.map((command) => {
                    const Icon = command.icon;
                    const index = visibleIndex;
                    visibleIndex += 1;

                    return (
                      <button
                        key={command.label}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          command.run();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                          index === slashMenu.selectedIndex && "bg-muted",
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{command.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {command.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No blocks found.
            </div>
          )}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Type / to open, Esc to close
          </div>
        </div>
      ) : null}
    </div>
  );
}
