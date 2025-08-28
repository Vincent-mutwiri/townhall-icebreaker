'use client';

import React from 'react';
import { UserNavigation } from '@/components/navigation/UserNavigation';
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader';
import { BackButton } from '@/components/navigation/BackButton';
import { PageTransition } from '@/components/ui/page-transition';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavigation />
      
      {/* Main Content */}
      <div className="lg:ml-80">
        <EnhancedHeader />
        <PageTransition className="min-h-screen">
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            <BackButton />
            {children}
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
