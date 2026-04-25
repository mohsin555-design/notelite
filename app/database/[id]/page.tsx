import { DatabaseView } from "@/components/DatabaseView";
import { NotionLayout } from "@/components/NotionLayout";

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <NotionLayout>
      <div className="h-full overflow-auto px-6 py-10 md:px-10">
        <DatabaseView databaseId={id} />
      </div>
    </NotionLayout>
  );
}
