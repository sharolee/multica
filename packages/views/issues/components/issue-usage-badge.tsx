"use client";

import { useQuery } from "@tanstack/react-query";
import { issueUsageOptions } from "@multica/core/issues/queries";
import {
  formatTokens,
  formatUsd,
  cacheHitRatePercent,
} from "../../runtimes/utils";

// Compact inline display of an issue's total token consumption and cost.
// Fetches via the per-issue usage query (TanStack deduplicates across
// board/list/table surfaces that render the same issue, so no N+1 concern).
//
// Renders nothing when the issue has no usage rows (no runs, or runs that
// predate usage reporting) — an em dash would read as "free" in a glance.
//
// The `compact` variant is for the board card / list row: tokens + cost in
// the smallest possible footprint. The default variant is for the table
// cell, which has more horizontal room and also shows the cache hit rate.

export function IssueUsageBadge({
  issueId,
  compact = false,
}: {
  issueId: string;
  compact?: boolean;
}) {
  // Fetches the per-issue usage summary. TanStack deduplicates across
  // board/list/table surfaces that render the same issue, so no N+1 concern.
  const { data: usage } = useQuery({
    ...issueUsageOptions(issueId),
    // 60s staleTime — usage doesn't change every second, and the board
    // may render many cards. WS events invalidate the prefix.
    staleTime: 60_000,
  });

  // No usage data at all — don't render anything.
  if (!usage || usage.task_count === 0) return null;

  const totalTokens =
    usage.total_input_tokens +
    usage.total_output_tokens +
    usage.total_cache_read_tokens +
    usage.total_cache_write_tokens;

  // No tokens recorded (all runs predate usage reporting).
  if (totalTokens === 0) return null;

  // Cost: prefer the provider's own cost (cost_usd_ticks), then estimate
  // uncosted tokens from the rate table. Mirrors estimateCost logic but on
  // the aggregate IssueUsageSummary shape (which carries totals, not
  // per-model rows, so we use cost_usd_ticks directly + a simple estimate
  // for uncosted tokens).
  const COST_USD_TICKS_PER_USD = 10_000_000_000;
  const authoritativeCost =
    (usage.cost_usd_ticks ?? 0) / COST_USD_TICKS_PER_USD;

  // When cost_usd_ticks is present, it's the provider's bill. When absent,
  // we can't estimate without per-model breakdown (IssueUsageSummary is
  // aggregate), so we show tokens only.
  const hasCost = (usage.cost_usd_ticks ?? 0) > 0 || authoritativeCost > 0;

  const cacheRate = cacheHitRatePercent(
    usage.total_input_tokens,
    usage.total_cache_read_tokens,
    usage.total_cache_write_tokens,
  );

  if (compact) {
    return (
      <span className="shrink-0 whitespace-nowrap text-micro text-muted-foreground tabular-nums">
        {formatTokens(totalTokens)}
        {hasCost && (
          <>
            <span className="text-faint-foreground"> · </span>
            {formatUsd(authoritativeCost)}
          </>
        )}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-caption text-muted-foreground tabular-nums">
      <span>{formatTokens(totalTokens)}</span>
      {hasCost && (
        <>
          <span className="text-faint-foreground">·</span>
          <span>{formatUsd(authoritativeCost)}</span>
        </>
      )}
      {cacheRate !== null && (
        <>
          <span className="text-faint-foreground">·</span>
          <span>{cacheRate}%</span>
        </>
      )}
    </span>
  );
}
