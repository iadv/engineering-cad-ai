'use client';

import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';

interface Illustration {
  viewType: string;
  image: string; // Base64 encoded
  label: string;
}

interface IllustrationViewerProps {
  illustrations: Illustration[];
  isLoading: boolean;
}

export default function IllustrationViewer({ illustrations, isLoading }: IllustrationViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : illustrations.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < illustrations.length - 1 ? prev + 1 : 0));
  };

  if (isLoading && illustrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Generating professional illustrations...</p>
          <p className="text-xs text-muted-foreground/70 mt-2">Using Gemini AI</p>
        </CardContent>
      </Card>
    );
  }

  if (illustrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No illustrations yet</p>
          <p className="text-xs text-muted-foreground/70 mt-2">Generate a design to see AI illustrations</p>
        </CardContent>
      </Card>
    );
  }

  const currentIllustration = illustrations[currentIndex];

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Illustrations</h3>
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} / {illustrations.length}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentIllustration.label}
          </Badge>
        </div>

        {/* Image Display - Flex grows to fill available space */}
        <div className="relative bg-muted rounded-lg overflow-hidden mb-4 flex-1 flex items-center justify-center">
          <img
            src={`data:image/png;base64,${currentIllustration.image}`}
            alt={currentIllustration.label}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-between flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={illustrations.length <= 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {illustrations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to illustration ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={illustrations.length <= 1}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading indicator for additional images */}
        {isLoading && (
          <div className="mt-4 p-2 bg-muted/50 rounded-lg flex items-center gap-2 justify-center">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Generating more views...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

