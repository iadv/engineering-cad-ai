'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { FileText, Ruler } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Design Summary</CardTitle>
          </div>
          <CardDescription>Generate a design to see the summary</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Design Summary</CardTitle>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">{summary.title}</h4>
          <CardDescription className="leading-relaxed">{summary.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dimensions */}
        {summary.dimensions && summary.dimensions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Key Dimensions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {summary.dimensions.map((dim, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground mb-1">{dim.label}</div>
                    <div className="text-sm font-mono font-semibold">{dim.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Rationale */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Design Rationale
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.rationale}</p>
        </div>
      </CardContent>
    </Card>
  );
}
