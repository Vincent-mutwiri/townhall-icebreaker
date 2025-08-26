'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Settings, 
  Database, 
  Grid, 
  HardDrive, 
  Megaphone,
  Users,
  BarChart3,
  Shield,
  CheckSquare,
  ChevronRight,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
}

const adminNavItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: <Home className="h-4 w-4" />,
    description: 'System overview and settings'
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: <Users className="h-4 w-4" />,
    description: 'Manage users and permissions'
  },
  {
    href: '/admin/announcements',
    label: 'Landing Page',
    icon: <Megaphone className="h-4 w-4" />,
    description: 'Manage landing page content'
  },
  {
    href: '/admin/media',
    label: 'Media Management',
    icon: <HardDrive className="h-4 w-4" />,
    description: 'Upload and organize media files'
  },
  {
    href: '/admin/badges',
    label: 'Badge Management',
    icon: <Settings className="h-4 w-4" />,
    description: 'Configure achievement badges'
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'View platform statistics'
  },
  {
    href: '/admin/moderation',
    label: 'Content Moderation',
    icon: <Shield className="h-4 w-4" />,
    description: 'Review and moderate content'
  },
  {
    href: '/admin/review-queue',
    label: 'Review Queue',
    icon: <CheckSquare className="h-4 w-4" />,
    badge: 'New',
    description: 'Pending items for review'
  }
];

export function AdminNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Home', href: '/' }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      if (segment === 'admin') {
        breadcrumbs.push({ label: 'Admin', href: '/admin' });
      } else {
        const navItem = adminNavItems.find(item => item.href === currentPath);
        if (navItem) {
          breadcrumbs.push({ label: navItem.label, href: currentPath });
        } else {
          // Capitalize and format segment
          const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
          breadcrumbs.push({ label, href: currentPath });
        }
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentNavItem = adminNavItems.find(item => item.href === pathname);

  // Handle navigation with loading state
  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setIsLoading(true);
      // Loading state will be cleared when the new page loads
      setTimeout(() => setIsLoading(false), 1000);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/90 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                <p className="text-sm text-gray-500">Edtech Guardian Hub</p>
              </div>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              </Link>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <nav className="flex items-center space-x-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                  <Link
                    href={crumb.href}
                    className={cn(
                      "hover:text-blue-600 transition-colors",
                      index === breadcrumbs.length - 1 
                        ? "text-blue-600 font-medium" 
                        : "text-gray-500"
                    )}
                    onClick={() => handleNavigation(crumb.href)}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Current Page Info */}
          {currentNavItem && (
            <div className="px-6 py-4 bg-blue-50 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {currentNavItem.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{currentNavItem.label}</h3>
                  <p className="text-sm text-gray-600">{currentNavItem.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Admin Panel v2.0
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
}
