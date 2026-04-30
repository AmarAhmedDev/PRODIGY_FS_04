export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names.length} people are typing`;
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-0.5">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <span>{label}…</span>
    </div>
  );
}
