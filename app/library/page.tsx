import { Suspense } from "react";

import { LibraryPage } from "@/components/LibraryPage";
import { NotionLayout } from "@/components/NotionLayout";

export default function LibraryRoute() {
  return (
    <NotionLayout>
      <Suspense fallback={null}>
        <LibraryPage />
      </Suspense>
    </NotionLayout>
  );
}
