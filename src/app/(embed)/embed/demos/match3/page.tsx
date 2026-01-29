import { Match3Viewer } from "@/demos/match3/Match3Viewer";

export default function EmbedMatch3Page() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-transparent p-0">
      <div className="h-full w-full p-0">
        <Match3Viewer mode="embed" />
      </div>
    </main>
  );
}
