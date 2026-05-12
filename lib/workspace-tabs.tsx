"use client";

import { createContext, useContext } from "react";

export type WorkspaceTab = {
  id: string;
  href: string;
  label: string;
};

export type WorkspaceTabsContextValue = {
  tabs: WorkspaceTab[];
  activeHref: string;
  openTab: (tab: WorkspaceTab, options?: { activate?: boolean }) => void;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
};

const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null);

export function WorkspaceTabsProvider({
  value,
  children,
}: {
  value: WorkspaceTabsContextValue;
  children: React.ReactNode;
}) {
  return <WorkspaceTabsContext.Provider value={value}>{children}</WorkspaceTabsContext.Provider>;
}

export function useWorkspaceTabs() {
  return useContext(WorkspaceTabsContext);
}
