// src/components/updates/UpdatesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Heart,
  Share2,
  Image as ImageIcon,
  Send,
  Pin,
  Calendar,
  User,
  Loader2,
  MoreHorizontal,
  Flag,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useS3Upload } from "@/hooks/useS3Upload";
import { MediaUploader } from "@/components/ui/media-uploader";
import Image from "next/image";

interface UpdatePost {
  _id: string;
  text: string;
  media: string[];
  tags: string[];
  upvotes: string[];
  upvoteCount: number;
  isPinned: boolean;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    level: number;
  };
}

interface UpdatesData {
  posts: UpdatePost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function UpdatesClient() {
  const { user } = useAuth();
  const [data, setData] = useState<UpdatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const { uploadFile, isUploading: uploadingMedia } = useS3Upload();
  const [page, setPage] = useState(1);
  const [reportingPost, setReportingPost] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const fetchUpdates = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/updates?page=${pageNum}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }
      
      const result = await response.json();
      setData(result);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleMediaUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Limit to 4 images total
    if (newPostMedia.length + fileArray.length > 4) {
      toast.error('You can upload a maximum of 4 images per post');
      return;
    }

    try {
      const uploadPromises = fileArray.map(file => 
        uploadFile(file, {
          folder: 'updates',
          maxSizeMB: 5,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        })
      );
      
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(url => url !== null) as string[];

      if (successfulUploads.length > 0) {
        setNewPostMedia(prev => [...prev, ...successfulUploads]);
      }
    } catch (error) {
      toast.error('Failed to upload images');
    }
  };

  const handleSingleMediaUpload = (url: string) => {
    if (url && newPostMedia.length < 4) {
      setNewPostMedia(prev => [...prev, url]);
    }
  };

  const removeMedia = (index: number) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostText.trim()) {
      toast.error('Please enter some text for your post');
      return;
    }

    setPosting(true);
    try {
      const tags = newPostTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newPostText,
          tags,
          media: newPostMedia
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      const result = await response.json();
      toast.success('Post created successfully!');
      
      // Clear form
      setNewPostText('');
      setNewPostTags('');
      setNewPostMedia([]);
      
      // Refresh the feed
      fetchUpdates(1);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const response = await fetch(`/api/updates/${postId}/react`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }

      const result = await response.json();
      
      // Update the post in the local state
      setData(prevData => {
        if (!prevData) return prevData;
        
        return {
          ...prevData,
          posts: prevData.posts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  isLiked: result.isLiked,
                  upvoteCount: result.upvoteCount
                }
              : post
          )
        };
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const handleReportPost = async (postId: string) => {
    if (!reportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      const response = await fetch(`/api/updates/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to report post');
      }

      toast.success('Post reported successfully. Our moderation team will review it.');
      setReportingPost(null);
      setReportReason('');
      setReportDescription('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          Community Updates
        </h1>
        <p className="text-sm md:text-base text-muted-foreground px-4">
          Share your learning journey, insights, and achievements with the community
        </p>
      </div>

      {/* Create Post Form */}
      <Card className="mb-6 md:mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Share an Update</CardTitle>
          <CardDescription>
            What have you been learning? Share your progress, insights, or achievements!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <Label htmlFor="postText">Your Update</Label>
              <Textarea
                id="postText"
                placeholder="Share what you've been learning, a breakthrough you had, or ask the community a question..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="min-h-[100px]"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {newPostText.length}/1000 characters
              </div>
            </div>
            
            <div>
              <Label htmlFor="postTags">Tags (optional)</Label>
              <Input
                id="postTags"
                placeholder="e.g., javascript, learning, breakthrough (comma-separated)"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
              />
            </div>

            {/* Media Upload Preview */}
            {newPostMedia.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {newPostMedia.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-20 sm:h-24 rounded-lg overflow-hidden border">
                        <Image
                          src={url}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={() => removeMedia(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <MediaUploader
                  onUploadComplete={handleSingleMediaUpload}
                  folder="updates"
                  maxSizeMB={5}
                  allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
                  accept="image/*"
                  buttonText={`Add Photos (${newPostMedia.length}/4)`}
                  showPreview={false}
                  className={newPostMedia.length >= 4 ? 'opacity-50 pointer-events-none' : ''}
                />
              </div>
              
              <Button type="submit" disabled={posting || !newPostText.trim()}>
                {posting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {posting ? 'Posting...' : 'Share Update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Updates Feed */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {data?.posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No updates yet!</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share your learning journey with the community.
                </p>
              </CardContent>
            </Card>
          ) : (
            data?.posts.map((post) => (
              <Card key={post._id} className={cn(
                "transition-shadow hover:shadow-md",
                post.isPinned && "border-yellow-200 bg-yellow-50"
              )}>
                <CardContent className="pt-6">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback>
                        {post.author.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm sm:text-base truncate">{post.author.name}</span>
                        {post.author.level && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Level {post.author.level}
                          </Badge>
                        )}
                        {post.isPinned && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{post.text}</p>

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-4">
                        <div className={cn(
                          "grid gap-1 sm:gap-2 rounded-lg overflow-hidden",
                          post.media.length === 1 && "grid-cols-1",
                          post.media.length === 2 && "grid-cols-1 sm:grid-cols-2",
                          post.media.length === 3 && "grid-cols-1 sm:grid-cols-2",
                          post.media.length === 4 && "grid-cols-2"
                        )}>
                          {post.media.map((url, index) => (
                            <div
                              key={index}
                              className={cn(
                                "relative cursor-pointer hover:opacity-90 transition-opacity",
                                post.media.length === 3 && index === 0 && "sm:col-span-2",
                                "h-32 sm:h-48 md:h-64"
                              )}
                              onClick={() => window.open(url, '_blank')}
                            >
                              <Image
                                src={url}
                                alt={`Post image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpvote(post._id)}
                        className={cn(
                          "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm",
                          post.isLiked && "text-red-500 hover:text-red-600"
                        )}
                      >
                        <Heart className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          post.isLiked && "fill-current"
                        )} />
                        <span className="hidden sm:inline">
                          {post.upvoteCount > 0 && post.upvoteCount}
                        </span>
                        <span className="sm:hidden">
                          {post.upvoteCount > 0 && post.upvoteCount}
                        </span>
                      </Button>

                      <Button variant="ghost" size="sm" disabled className="text-xs sm:text-sm">
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>

                    {/* Report Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Flag className="h-4 w-4 mr-2" />
                              Report Post
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Report Post</DialogTitle>
                              <DialogDescription>
                                Help us maintain a safe community by reporting inappropriate content.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="reportReason">Reason for reporting</Label>
                                <Select value={reportReason} onValueChange={setReportReason}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="spam">Spam</SelectItem>
                                    <SelectItem value="harassment">Harassment</SelectItem>
                                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                                    <SelectItem value="misinformation">Misinformation</SelectItem>
                                    <SelectItem value="copyright_violation">Copyright Violation</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="reportDescription">Additional details (optional)</Label>
                                <Textarea
                                  id="reportDescription"
                                  placeholder="Provide more context about why you're reporting this post..."
                                  value={reportDescription}
                                  onChange={(e) => setReportDescription(e.target.value)}
                                  maxLength={500}
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                  {reportDescription.length}/500 characters
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setReportReason('');
                                    setReportDescription('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleReportPost(post._id)}
                                  disabled={!reportReason}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Submit Report
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => fetchUpdates(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {data.pagination.currentPage} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!data.pagination.hasNextPage}
                onClick={() => fetchUpdates(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
