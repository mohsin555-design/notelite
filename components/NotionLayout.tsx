import { Sidebar } from "@/components/Sidebar";

export function NotionLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen min-h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="min-w-0 flex-1">{children}</section>
    </main>
  );
}
