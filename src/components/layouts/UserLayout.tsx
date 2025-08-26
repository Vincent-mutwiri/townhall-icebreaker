'use client';

import React from 'react';
import { UserNavigation } from '@/components/navigation/UserNavigation';
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
        <PageTransition className="min-h-screen">
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
