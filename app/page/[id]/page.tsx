import { Editor } from "@/components/Editor";
import { NotionLayout } from "@/components/NotionLayout";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <NotionLayout>
      <Editor pageId={id} />
    </NotionLayout>
  );
}
