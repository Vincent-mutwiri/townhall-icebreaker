'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Show back button for nested pages
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;
  
  const parentPath = `/${segments.slice(0, -1).join('/')}`;
  const parentName = segments[segments.length - 2] || 'home';
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(parentPath)}
      className="text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to {parentName}
    </Button>
  );
}