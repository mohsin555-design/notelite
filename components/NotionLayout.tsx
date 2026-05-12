"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Sidebar } from "@/components/Sidebar";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";
import { useNotionStore } from "@/lib/notion-store";
import { WorkspaceTabsProvider, type WorkspaceTab } from "@/lib/workspace-tabs";

const WORKSPACE_TABS_STORAGE_KEY = "notelite.workspace-tabs";
const WORKSPACE_ACTIVE_TAB_STORAGE_KEY = "notelite.workspace-active-tab-id";

function createTabId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tab-${crypto.randomUUID()}`;
  }

  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTabLabel(pathname: string, tabs: PageLike[]) {
  if (pathname === "/dashboard") {
    return "Dashboard";
  }

  if (pathname === "/library") {
    return "Library";
  }

  if (pathname.startsWith("/page/")) {
    const itemId = pathname.slice("/page/".length);
    const item = tabs.find((candidate) => candidate.id === itemId);
    return item?.title?.trim() || "Untitled";
  }

  return "Untitled";
}

type PageLike = {
  id: string;
  title: string;
};

export function NotionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pages } = useNotionStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const savedTabs = window.sessionStorage.getItem(WORKSPACE_TABS_STORAGE_KEY);
      if (!savedTabs) {
        return [];
      }

      const parsedTabs = JSON.parse(savedTabs) as WorkspaceTab[];
      if (!Array.isArray(parsedTabs)) {
        return [];
      }

      const hydratedTabs = parsedTabs.map((tab) => ({
        id: typeof tab.id === "string" ? tab.id : createTabId(),
        href: tab.href,
        label: tab.label,
      }));

      return hydratedTabs.length > 1 ? hydratedTabs : [];
    } catch {
      return [];
    }
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedActiveTabId = window.sessionStorage.getItem(WORKSPACE_ACTIVE_TAB_STORAGE_KEY);
    return savedActiveTabId;
  });
  const activeHref = pathname || "/dashboard";

  const currentLabel = useMemo(() => getTabLabel(activeHref, pages), [activeHref, pages]);

  useEffect(() => {
    if (tabs.length > 1) {
      window.sessionStorage.setItem(WORKSPACE_TABS_STORAGE_KEY, JSON.stringify(tabs));
      return;
    }

    window.sessionStorage.removeItem(WORKSPACE_TABS_STORAGE_KEY);
  }, [tabs]);

  useEffect(() => {
    if (activeTabId && tabs.length > 1) {
      window.sessionStorage.setItem(WORKSPACE_ACTIVE_TAB_STORAGE_KEY, activeTabId);
      return;
    }

    window.sessionStorage.removeItem(WORKSPACE_ACTIVE_TAB_STORAGE_KEY);
  }, [activeTabId, tabs.length]);

  useEffect(() => {
    if (!activeHref) {
      return;
    }

    if (tabs.length === 0 || !activeTabId) {
      return;
    }

    setTabs((currentTabs) => {
      const activeIndex = currentTabs.findIndex((tab) => tab.id === activeTabId);
      if (activeIndex >= 0) {
        return currentTabs.map((tab, index) =>
          index === activeIndex ? { ...tab, href: activeHref, label: currentLabel } : tab,
        );
      }

      return currentTabs;
    });
  }, [activeHref, activeTabId, currentLabel, tabs.length]);

  function openTab(tab: WorkspaceTab, options?: { activate?: boolean }) {
    const nextTabs = (() => {
      const currentTabs = tabs;
      const hasActiveTab = Boolean(activeTabId && currentTabs.some((existingTab) => existingTab.id === activeTabId));
      const currentTab = { id: activeTabId ?? createTabId(), href: activeHref, label: currentLabel };
      const withCurrentTab = hasActiveTab
        ? currentTabs.map((existingTab) =>
            existingTab.id === activeTabId ? currentTab : existingTab,
          )
        : [...currentTabs, currentTab];
      const nextTab = { ...tab, id: tab.id || createTabId() };

      return [...withCurrentTab, nextTab];
    })();

    setTabs(nextTabs);
    setActiveTabId(nextTabs[nextTabs.length - 1]?.id ?? null);
    window.sessionStorage.setItem(WORKSPACE_TABS_STORAGE_KEY, JSON.stringify(nextTabs));
    window.sessionStorage.setItem(
      WORKSPACE_ACTIVE_TAB_STORAGE_KEY,
      nextTabs[nextTabs.length - 1]?.id ?? "",
    );

    if (options?.activate ?? true) {
      router.push(nextTabs[nextTabs.length - 1]?.href ?? tab.href);
    }
  }

  function activateTab(tabId: string) {
    const tab = tabs.find((candidate) => candidate.id === tabId);
    if (!tab) {
      return;
    }

    setActiveTabId(tabId);
    router.push(tab.href);
  }

  function closeTab(tabId: string) {
    setTabs((currentTabs) => {
      const closingIndex = currentTabs.findIndex((tab) => tab.id === tabId);
      const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (nextTabs.length <= 1) {
        const remainingTab = nextTabs[0] ?? null;
        setActiveTabId(null);
        if (tabId === activeTabId) {
          router.push(remainingTab?.href ?? "/dashboard");
        }
        return [];
      }

      if (tabId === activeTabId) {
        const fallbackTab = nextTabs[Math.max(0, closingIndex - 1)] ?? nextTabs[0] ?? null;
        setActiveTabId(fallbackTab?.id ?? null);
        router.push(fallbackTab?.href ?? "/dashboard");
      }

      return nextTabs;
    });
  }

  return (
    <WorkspaceTabsProvider value={{ tabs, activeHref, openTab, closeTab, activateTab }}>
      <main className="flex h-screen min-h-screen overflow-hidden bg-background text-foreground">
        <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {tabs.length > 1 ? (
            <div className="flex h-11 items-end gap-1 overflow-x-auto border-b border-[#dedede] bg-[#f6f6f6] px-3 pt-2">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;

                return (
                  <div
                    key={tab.id}
                    className={`group flex h-9 min-w-0 max-w-[240px] items-center rounded-t-lg border border-b-0 px-2 ${
                      isActive ? "border-[#d5d5d5] bg-white" : "border-transparent bg-[#ececec] hover:bg-[#e7e7e7]"
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-sm font-medium text-[#1e1e1e]"
                      onClick={() => activateTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                    <button
                      type="button"
                      aria-label={`Close ${tab.label}`}
                      className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-md text-[#727272] opacity-0 hover:bg-[#efefef] hover:text-[#1e1e1e] group-hover:opacity-100"
                      onClick={() => closeTab(tab.id)}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
          <section className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</section>
        </section>
        <WorkspaceSearch isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </main>
    </WorkspaceTabsProvider>
  );
}
