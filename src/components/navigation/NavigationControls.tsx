'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export function NavigationControls() {
  const router = useRouter();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.forward()}
        className="text-gray-600 hover:text-gray-900"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.refresh()}
        className="text-gray-600 hover:text-gray-900"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}