import type { Metadata } from "next";
import localFont from "next/font/local";
import { NotionStoreProvider } from "@/lib/notion-store";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";

const ttNorms = localFont({
  src: [
    { path: "./fonts/TT Norms Pro Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/TT Norms Pro Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/TT Norms Pro Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/TT Norms Pro Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/TT Norms Pro Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/TT Norms Pro Italic.otf", weight: "400", style: "italic" },
  ],
  variable: "--font-tt-norms-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notelite",
  description: "A Notion-like block editor built with Next.js.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Notelite",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ttNorms.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NotionStoreProvider>{children}</NotionStoreProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
