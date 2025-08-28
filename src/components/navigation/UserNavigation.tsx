'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Gamepad2, 
  Trophy, 
  MessageSquare, 
  Megaphone,
  Shield, 
  User, 
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const userNavItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="h-4 w-4" />,
    description: 'Dashboard and overview'
  },
  {
    href: '/courses',
    label: 'Courses',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Browse and take courses'
  },
  {
    href: '/games',
    label: 'Games',
    icon: <Gamepad2 className="h-4 w-4" />,
    description: 'Play trivia games'
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: <Trophy className="h-4 w-4" />,
    description: 'See top performers'
  },
  {
    href: '/updates',
    label: 'Community',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Share and discuss'
  },
  {
    href: '/announcements',
    label: 'Announcements',
    icon: <Megaphone className="h-4 w-4" />,
    description: 'Latest news and updates',
    badge: 'New'
  }
];

export function UserNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === 'admin';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Edtech Guardian Hub
              </span>
            </Link>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={(session.user as any).avatar} />
                <AvatarFallback>
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Level {(session.user as any).level || 1} • {(session.user as any).points || 0} points
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {userNavItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/' && pathname.startsWith(item.href));
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-all duration-200',
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                          )}
                        >
                          <span className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center',
                            isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                          )}>
                            {item.icon}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Bottom Actions */}
              <li className="mt-auto">
                <div className="space-y-1">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      <Shield className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700" />
                      <div>
                        <span>Admin Panel</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Manage the platform
                        </p>
                      </div>
                    </Link>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-white px-4 py-3 shadow-sm sm:px-6 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="-m-2.5 p-2.5 text-gray-700"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-md">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edtech Guardian Hub
            </span>
          </Link>
        </div>
        
        {/* Mobile Quick Actions */}
        <div className="flex items-center space-x-2">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="p-2">
              <Gamepad2 className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="p-2">
              <BookOpen className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {session?.user && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={(session.user as any).avatar} />
            <AvatarFallback className="text-xs">
              {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="-m-2.5 p-2.5 text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                {/* Mobile Logo */}
                <div className="flex h-16 shrink-0 items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Edtech Guardian Hub
                    </span>
                  </Link>
                </div>

                {/* Mobile User Info */}
                {session?.user && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(session.user as any).avatar} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.user.name || session.user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Level {(session.user as any).level || 1} • {(session.user as any).points || 0} points
                      </p>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation */}
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {userNavItems.map((item) => {
                          const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname.startsWith(item.href));
                          
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-all duration-200',
                                  isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                                )}
                              >
                                <span className={cn(
                                  'flex h-6 w-6 shrink-0 items-center justify-center',
                                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                                )}>
                                  {item.icon}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span>{item.label}</span>
                                    {item.badge && (
                                      <Badge variant="secondary" className="text-xs">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>

                    {/* Mobile Bottom Actions */}
                    <li className="mt-auto">
                      <div className="space-y-1">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 transition-all duration-200"
                          >
                            <Shield className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700" />
                            <div>
                              <span>Admin Panel</span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Manage the platform
                              </p>
                            </div>
                          </Link>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleSignOut();
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
