export function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 text-zinc-50 dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-semibold text-zinc-300">{language}</span>
        <span className="text-xs text-zinc-400">MVP: 仅展示</span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
}

