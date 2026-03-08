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

type UnknownRecord = Record<string, unknown>;

const USAGE_WINDOWS: UsageWindow[] = [
  { id: "five-hour", label: "5h" },
  { id: "daily", label: "24h" },
  { id: "weekly", label: "7d" },
];

function toUsageMetrics(value: unknown): UsageMetrics | null {
  if (!value || typeof value !== "object") return null;

  const entry = value as {
    used?: unknown;
    limit?: unknown;
    max?: unknown;
    remaining?: unknown;
    usedPercent?: unknown;
    usagePercent?: unknown;
    remainingPercent?: unknown;
    percentRemaining?: unknown;
  };

  const usedPercent =
    typeof entry.usedPercent === "number"
      ? entry.usedPercent
      : typeof entry.usagePercent === "number"
        ? entry.usagePercent
        : null;
  if (usedPercent !== null && Number.isFinite(usedPercent)) {
    return { used: usedPercent, limit: 100 };
  }

  const remainingPercent =
    typeof entry.remainingPercent === "number"
      ? entry.remainingPercent
      : typeof entry.percentRemaining === "number"
        ? entry.percentRemaining
        : null;
  if (remainingPercent !== null && Number.isFinite(remainingPercent)) {
    return { used: 100 - remainingPercent, limit: 100 };
  }

  const used = typeof entry.used === "number" ? entry.used : null;
  const limit =
    typeof entry.limit === "number"
      ? entry.limit
      : typeof entry.max === "number"
        ? entry.max
        : null;

  if (used !== null && limit !== null && Number.isFinite(used) && Number.isFinite(limit)) {
    if (limit <= 0) return null;
    return { used, limit };
  }

  const remaining = typeof entry.remaining === "number" ? entry.remaining : null;
  if (
    remaining !== null &&
    limit !== null &&
    Number.isFinite(remaining) &&
    Number.isFinite(limit)
  ) {
    if (limit <= 0) return null;
    return { used: limit - remaining, limit };
  }

  return null;
}

function getUsageContainer(options: UnknownRecord): UnknownRecord | null {
  const direct =
    (options.usage as UnknownRecord | undefined) ??
    (options.usageStats as UnknownRecord | undefined) ??
    (options.rateLimits as UnknownRecord | undefined) ??
    (options.rate_limits as UnknownRecord | undefined);
  if (direct && typeof direct === "object") return direct;

  const codex = options.codex as UnknownRecord | undefined;
  if (!codex || typeof codex !== "object") return null;

  const nested =
    (codex.usage as UnknownRecord | undefined) ??
    (codex.usageStats as UnknownRecord | undefined) ??
    (codex.rateLimits as UnknownRecord | undefined);
  return nested && typeof nested === "object" ? nested : null;
}

function readWindowUsage(usage: UnknownRecord, windowId: string): UsageMetrics | null {
  if (windowId === "five-hour") {
    return (
      toUsageMetrics(usage["five-hour"]) ??
      toUsageMetrics(usage.fiveHour) ??
      toUsageMetrics(usage.five_hour) ??
      toUsageMetrics(usage["5h"]) ??
      toUsageMetrics(usage.hourly)
    );
  }

  if (windowId === "daily") {
    return toUsageMetrics(usage.daily) ?? toUsageMetrics(usage["24h"]);
  }

  return toUsageMetrics(usage.weekly) ?? toUsageMetrics(usage["7d"]);
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
    const usage = getUsageContainer(options);

    if (!usage || typeof usage !== "object") {
      return {} as Record<string, UsageMetrics | null>;
    }

    return Object.fromEntries(
      USAGE_WINDOWS.map((window) => [window.id, readWindowUsage(usage, window.id)]),
    ) as Record<string, UsageMetrics | null>;
  }, [allModels, selectedModel]);

  return (
    <div className="flex items-center gap-3">
      {USAGE_WINDOWS.map((window) => {
        const stats = usageByWindow[window.id] ?? null;
        const normalizedUsage = stats
          ? Math.max(0, Math.min(100, (stats.used / stats.limit) * 100))
          : 0;

        return (
          <div key={window.id} className="flex min-w-[104px] items-center gap-2">
            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">{window.label}</span>
            <div className="h-2 w-[72px] overflow-hidden rounded-full border border-border/50 bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500/90 transition-[width] duration-300"
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
