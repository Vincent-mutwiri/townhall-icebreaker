// src/components/admin/UserManagement.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserCheck, 
  Shield, 
  GraduationCap, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Crown,
  Calendar,
  Trophy,
  BookOpen,
  Gamepad2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'teacher' | 'admin';
  avatar?: string;
  points: number;
  level: number;
  stats: {
    coursesTaken: number;
    coursesCompleted: number;
    gamesPlayed: number;
    gamesWon: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  total: number;
  active: number;
  admins: number;
  teachers: number;
  students: number;
}

interface UserManagementProps {
  users: UserData[];
  stats: UserStats;
}

export function UserManagement({ users: initialUsers, stats }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter and sort users
  const applyFilters = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'points':
          return b.points - a.points;
        case 'level':
          return b.level - a.level;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  // Apply filters whenever search term, role filter, or sort changes
  useState(() => {
    applyFilters();
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole as any } : user
      ));
      
      toast.success('User role updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      // Update local state
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
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
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active (30d)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.admins}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.teachers}</div>
                <div className="text-sm text-muted-foreground">Teachers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{stats.students}</div>
                <div className="text-sm text-muted-foreground">Students</div>
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
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    applyFilters();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
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
                <SelectItem value="points">Most Points</SelectItem>
                <SelectItem value="level">Highest Level</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{user.name}</span>
                      <Badge className={cn("text-xs", getRoleColor(user.role))}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </Badge>
                      {user.level > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Level {user.level}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {user.points} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {user.stats.coursesCompleted} courses
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3" />
                        {user.stats.gamesPlayed} games
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user._id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
