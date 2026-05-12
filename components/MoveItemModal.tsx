"use client";

import { Check, FolderPlus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { FolderColor } from "@/lib/folder-utils";
import type { FolderTarget } from "@/lib/workspace-items";
import { cn } from "@/lib/utils";

type MoveItemModalProps = {
  isOpen: boolean;
  title: string;
  currentParentId: string | null;
  targets: FolderTarget[];
  onClose: () => void;
  onMove: (parentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null, folderColor: FolderColor) => void;
};

export function MoveItemModal({
  isOpen,
  title,
  currentParentId,
  targets,
  onClose,
  onMove,
  onCreateFolder,
}: MoveItemModalProps) {
  const [query, setQuery] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(currentParentId);

  useEffect(() => {
    if (isOpen) {
      setSelectedParentId(currentParentId);
      setQuery("");
    }
  }, [currentParentId, isOpen]);

  const visibleTargets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return targets;
    }

    return targets.filter((target) => target.title.toLowerCase().includes(normalizedQuery));
  }, [query, targets]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-[460px] rounded-lg border border-[#e6e6e6] bg-white p-4 text-[#1a1a1a] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h2 className="text-base font-semibold">{title}</h2>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#727272]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search folder"
            className="h-9 w-full rounded-lg border border-[#d8d8d8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#8e8e93] focus:ring-2 focus:ring-[#8e8e93]/20"
          />
        </div>

        <div className="mt-4 max-h-[280px] overflow-y-auto rounded-lg border border-[#ececec] p-1">
          {visibleTargets.map((target) => {
            const isSelected = (target.id ?? null) === selectedParentId;

            return (
              <button
                key={target.id ?? "root"}
                type="button"
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-[#f5f5f5]",
                  isSelected && "bg-[#f7f7f7]",
                )}
                onClick={() => setSelectedParentId(target.id ?? null)}
              >
                <span className="text-[#b3b3b3]" style={{ width: target.depth * 14 }} aria-hidden="true" />
                <span className="flex-1 truncate">{target.title}</span>
                {isSelected ? <Check className="size-4 text-[#1a1a1a]" /> : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-3 flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f3f4f6]"
          onClick={() => onCreateFolder("New Folder", selectedParentId, "neutral")}
        >
          <FolderPlus className="size-4" />
          Create folder here
        </button>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="h-9 rounded-md px-3 text-sm hover:bg-[#f2f2f2]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="h-9 rounded-md bg-[#1e1e1e] px-3 text-sm font-medium text-white hover:bg-[#303030]"
            onClick={() => onMove(selectedParentId)}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
