import React from 'react';

function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-xl bg-ink/[0.06] ${className}`} />;
}

export default function AuditSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Score cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-4 rounded-3xl border border-ink/10 bg-paper-pure p-7">
            <Block className="h-3 w-20" />
            <div className="h-28 w-28 rounded-full border-8 border-ink/[0.06]" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="rounded-3xl border border-ink/10 bg-paper-pure p-8">
        <Block className="mb-6 h-7 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-ink/10 p-5">
              <Block className="h-3 w-14" />
              <Block className="h-8 w-24" />
              <Block className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      <div className="space-y-4">
        <Block className="h-7 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-3xl border border-ink/10 bg-paper-pure p-6">
            <div className="flex justify-between">
              <Block className="h-5 w-56" />
              <Block className="h-6 w-20 rounded-full" />
            </div>
            <Block className="h-4 w-full" />
            <Block className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
