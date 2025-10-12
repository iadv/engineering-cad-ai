'use client';

import React from 'react';

interface DesignSummaryProps {
  summary: {
    title: string;
    description: string;
    dimensions: { label: string; value: string }[];
    rationale: string;
  } | null;
}

export default function DesignSummary({ summary }: DesignSummaryProps) {
  if (!summary) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#fafafa]">Design Summary</h3>
        </div>
        <p className="text-sm text-[#71717a]">Generate a design to see the summary</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[#fafafa]">Design Summary</h3>
      </div>

      {/* Title */}
      <div>
        <h4 className="text-lg font-semibold text-[#fafafa] mb-2">{summary.title}</h4>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">{summary.description}</p>
      </div>

      {/* Dimensions */}
      {summary.dimensions && summary.dimensions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-[#71717a] uppercase tracking-wider mb-3">
            Key Dimensions
          </div>
          <div className="grid grid-cols-2 gap-3">
            {summary.dimensions.map((dim, index) => (
              <div key={index} className="bg-[#0a0a0a] border border-[#27272a] rounded-lg p-3">
                <div className="text-xs text-[#71717a] mb-1">{dim.label}</div>
                <div className="text-sm font-mono font-semibold text-[#fafafa]">{dim.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rationale */}
      <div className="pt-4 border-t border-[#27272a]">
        <div className="text-xs font-medium text-[#71717a] uppercase tracking-wider mb-3">
          Design Rationale
        </div>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">{summary.rationale}</p>
      </div>
    </div>
  );
}

