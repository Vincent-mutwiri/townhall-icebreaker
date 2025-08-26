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
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Image as ImageIcon, 
  Send,
  Pin,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
  const [page, setPage] = useState(1);

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
          media: [] // TODO: Add media upload functionality
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
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          Community Updates
        </h1>
        <p className="text-muted-foreground">
          Share your learning journey, insights, and achievements with the community
        </p>
      </div>

      {/* Create Post Form */}
      <Card className="mb-8">
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

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Media (Coming Soon)
                </Button>
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
        <div className="space-y-6">
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
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback>
                        {post.author.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{post.author.name}</span>
                        {post.author.level && (
                          <Badge variant="outline" className="text-xs">
                            Level {post.author.level}
                          </Badge>
                        )}
                        {post.isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
                    
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(post._id)}
                      className={cn(
                        "flex items-center gap-2",
                        post.isLiked && "text-red-500 hover:text-red-600"
                      )}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        post.isLiked && "fill-current"
                      )} />
                      {post.upvoteCount > 0 && post.upvoteCount}
                    </Button>
                    
                    <Button variant="ghost" size="sm" disabled>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
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
