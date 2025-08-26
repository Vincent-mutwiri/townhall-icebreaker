// src/components/admin/ReviewQueue.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Flag,
  User,
  Calendar,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReportData {
  _id: string;
  contentId: string;
  contentType: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter: {
    _id: string;
    name: string;
    email: string;
  };
  content?: {
    _id: string;
    text: string;
    createdAt: string;
    author: {
      _id: string;
      name: string;
      email: string;
    };
  };
}

interface ReviewStats {
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  total: number;
}

interface ReviewQueueProps {
  reports: ReportData[];
  stats: ReviewStats;
}

export function ReviewQueue({ reports: initialReports, stats }: ReviewQueueProps) {
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [filteredReports, setFilteredReports] = useState<ReportData[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Filter reports
  const applyFilters = () => {
    let filtered = reports.filter(report => {
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || report.reason === reasonFilter;
      return matchesStatus && matchesReason;
    });

    setFilteredReports(filtered);
  };

  // Apply filters whenever filters change
  useState(() => {
    applyFilters();
  });

  const handleStatusChange = async (reportId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: notes || adminNotes[reportId] || ''
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      // Update local state
      setReports(reports.map(report => 
        report._id === reportId ? { ...report, status: newStatus as any } : report
      ));
      
      toast.success(`Report ${newStatus} successfully`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewed': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment',
      inappropriate_content: 'Inappropriate Content',
      misinformation: 'Misinformation',
      copyright_violation: 'Copyright Violation',
      other: 'Other'
    };
    return labels[reason] || reason;
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
          <h1 className="text-3xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground">Review and moderate reported content</p>
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
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.reviewed}</div>
                <div className="text-sm text-muted-foreground">Reviewed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{stats.dismissed}</div>
                <div className="text-sm text-muted-foreground">Dismissed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={(value) => {
              setReasonFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="copyright_violation">Copyright Violation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            Review reported content and take appropriate action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className={cn(
                    "border rounded-lg p-6 transition-colors",
                    report.status === 'pending' && "bg-yellow-50 border-yellow-200",
                    report.status === 'resolved' && "bg-green-50 border-green-200"
                  )}
                >
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getStatusColor(report.status))}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1 capitalize">{report.status}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getReasonLabel(report.reason)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Reported {formatDate(report.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Reported by: {report.reporter.name}</span>
                      <span className="text-sm text-muted-foreground">({report.reporter.email})</span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-700">{report.description}</p>
                    )}
                  </div>

                  {/* Reported Content */}
                  {report.content && (
                    <div className="mb-4 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Content by: {report.content.author.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(report.content.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.content.text}</p>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Admin Notes</label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={adminNotes[report._id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({ 
                          ...prev, 
                          [report._id]: e.target.value 
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(report._id, 'reviewed')}
                        disabled={report.status === 'reviewed'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark Reviewed
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleStatusChange(report._id, 'resolved')}
                        disabled={report.status === 'resolved'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600 hover:text-gray-700"
                        onClick={() => handleStatusChange(report._id, 'dismissed')}
                        disabled={report.status === 'dismissed'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
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
