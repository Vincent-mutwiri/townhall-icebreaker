// src/components/admin/ContentModeration.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Pin, 
  PinOff, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Heart,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PostData {
  _id: string;
  text: string;
  media: string[];
  tags: string[];
  upvotes: string[];
  upvoteCount: number;
  isPinned: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ModerationStats {
  total: number;
  public: number;
  hidden: number;
  pinned: number;
  recentWeek: number;
}

interface ContentModerationProps {
  posts: PostData[];
  stats: ModerationStats;
}

export function ContentModeration({ posts: initialPosts, stats }: ContentModerationProps) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<PostData[]>(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter and sort posts
  const applyFilters = () => {
    let filtered = posts.filter(post => {
      const matchesSearch = post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesStatus = true;
      if (statusFilter === 'public') matchesStatus = post.isPublic;
      else if (statusFilter === 'hidden') matchesStatus = !post.isPublic;
      else if (statusFilter === 'pinned') matchesStatus = post.isPinned;
      
      return matchesSearch && matchesStatus;
    });

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          return b.upvoteCount - a.upvoteCount;
        case 'author':
          return a.author.name.localeCompare(b.author.name);
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
  };

  // Apply filters whenever search term, status filter, or sort changes
  useState(() => {
    applyFilters();
  });

  const handleToggleVisibility = async (postId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentVisibility }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update visibility');
      }

      // Update local state
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, isPublic: !currentVisibility } : post
      ));
      
      toast.success(currentVisibility ? 'Post hidden' : 'Post made public');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePin = async (postId: string, currentPinStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update pin status');
      }

      // Update local state
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, isPinned: !currentPinStatus } : post
      ));
      
      toast.success(currentPinStatus ? 'Post unpinned' : 'Post pinned');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete post');
      }

      // Update local state
      setPosts(posts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
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

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Manage community posts and maintain quality</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Back to Admin
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.public}</div>
                <div className="text-sm text-muted-foreground">Public</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.hidden}</div>
                <div className="text-sm text-muted-foreground">Hidden</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.pinned}</div>
                <div className="text-sm text-muted-foreground">Pinned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.recentWeek}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts by content, author, or tags..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    applyFilters();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="public">Public Only</SelectItem>
                <SelectItem value="hidden">Hidden Only</SelectItem>
                <SelectItem value="pinned">Pinned Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="author">Author A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({filteredPosts.length})</CardTitle>
          <CardDescription>
            Moderate community posts and manage content visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div
                  key={post._id}
                  className={cn(
                    "border rounded-lg p-6 transition-colors",
                    !post.isPublic && "bg-red-50 border-red-200",
                    post.isPinned && "bg-yellow-50 border-yellow-200"
                  )}
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback>
                          {post.author.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{post.author.name}</span>
                          {post.isPinned && (
                            <Badge variant="secondary" className="text-xs">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          {!post.isPublic && (
                            <Badge variant="destructive" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(post._id, post.isPublic)}
                      >
                        {post.isPublic ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePin(post._id, post.isPinned)}
                      >
                        {post.isPinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.upvoteCount} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author.email}
                    </span>
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
