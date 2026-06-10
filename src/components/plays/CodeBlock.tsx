export function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl sketch-border-thin bg-zinc-950 text-zinc-50">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-semibold text-ink-muted">{language}</span>
        <span className="text-xs text-ink-muted">只读展示</span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
}
