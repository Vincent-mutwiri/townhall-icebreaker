'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Calendar, User, Eye, Megaphone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  formattedDate: string;
}

interface AnnouncementsListProps {
  announcements: Announcement[];
  isAuthenticated: boolean;
}

export function AnnouncementsList({ announcements, isAuthenticated }: AnnouncementsListProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16">
        <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Announcements Yet
        </h3>
        <p className="text-gray-600">
          Check back later for the latest updates and news.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <Card key={announcement._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="md:flex">
            {/* Cover Image */}
            {announcement.coverImage && (
              <div className="md:w-1/3 relative h-48 md:h-auto">
                <Image
                  src={announcement.coverImage}
                  alt={announcement.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* Content */}
            <div className={`${announcement.coverImage ? 'md:w-2/3' : 'w-full'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 line-clamp-2">
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-base">
                      {announcement.content.substring(0, 200)}
                      {announcement.content.length > 200 && '...'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    New
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {announcement.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {announcement.formattedDate}
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAnnouncement(announcement)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Read More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">
                          {announcement.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {announcement.author.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {announcement.formattedDate}
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="max-h-[60vh] overflow-y-auto pr-4">
                        {announcement.coverImage && (
                          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                            <Image
                              src={announcement.coverImage}
                              alt={announcement.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="prose prose-lg max-w-none">
                          <ReactMarkdown>{announcement.content}</ReactMarkdown>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
