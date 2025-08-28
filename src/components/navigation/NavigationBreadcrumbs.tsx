'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/courses': 'Courses',
  '/games': 'Games',
  '/leaderboard': 'Leaderboard',
  '/updates': 'Community',
  '/announcements': 'Announcements',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin',
  '/host': 'Host Game'
};

export function NavigationBreadcrumbs() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/', icon: <Home className="h-3 w-3" /> }];
    
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath, icon: <span /> });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          <Link
            href={crumb.href}
            className={cn(
              "flex items-center space-x-1 hover:text-blue-600 transition-colors",
              index === breadcrumbs.length - 1 ? "text-blue-600 font-medium" : "text-gray-500"
            )}
          >
            {crumb.icon && crumb.icon}
            <span>{crumb.label}</span>
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}