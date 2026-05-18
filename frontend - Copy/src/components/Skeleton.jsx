import React from 'react';

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-surface-200 mb-3" />
      <div className="h-5 w-3/4 rounded bg-surface-200 mb-2" />
      <div className="h-3 w-1/2 rounded bg-surface-200 mb-4" />
      <div className="space-y-2">
        <div className="h-3 rounded bg-surface-200" />
        <div className="h-3 w-5/6 rounded bg-surface-200" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-12 rounded-full bg-surface-200" />
        <div className="h-5 w-16 rounded-full bg-surface-200" />
      </div>
      <div className="mt-4 border-t border-surface-100 pt-3 flex justify-between items-center">
        <div className="h-3 w-24 rounded bg-surface-200" />
        <div className="h-8 w-16 rounded-lg bg-surface-200" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="h-4 w-32 rounded bg-surface-200" /></td>
      <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-surface-200" /></td>
      <td className="px-5 py-4"><div className="h-4 w-16 rounded bg-surface-200" /></td>
      <td className="px-5 py-4"><div className="h-4 w-20 rounded bg-surface-200" /></td>
    </tr>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-200 mb-2" />
      <div className="h-8 w-16 rounded bg-surface-200" />
    </div>
  );
}
