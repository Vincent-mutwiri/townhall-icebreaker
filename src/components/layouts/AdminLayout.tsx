'use client';

import React from 'react';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { PageTransition } from '@/components/ui/page-transition';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      {/* Main Content */}
      <div className="lg:ml-80">
        <PageTransition className="min-h-screen">
          <main className="p-6">
            {children}
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
