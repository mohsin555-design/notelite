"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table2,
} from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { Page } from "@/lib/notion-types";
import { cn } from "@/lib/utils";

type BlockProps = {
  content: Page["content"];
  onChange: (content: Page["content"]) => void;
};

export function Block({ content, onChange }: BlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

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

  const actions = [
    {
      label: "Paragraph",
      icon: Pilcrow,
      active: editor.isActive("paragraph"),
      onClick: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Heading 1",
      icon: Heading1,
      active: editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Checklist",
      icon: CheckSquare,
      active: editor.isActive("taskList"),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      label: "Code block",
      icon: Code,
      active: editor.isActive("codeBlock"),
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      active: editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Divider",
      icon: Minus,
      active: false,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      label: "Image",
      icon: ImageIcon,
      active: editor.isActive("image"),
      onClick: () => {
        const src = window.prompt("Image URL");
        if (src) {
          editor.chain().focus().setImage({ src }).run();
        }
      },
    },
    {
      label: "Table",
      icon: Table2,
      active: editor.isActive("table"),
      onClick: () =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      label: "Page link",
      icon: Link2,
      active: false,
      onClick: () => editor.chain().focus().insertContent("[[Page name]]").run(),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-background/95 py-2 backdrop-blur">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              key={action.label}
              type="button"
              variant={action.active ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={action.label}
              title={action.label}
              onClick={action.onClick}
              className={cn(action.active && "bg-muted")}
            >
              <Icon />
            </Button>
          );
        })}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
