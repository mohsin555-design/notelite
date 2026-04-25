import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NotionStoreProvider } from "@/lib/notion-store";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotionStoreProvider>{children}</NotionStoreProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
