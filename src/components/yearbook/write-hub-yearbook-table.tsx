"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hasDraft } from "@/lib/canvas/draft-store";

export type WriteHubYearbookRow = {
  ownerName: string;
  ownerUsername: string;
  signedAt: string | null;
  yearbookId: string;
};

type YearbookStatus = "signed" | "in_progress" | "not_started";

const STATUS_ORDER: Record<YearbookStatus, number> = {
  in_progress: 0,
  not_started: 1,
  signed: 2,
};

const STATUS_LABEL: Record<YearbookStatus, string> = {
  signed: "Signed",
  in_progress: "In progress",
  not_started: "Not started",
};

const STATUS_BADGE_CLASS: Record<YearbookStatus, string> = {
  signed: "bg-green-50 text-green-800 ring-green-200",
  in_progress: "bg-amber-50 text-amber-900 ring-amber-200",
  not_started: "bg-stone-100 text-stone-700 ring-stone-200",
};

const ACTION_LABEL: Record<YearbookStatus, string> = {
  signed: "View",
  in_progress: "Resume",
  not_started: "Start",
};

type WriteHubYearbookTableProps = {
  rows: WriteHubYearbookRow[];
};

export function WriteHubYearbookTable({ rows }: WriteHubYearbookTableProps) {
  const [draftYearbookIds, setDraftYearbookIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const ids = new Set(
      rows.filter((row) => !row.signedAt && hasDraft(row.yearbookId)).map((row) => row.yearbookId),
    );
    setDraftYearbookIds(ids);
  }, [rows]);

  const sortedRows = useMemo(() => {
    const withStatus = rows.map((row) => ({
      row,
      status: resolveStatus(row, draftYearbookIds),
    }));

    return withStatus.sort((left, right) => {
      const statusDiff = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return left.row.ownerName.localeCompare(right.row.ownerName);
    });
  }, [draftYearbookIds, rows]);

  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
        No invited yearbooks yet. When someone invites you, they will appear here.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-yearbook-paper">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-white/60 text-xs font-semibold uppercase tracking-wide text-stone-600">
            <th className="px-4 py-3">Yearbook</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(({ row, status }) => (
            <tr className="border-b border-stone-200/80 last:border-0" key={row.yearbookId}>
              <td className="px-4 py-4">
                <p className="font-semibold text-yearbook-ink">{row.ownerName}</p>
                <p className="text-xs text-stone-600">@{row.ownerUsername}</p>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_BADGE_CLASS[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  className="inline-flex rounded-full bg-yearbook-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-yearbook-accent"
                  href={`/write/${row.ownerUsername}`}
                >
                  {ACTION_LABEL[status]}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function resolveStatus(row: WriteHubYearbookRow, draftYearbookIds: Set<string> | null): YearbookStatus {
  if (row.signedAt) {
    return "signed";
  }

  if (draftYearbookIds?.has(row.yearbookId)) {
    return "in_progress";
  }

  return "not_started";
}
