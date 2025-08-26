// src/components/admin/AnnouncementManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Calendar,
  User,
  Megaphone,
  Image as ImageIcon,
  Loader2,
  Search,
  Filter,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { uploadFileToS3 } from "@/lib/s3-utils";

interface AnnouncementPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<AnnouncementPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    coverImage: '',
    status: 'draft' as 'draft' | 'published'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        toast.error('Failed to fetch announcements');
      }
    } catch (error) {
      toast.error('Error fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements';

      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedPost = await response.json();

        if (editingId) {
          setAnnouncements(prev =>
            prev.map(post => post._id === editingId ? savedPost : post)
          );
          toast.success('Announcement updated successfully');
        } else {
          setAnnouncements(prev => [savedPost, ...prev]);
          toast.success('Announcement created successfully');
        }

        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save announcement');
      }
    } catch (error) {
      toast.error('Error saving announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post: AnnouncementPost) => {
    setFormData({
      title: post.title,
      content: post.content,
      coverImage: post.coverImage || '',
      status: post.status
    });
    setEditingId(post._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnnouncements(prev => prev.filter(post => post._id !== id));
        toast.success('Announcement deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete announcement');
      }
    } catch (error) {
      toast.error('Error deleting announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      coverImage: '',
      status: 'draft'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await uploadFileToS3(file, 'announcements');

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, coverImage: result.url || '' }));
        toast.success('Cover image uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploadingImage(false);
      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and search logic
  const filteredAnnouncements = announcements.filter(post => {
    const matchesSearch = searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: announcements.length,
    published: announcements.filter(p => p.status === 'published').length,
    draft: announcements.filter(p => p.status === 'draft').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-blue-600" />
            Landing Page Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage announcements that appear on the landing page
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Total: {stats.total}
              </Badge>
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Published: {stats.published}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Draft: {stats.draft}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'New Announcement'}
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || filterStatus !== 'all') && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredAnnouncements.length} of {announcements.length} announcements
              {searchTerm && ` matching "${searchTerm}"`}
              {filterStatus !== 'all' && ` with status "${filterStatus}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </CardTitle>
            <CardDescription>
              {editingId 
                ? 'Update the announcement details below'
                : 'Create a new announcement for the landing page'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title..."
                  maxLength={200}
                  required
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200 characters
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter announcement content..."
                  rows={6}
                  maxLength={2000}
                  required
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.content.length}/2000 characters
                </div>
              </div>

              <div>
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="space-y-3">
                  <Input
                    id="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                    placeholder="https://example.com/image.jpg or upload a new image"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">or</span>
                    <div>
                      <input
                        ref={(input) => {
                          if (input) {
                            (window as any).imageUploadInput = input;
                          }
                        }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingImage}
                        onClick={() => {
                          const input = (window as any).imageUploadInput;
                          if (input) input.click();
                        }}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {formData.coverImage && (
                    <div className="relative w-full max-w-md">
                      <Image
                        src={formData.coverImage}
                        alt="Cover image preview"
                        width={400}
                        height={200}
                        className="rounded-lg object-cover border"
                        onError={() => {
                          toast.error('Failed to load image preview');
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? 'Update' : 'Create'} Announcement
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'all' ? 'All Announcements' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Announcements`}
            ({filteredAnnouncements.length})
          </CardTitle>
          <CardDescription>
            {filteredAnnouncements.length !== announcements.length
              ? `Showing ${filteredAnnouncements.length} of ${announcements.length} announcements`
              : 'Manage your landing page announcements'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4"
              >
                Create Your First Announcement
              </Button>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements match your search criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((post) => (
                <div
                  key={post._id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{post.title}</h3>
                        <Badge 
                          className={
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {post.status === 'published' ? (
                            <><Eye className="h-3 w-3 mr-1" /> Published</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
                          )}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      
                      {post.coverImage && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>Has cover image</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
