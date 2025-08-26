'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Grid3X3,
  List,
  Calendar,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import { extractS3KeyFromUrl } from '@/lib/s3-utils';

interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  type: 'image' | 'video' | 'audio' | 'unknown';
  name?: string;
}

interface MediaGalleryProps {
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  selectable?: boolean;
  deletable?: boolean;
  className?: string;
  prefix?: string;
}

export function MediaGallery({
  onFileSelect,
  onFileDelete,
  selectable = false,
  deletable = true,
  className = '',
  prefix = 'uploads'
}: MediaGalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/media');
      if (!response.ok) throw new Error('Failed to fetch files');
      
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.key}?`)) return;

    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: file.key }),
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setFiles(prev => prev.filter(f => f.key !== file.key));
      onFileDelete?.(file);
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    if (!selectable) return;
    
    if (selectedFiles.has(file.key)) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.key);
        return newSet;
      });
    } else {
      setSelectedFiles(prev => new Set(prev).add(file.key));
    }
    
    onFileSelect?.(file);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const filteredFiles = files.filter(file => 
    file.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.name && file.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading media files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Media Gallery
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {files.length} files • {formatFileSize(totalSize)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No files match your search' : 'No media files found'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.key}
                className={`relative group border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  selectable && selectedFiles.has(file.key) 
                    ? 'ring-2 ring-primary' 
                    : ''
                }`}
                onClick={() => handleFileSelect(file)}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.key}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-muted flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={file.key}>
                    {file.key.split('/').pop()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {deletable && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 text-xs"
                >
                  {file.type}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.key}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                  selectable && selectedFiles.has(file.key) 
                    ? 'bg-primary/5 border-primary' 
                    : ''
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={file.key}>
                      {file.key.split('/').pop()}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(file.lastModified)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {file.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {deletable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
