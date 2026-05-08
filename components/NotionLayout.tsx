"use client";

import { useState } from "react";

import { Sidebar } from "@/components/Sidebar";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";

export function NotionLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <main className="flex h-screen min-h-screen overflow-hidden bg-background text-foreground">
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <section className="min-w-0 flex-1">{children}</section>
      <WorkspaceSearch isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </main>
  );
}
