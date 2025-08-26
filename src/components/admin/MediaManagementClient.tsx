'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  HardDrive, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  ArrowLeft,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { MediaUploader } from '@/components/upload/MediaUploader';
import { MediaGallery } from '@/components/upload/MediaGallery';
import { toast } from 'sonner';

export function MediaManagementClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadStats, setUploadStats] = useState({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0
  });

  const handleUploadComplete = (result: { url: string; key: string; category: string }) => {
    setUploadStats(prev => ({
      ...prev,
      totalUploads: prev.totalUploads + 1,
      successfulUploads: prev.successfulUploads + 1
    }));
    
    // Refresh the gallery
    setRefreshKey(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    setUploadStats(prev => ({
      ...prev,
      totalUploads: prev.totalUploads + 1,
      failedUploads: prev.failedUploads + 1
    }));
  };

  const handleFileDelete = () => {
    // Refresh the gallery when a file is deleted
    setRefreshKey(prev => prev + 1);
  };

  const refreshGallery = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <HardDrive className="h-8 w-8 mr-3 text-blue-600" />
            Media Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload, organize, and manage your media files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={refreshGallery}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{uploadStats.totalUploads}</p>
              </div>
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{uploadStats.successfulUploads}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{uploadStats.failedUploads}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            Media Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Media</CardTitle>
              <CardDescription>
                Upload images, videos, audio files, and documents to your S3 storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaUploader
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                maxFiles={10}
                prefix="media"
                showPreview={true}
              />
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start space-x-3">
                  <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Images</h4>
                    <p className="text-sm text-muted-foreground">
                      JPEG, PNG, GIF, WebP
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Max 10MB
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Video className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Videos</h4>
                    <p className="text-sm text-muted-foreground">
                      MP4, WebM, MOV, AVI
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Max 100MB
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Music className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Audio</h4>
                    <p className="text-sm text-muted-foreground">
                      MP3, WAV, OGG, M4A
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Max 50MB
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      PDF, TXT, DOC, DOCX
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Max 25MB
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <MediaGallery
            key={refreshKey}
            onFileDelete={handleFileDelete}
            deletable={true}
            selectable={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
