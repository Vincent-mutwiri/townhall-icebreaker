// src/components/landing/AnnouncementsSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Calendar, User, ArrowRight, Megaphone } from 'lucide-react';

interface AnnouncementPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  status: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  formattedDate: string;
}

interface AnnouncementsSectionProps {
  posts: AnnouncementPost[];
}

export function AnnouncementsSection({ posts }: AnnouncementsSectionProps) {
  if (!posts || posts.length === 0) {
    return null; // Don't render the section if there are no posts
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Latest News &{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Updates
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Stay informed about new features, community highlights, and important announcements 
            from the Edtech Guardian Hub team.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <Card 
              key={post._id} 
              className={`overflow-hidden text-left group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ${
                index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Cover image */}
              {post.coverImage && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image 
                    src={post.coverImage} 
                    alt={post.title} 
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                {/* Meta information */}
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                    Latest
                  </Badge>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {post.formattedDate}
                  </div>
                </div>
                
                {/* Title */}
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                  {post.title}
                </CardTitle>
                
                {/* Author */}
                <CardDescription className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <User className="h-4 w-4 mr-2" />
                  Posted by {post.author?.name || 'Admin'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Content preview */}
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {post.content.length > 150 
                    ? `${post.content.substring(0, 150)}...` 
                    : post.content
                  }
                </p>
                
                {/* Read more button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium group/btn"
                >
                  Read full announcement
                  <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform duration-200" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View all announcements CTA */}
        {posts.length >= 3 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-300"
            >
              View All Announcements
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
