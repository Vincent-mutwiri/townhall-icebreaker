'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Gamepad2, 
  Trophy, 
  MessageSquare, 
  Megaphone,
  Zap,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickLinks = [
  { href: '/courses', icon: <BookOpen className="h-4 w-4" />, label: 'Courses', key: 'c' },
  { href: '/games', icon: <Gamepad2 className="h-4 w-4" />, label: 'Games', key: 'g' },
  { href: '/leaderboard', icon: <Trophy className="h-4 w-4" />, label: 'Leaderboard', key: 'l' },
  { href: '/updates', icon: <MessageSquare className="h-4 w-4" />, label: 'Community', key: 'u' },
  { href: '/announcements', icon: <Megaphone className="h-4 w-4" />, label: 'News', key: 'n' }
];

export function QuickNavigation() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const link = quickLinks.find(l => l.key === e.key.toLowerCase());
        if (link) {
          e.preventDefault();
          window.location.href = link.href;
        }
        if (e.key === 'h') {
          e.preventDefault();
          setShowShortcuts(!showShortcuts);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-white"
              title={`${link.label} (Alt+${link.key})`}
            >
              {link.icon}
              <span className="ml-1 hidden sm:inline">{link.label}</span>
            </Button>
          </Link>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="h-8 px-2 text-gray-600 hover:text-blue-600"
          title="Show shortcuts (Alt+H)"
        >
          <Zap className="h-4 w-4" />
        </Button>
      </div>

      {showShortcuts && (
        <div className="absolute top-full mt-2 right-0 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-48">
          <h4 className="font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
          <div className="space-y-1 text-sm">
            {quickLinks.map((link) => (
              <div key={link.href} className="flex justify-between">
                <span className="text-gray-600">{link.label}</span>
                <Badge variant="outline" className="text-xs">Alt+{link.key}</Badge>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-gray-600">Shortcuts</span>
              <Badge variant="outline" className="text-xs">Alt+H</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}