// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  LogIn, 
  LogOut, 
  User, 
  Shield, 
  Menu, 
  X,
  BookOpen,
  Gamepad2,
  Trophy,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === 'admin';

  const navigation = [
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Community', href: '/updates', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edtech Guardian Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {status === 'authenticated' ? (
              <>
                {navigation.map((item) => (
                  <Button key={item.name} variant="ghost" asChild className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </>
            ) : (
              <>
                {navigation.map((item) => (
                  <Button key={item.name} variant="ghost" asChild className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'authenticated' ? (
              <>
                <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                
                {isAdmin && (
                  <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => signOut()}
                  className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/register">
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
            {/* Navigation Links */}
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                asChild
                className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            ))}

            {/* Auth Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              {status === 'authenticated' ? (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">
                      <User className="mr-3 h-5 w-5" />
                      Dashboard
                    </Link>
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/admin">
                        <Shield className="mr-3 h-5 w-5" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/login">
                      <LogIn className="mr-3 h-5 w-5" />
                      Sign In
                    </Link>
                  </Button>
                  
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/register">
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
