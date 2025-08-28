'use client';

import React from 'react';
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs';
import { NavigationControls } from './NavigationControls';
import { QuickNavigation } from './QuickNavigation';
import { BackButton } from './BackButton';

export function EnhancedHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <NavigationControls />
          <NavigationBreadcrumbs />
        </div>
        <QuickNavigation />
      </div>
    </div>
  );
}