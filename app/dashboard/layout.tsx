"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pages, setPages] = useState([
    { id: 1, title: "Page 1" },
  ]);

  const addPage = () => {
    const newPage = {
      id: Date.now(),
      title: "Untitled",
    };
    setPages([...pages, newPage]);
  };

  return (
    <div className="flex h-screen">
      
      {/* Sidebar */}
      <div className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">My Workspace</h2>

        <button onClick={addPage} className="mb-4">
          + New Page
        </button>

        <ul>
          {pages.map((page) => (
            <li key={page.id} className="mb-2">
              <Link href={`/dashboard/page/${page.id}`}>
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}