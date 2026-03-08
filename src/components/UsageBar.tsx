import { useMemo } from "react";

import { useStore } from "@/stores/opencode";

interface UsageWindow {
  id: string;
  label: string;
}

interface UsageMetrics {
  used: number;
  limit: number;
}

const USAGE_WINDOWS: UsageWindow[] = [
  { id: "five-hour", label: "5h" },
  { id: "daily", label: "24h" },
  { id: "weekly", label: "7d" },
];

function toUsageMetrics(value: unknown): UsageMetrics | null {
  if (!value || typeof value !== "object") return null;

  const entry = value as { used?: unknown; limit?: unknown; max?: unknown };
  const used = typeof entry.used === "number" ? entry.used : null;
  const limit =
    typeof entry.limit === "number"
      ? entry.limit
      : typeof entry.max === "number"
        ? entry.max
        : null;

  if (used === null || limit === null || !Number.isFinite(used) || !Number.isFinite(limit)) {
    return null;
  }

  if (limit <= 0) return null;

  return { used, limit };
}

function UsageBar() {
  const selectedModel = useStore((state) => state.selectedModel);
  const allModels = useStore((state) => state.allModels);

  const usageByWindow = useMemo(() => {
    if (!selectedModel) return {} as Record<string, UsageMetrics | null>;

    const [providerId, modelId] = selectedModel.split("/");
    const model = allModels.find((item) => item.providerId === providerId && item.id === modelId);

    if (!model?.options || typeof model.options !== "object") {
      return {} as Record<string, UsageMetrics | null>;
    }

    const options = model.options as Record<string, unknown>;
    const usage =
      (options.usage as Record<string, unknown> | undefined) ??
      (options.usageStats as Record<string, unknown> | undefined) ??
      (options.rateLimits as Record<string, unknown> | undefined);

    if (!usage || typeof usage !== "object") {
      return {} as Record<string, UsageMetrics | null>;
    }

    return {
      "five-hour":
        toUsageMetrics(usage["five-hour"]) ??
        toUsageMetrics(usage.fiveHour) ??
        toUsageMetrics(usage.five_hour),
      daily: toUsageMetrics(usage.daily) ?? toUsageMetrics(usage["24h"]),
      weekly: toUsageMetrics(usage.weekly) ?? toUsageMetrics(usage["7d"]),
    };
  }, [allModels, selectedModel]);

  return (
    <div className="flex items-center gap-3">
      {USAGE_WINDOWS.map((window) => {
        const stats = usageByWindow[window.id] ?? null;
        const normalizedUsage = stats
          ? Math.max(0, Math.min(100, (stats.used / stats.limit) * 100))
          : 0;

        return (
          <div key={window.id} className="flex min-w-[84px] items-center gap-1.5">
            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">{window.label}</span>
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted/70">
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
