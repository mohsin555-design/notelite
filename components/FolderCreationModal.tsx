"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_FOLDER_COLOR,
  DEFAULT_FOLDER_NAME,
  type FolderColor,
  folderColorOptions,
} from "@/lib/folder-utils";
import { cn } from "@/lib/utils";

type FolderCreationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, folderColor: FolderColor) => void;
};

export function FolderCreationModal({ isOpen, onClose, onCreate }: FolderCreationModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(DEFAULT_FOLDER_NAME);
  const [folderColor, setFolderColor] = useState<FolderColor>(DEFAULT_FOLDER_COLOR);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(DEFAULT_FOLDER_NAME);
    setFolderColor(DEFAULT_FOLDER_COLOR);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 px-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-folder-title"
        className="w-full max-w-[380px] rounded-lg border border-[#e6e6e6] bg-white p-4 text-[#1a1a1a] shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(name.trim() || DEFAULT_FOLDER_NAME, folderColor);
        }}
      >
        <h2 id="create-folder-title" className="text-base font-semibold">
          New folder
        </h2>

        <label className="mt-4 block text-xs font-medium text-[#727272]" htmlFor="create-folder-name">
          Folder name
        </label>
        <input
          ref={inputRef}
          id="create-folder-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-9 w-full rounded-lg border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus:border-[#8e8e93] focus:ring-2 focus:ring-[#8e8e93]/20"
        />

        <div className="mt-4">
          <div className="text-xs font-medium text-[#727272]">Folder color</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {folderColorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={folderColor === option.value}
                className={cn(
                  "flex h-10 items-center justify-center rounded-md border border-[#e1e1e1] bg-white transition-colors hover:bg-[#f7f7f7]",
                  folderColor === option.value && "border-[#1e1e1e]",
                )}
                onClick={() => setFolderColor(option.value)}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-full", option.swatch)}>
                  {folderColor === option.value ? (
                    <Check className={cn("size-4", option.value === "neutral" ? "text-[#1a1a1a]" : "text-white")} />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="h-9 rounded-md px-3 text-sm hover:bg-[#f2f2f2]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="h-9 rounded-md bg-[#1e1e1e] px-3 text-sm font-medium text-white hover:bg-[#303030]">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
