import { BlockViewer } from "@/components/block-kit/BlockViewer";

export default async function EmbedBlocksPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return (
    <main className="h-dvh w-full overflow-hidden bg-transparent p-0">
      <div className="h-full w-full p-0">
        <BlockViewer
          key={templateId}
          templateId={templateId}
          layout="fill"
          className="h-full w-full"
          background="#0d0d0f"
          showGrid
          gridSize={10}
          showEvents={false}
        />
      </div>
    </main>
  );
}
