# Usage stats in the chat header

This document explains how the chat-header usage bars are populated.

## Where usage data comes from

Usage bars are driven by the currently selected model in the frontend store.

1. `opencode` provider metadata is fetched through `provider.list()`.
2. Each model's raw `options` object is preserved in `allModels`.
3. `UsageBar` looks up the selected model and reads usage windows from `options`.

If a provider does not include usage/rate-limit metadata in `options`, the bars
render at `0%` for that window (track visible, no fill).

## Supported usage shapes

`UsageBar` checks these top-level keys on `model.options`:

- `usage`
- `usageStats`
- `rateLimits`

Then it maps window IDs to the three UI bars:

- `5h`  -> `five-hour` / `fiveHour` / `five_hour`
- `24h` -> `daily` / `24h`
- `7d`  -> `weekly` / `7d`

Each window object must provide:

- `used` (number)
- `limit` (number) or `max` (number)

Percent is computed as:

`clamp((used / limit) * 100, 0, 100)`

Invalid/missing values (non-number, non-finite, or `limit <= 0`) are ignored
for that window.

## Why you might still see empty bars

If your selected provider/model doesn't publish usage-window data in
`model.options`, there is no authoritative per-window usage to display yet.
In that case, the component intentionally keeps the track visible and fill at
`0%`.
