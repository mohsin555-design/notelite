"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { CanvasIcon, FolderFillIcon, PageIcon } from "@/components/NoteliteIcons";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type NewItemMenuProps = {
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  onCreateFolder: () => void;
  onCreatePage: () => void;
  onCreateCanvas: () => void;
};

export function NewItemMenu({
  align = "right",
  className,
  buttonClassName,
  onCreateFolder,
  onCreatePage,
  onCreateCanvas,
}: NewItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  function run(action: () => void) {
    action();
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <Button
        type="button"
        className={cn(
          "h-8 rounded-md bg-black px-3 text-sm font-semibold text-white hover:bg-black/85",
          buttonClassName,
        )}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Plus className="size-4" />
        New
      </Button>
      {isOpen ? (
        <div
          className={cn(
            "absolute top-10 z-40 w-40 rounded-xl border border-[#e5e7eb] bg-white p-2 text-sm text-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => run(onCreateFolder)}>
            <FolderFillIcon className="size-4 text-[#1a1a1a]" />
            Folder
          </button>
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => run(onCreatePage)}>
            <PageIcon className="size-4 text-[#1a1a1a]" />
            Page
          </button>
          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f4f6]" onClick={() => run(onCreateCanvas)}>
            <CanvasIcon className="size-4 text-[#1a1a1a]" />
            Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
