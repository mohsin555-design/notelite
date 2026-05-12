"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { Button } from "@/components/ui/button";
import type { Page } from "@/lib/notion-types";
import { cn } from "@/lib/utils";

type PageHeadProps = {
  title: string;
  breadcrumbs: Page[];
  breadcrumbCurrentLabel?: string;
  addControl: ReactNode;
  onOpenMore: () => void;
  moreMenu?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
  moreButtonRef?: RefObject<HTMLButtonElement | null>;
};

function pageLabel(page: Page) {
  return page.title.trim() || (page.type === "folder" ? "Untitled" : "Untitled");
}

export function PageHead({
  title,
  breadcrumbs,
  breadcrumbCurrentLabel,
  addControl,
  onOpenMore,
  moreMenu,
  secondaryActions,
  className,
  moreButtonRef,
}: PageHeadProps) {
  const visibleTitle = title.trim() || "Untitled";
  const visibleCurrentCrumb = breadcrumbCurrentLabel?.trim();
  const hasBreadcrumbs = breadcrumbs.length > 0 || Boolean(visibleCurrentCrumb);

  return (
    <header
      className={cn(
        "flex min-h-[61px] w-full items-center gap-3 overflow-visible border-b border-transparent px-4 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-col items-start justify-center">
          {hasBreadcrumbs ? (
            <nav aria-label="Breadcrumb" className="mb-1 flex max-w-full items-center gap-1 overflow-hidden text-sm leading-5 text-[#727272]">
              <Link href="/dashboard" className="shrink-0 rounded-sm text-[#0062ff] hover:text-[#0052d4]">
                Home
              </Link>
              {breadcrumbs.map((breadcrumb) => (
                <span key={breadcrumb.id} className="flex min-w-0 items-center gap-1">
                  <span className="shrink-0 text-[#b3b3b3]">/</span>
                  <Link href={`/page/${breadcrumb.id}`} className="truncate rounded-sm hover:text-[#1e1e1e]">
                    {pageLabel(breadcrumb)}
                  </Link>
                </span>
              ))}
              {visibleCurrentCrumb ? (
                <span className="flex min-w-0 items-center gap-1">
                  <span className="shrink-0 text-[#b3b3b3]">/</span>
                  <span className="truncate text-[#1e1e1e]">{visibleCurrentCrumb}</span>
                </span>
              ) : null}
            </nav>
          ) : null}
          <h1 className="max-w-full truncate text-[24px] font-bold leading-[1.2] tracking-normal text-[#1e1e1e]">
            {visibleTitle}
          </h1>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        {secondaryActions}
        {addControl}
        <Button
          ref={moreButtonRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="More actions"
          className="h-7 w-7 rounded-md bg-white/80 p-1.5 text-[#1e1e1e] hover:bg-[#f5f5f5]"
          onClick={onOpenMore}
        >
          <MoreHorizontal className="size-4" />
        </Button>
        {moreMenu}
      </div>
    </header>
  );
}

export function PageHeadAddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="h-7 rounded-md border-[#2c2c2c] bg-[#2c2c2c] px-2 text-xs font-semibold text-[#f3f3f3] shadow-[0_1px_0_rgba(31,35,40,0.04)] hover:bg-[#1f1f1f]"
      onClick={onClick}
    >
      <Plus className="size-4" />
      Add
    </Button>
  );
}
