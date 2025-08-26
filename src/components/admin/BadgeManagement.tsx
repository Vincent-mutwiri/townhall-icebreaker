// src/components/admin/BadgeManagement.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Star, 
  Crown, 
  Medal, 
  Award, 
  Gift, 
  Target,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BadgeData {
  _id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  rule: {
    type: string;
    value: number;
    operator: string;
  };
  rarity: string;
  isActive: boolean;
  order: number;
}

interface BadgeManagementProps {
  badges: BadgeData[];
}

export function BadgeManagement({ badges: initialBadges }: BadgeManagementProps) {
  const [badges, setBadges] = useState<BadgeData[]>(initialBadges);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
  const [formData, setFormData] = useState<BadgeData>({
    name: '',
    description: '',
    icon: 'Trophy',
    color: 'yellow',
    category: 'achievement',
    rule: {
      type: 'points',
      value: 1000,
      operator: 'gte'
    },
    rarity: 'common',
    isActive: true,
    order: 0
  });

  const iconOptions = [
    { value: 'Trophy', label: 'Trophy', icon: Trophy },
    { value: 'Star', label: 'Star', icon: Star },
    { value: 'Crown', label: 'Crown', icon: Crown },
    { value: 'Medal', label: 'Medal', icon: Medal },
    { value: 'Award', label: 'Award', icon: Award },
    { value: 'Gift', label: 'Gift', icon: Gift },
    { value: 'Target', label: 'Target', icon: Target }
  ];

  const colorOptions = [
    { value: 'yellow', label: 'Gold', class: 'text-yellow-500' },
    { value: 'blue', label: 'Blue', class: 'text-blue-500' },
    { value: 'green', label: 'Green', class: 'text-green-500' },
    { value: 'purple', label: 'Purple', class: 'text-purple-500' },
    { value: 'red', label: 'Red', class: 'text-red-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Name and description are required');
      return;
    }

    try {
      const url = editingBadge ? `/api/admin/badges/${editingBadge._id}` : '/api/admin/badges';
      const method = editingBadge ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save badge');
      }

      const result = await response.json();
      
      if (editingBadge) {
        setBadges(badges.map(badge => 
          badge._id === editingBadge._id ? result.badge : badge
        ));
        toast.success('Badge updated successfully');
        setEditingBadge(null);
      } else {
        setBadges([...badges, result.badge]);
        toast.success('Badge created successfully');
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: 'Trophy',
        color: 'yellow',
        category: 'achievement',
        rule: {
          type: 'points',
          value: 1000,
          operator: 'gte'
        },
        rarity: 'common',
        isActive: true,
        order: 0
      });
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (badge: BadgeData) => {
    setFormData(badge);
    setEditingBadge(badge);
    setIsCreating(true);
  };

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/badges/${badgeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete badge');
      }

      setBadges(badges.filter(badge => badge._id !== badgeId));
      toast.success('Badge deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Trophy;
  };

  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find(option => option.value === color);
    return colorOption ? colorOption.class : 'text-yellow-500';
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Badge Management</h1>
          <p className="text-muted-foreground">Create and manage achievement badges</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Badge
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingBadge ? 'Edit Badge' : 'Create New Badge'}</CardTitle>
            <CardDescription>
              {editingBadge ? 'Update badge details' : 'Design a new achievement badge'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Badge Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., First Course Completed"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this badge represents..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Color</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded-full", option.class.replace('text-', 'bg-'))} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Rarity</Label>
                  <Select value={formData.rarity} onValueChange={(value) => setFormData({ ...formData, rarity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Rule Type</Label>
                  <Select 
                    value={formData.rule.type} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      rule: { ...formData.rule, type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="courses">Courses Completed</SelectItem>
                      <SelectItem value="games">Games Played</SelectItem>
                      <SelectItem value="streak">Learning Streak</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ruleValue">Threshold Value</Label>
                  <Input
                    id="ruleValue"
                    type="number"
                    value={formData.rule.value}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      rule: { ...formData.rule, value: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBadge(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Badges List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => {
          const IconComponent = getIconComponent(badge.icon);
          return (
            <Card key={badge._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full bg-gray-100", getColorClass(badge.color))}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{badge.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {badge.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(badge)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(badge._id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Rule:</span>
                    <span>{badge.rule.type} ≥ {badge.rule.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rarity:</span>
                    <Badge variant="secondary" className="text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {badges.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No badges created yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first achievement badge to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
