interface UsageWindow {
  id: string;
  label: string;
  usedPercent: number | null;
}

const USAGE_WINDOWS: UsageWindow[] = [
  { id: "five-hour", label: "5h", usedPercent: null },
  { id: "daily", label: "24h", usedPercent: null },
  { id: "weekly", label: "7d", usedPercent: null },
];

function UsageBar() {
  return (
    <div className="flex items-center gap-3">
      {USAGE_WINDOWS.map((window) => {
        const normalizedUsage =
          window.usedPercent === null ? 0 : Math.max(0, Math.min(100, window.usedPercent));

        return (
          <div key={window.id} className="flex min-w-[56px] items-center gap-1.5">
            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">{window.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-foreground/35 transition-[width] duration-300"
                style={{ width: `${normalizedUsage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UsageBar;
