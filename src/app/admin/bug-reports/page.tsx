"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  AlertCircle, 
  Bug, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Shield,
  Zap,
  Monitor,
  Gauge,
  Award,
  CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/lib/supabase/types";

type BugReport = Database['public']['Tables']['bug_reports']['Row'] & {
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    url?: string;
  }>;
};

const severityConfig = {
  critical: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircle },
  high: { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Shield },
  medium: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Zap },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Bug }
};

const categoryConfig = {
  security: { icon: Shield, label: "Security" },
  functionality: { icon: Bug, label: "Functionality" },
  ui: { icon: Monitor, label: "UI/UX" },
  performance: { icon: Gauge, label: "Performance" },
  other: { icon: AlertCircle, label: "Other" }
};

const statusConfig = {
  pending: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: "Pending" },
  reviewing: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Reviewing" },
  accepted: { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "Accepted" },
  rejected: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Rejected" },
  fixed: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Fixed" }
};

export default function BugReportsAdminPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [canAwardPoints, setCanAwardPoints] = useState(false);
  const [isAwardingPoints, setIsAwardingPoints] = useState(false);
  const [customPoints, setCustomPoints] = useState<string>("");
  const [awardSuccess, setAwardSuccess] = useState(false);

  useEffect(() => {
    fetchReports();
    checkAdminStatus();
  }, [page, filterStatus, filterSeverity]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/bug-bounty/award-points');
      const data = await response.json();
      setCanAwardPoints(data.canAwardPoints);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });
      
      if (filterStatus) params.append("status", filterStatus);
      if (filterSeverity) params.append("severity", filterSeverity);
      
      const response = await fetch(`/api/bug-bounty/list?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports");
      }
      
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getDefaultPoints = (severity: string) => {
    switch (severity) {
      case 'critical': return 1000;
      case 'high': return 500;
      case 'medium': return 250;
      case 'low': return 100;
      default: return 0;
    }
  };

  const handleAwardPoints = async (report: BugReport) => {
    setIsAwardingPoints(true);
    setError("");
    
    try {
      const pointsToAward = customPoints ? parseInt(customPoints) : getDefaultPoints(report.severity);
      
      const response = await fetch('/api/bug-bounty/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bugReportId: report.id,
          points: getDefaultPoints(report.severity),
          customPoints: customPoints ? parseInt(customPoints) : null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to award points');
      }
      
      setAwardSuccess(true);
      setCustomPoints("");
      
      // Refresh the reports
      await fetchReports();
      
      // Show success for 3 seconds
      setTimeout(() => {
        setAwardSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error awarding points:', err);
      setError(err instanceof Error ? err.message : 'Failed to award points');
    } finally {
      setIsAwardingPoints(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading bug reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bug Reports Admin</h1>
          <p className="text-gray-400">Review and manage submitted bug reports</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4 bg-white/5 backdrop-blur border-white/10">
          <div className="flex flex-wrap gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setFilterStatus("");
                setFilterSeverity("");
                setPage(1);
              }}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 p-4 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </Card>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card className="p-8 bg-white/5 backdrop-blur border-white/10 text-center">
            <p className="text-gray-400">No bug reports found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const SeverityIcon = severityConfig[report.severity].icon;
              const CategoryIcon = categoryConfig[report.category].icon;
              
              return (
                <Card
                  key={report.id}
                  className="p-6 bg-white/5 backdrop-blur border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {report.title}
                      </h3>
                      <p className="text-gray-400 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                    <Badge className={statusConfig[report.status].color}>
                      {statusConfig[report.status].label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Severity */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${severityConfig[report.severity].color}`}>
                      <SeverityIcon className="w-4 h-4" />
                      <span className="capitalize">{report.severity}</span>
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-1 text-gray-400">
                      <CategoryIcon className="w-4 h-4" />
                      <span>{categoryConfig[report.category].label}</span>
                    </div>

                    {/* Submitter */}
                    {report.twitter_handle && (
                      <div className="text-gray-400">
                        @{report.twitter_handle}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Attachments */}
                    {report.attachments && report.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <ImageIcon className="w-4 h-4" />
                        <span>{report.attachments.length} attachment{report.attachments.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Reward & Points */}
                    {report.reward_amount > 0 && (
                      <div className="text-green-400 font-semibold">
                        ${report.reward_amount}
                      </div>
                    )}
                    
                    {/* Points Badge */}
                    {report.points_awarded > 0 && (
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                        <Award className="w-3 h-3 mr-1" />
                        {report.points_awarded} pts
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-white">
              Page {page} of {totalPages}
            </span>
            
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedReport && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReport(null)}
          >
            <Card
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedReport.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig[selectedReport.status].color}>
                        {statusConfig[selectedReport.status].label}
                      </Badge>
                      <Badge className={severityConfig[selectedReport.severity].color}>
                        {selectedReport.severity}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        {categoryConfig[selectedReport.category].label}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedReport(null)}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Submitted by:</span>
                    <p className="text-white">
                      {selectedReport.twitter_handle ? `@${selectedReport.twitter_handle}` : 'Anonymous'}
                      {selectedReport.email && (
                        <span className="text-gray-400 ml-2">({selectedReport.email})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Submitted:</span>
                    <p className="text-white">
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedReport.url_where_found && (
                    <div className="col-span-2">
                      <span className="text-gray-400">URL:</span>
                      <p className="text-white">
                        <a
                          href={selectedReport.url_where_found}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {selectedReport.url_where_found}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Steps to Reproduce */}
                {selectedReport.steps_to_reproduce && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Steps to Reproduce</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {selectedReport.steps_to_reproduce}
                    </p>
                  </div>
                )}

                {/* Expected vs Actual */}
                {(selectedReport.expected_behavior || selectedReport.actual_behavior) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.expected_behavior && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Expected Behavior</h4>
                        <p className="text-gray-300">
                          {selectedReport.expected_behavior}
                        </p>
                      </div>
                    )}
                    {selectedReport.actual_behavior && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Actual Behavior</h4>
                        <p className="text-gray-300">
                          {selectedReport.actual_behavior}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Browser Info */}
                {selectedReport.browser_info && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Browser Info</h3>
                    <p className="text-gray-400 text-sm font-mono">
                      {selectedReport.browser_info}
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Attachments</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReport.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {attachment.file_type.startsWith('image/') && attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.file_name}
                              className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-32 bg-white/5 rounded-lg flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-400 text-center px-2">
                                {attachment.file_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(attachment.file_size)}
                              </span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedReport.reviewer_notes && (
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Reviewer Notes</h3>
                    <p className="text-gray-300">
                      {selectedReport.reviewer_notes}
                    </p>
                    {selectedReport.reviewed_at && (
                      <p className="text-gray-400 text-sm mt-2">
                        Reviewed {formatDistanceToNow(new Date(selectedReport.reviewed_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )}

                {/* Points Section */}
                {canAwardPoints && selectedReport.points_awarded === 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Award Points</h3>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm mb-2">
                          Suggested points for {selectedReport.severity} severity: {getDefaultPoints(selectedReport.severity)}
                        </p>
                        <Input
                          type="number"
                          placeholder={`Default: ${getDefaultPoints(selectedReport.severity)} points`}
                          value={customPoints}
                          onChange={(e) => setCustomPoints(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          disabled={isAwardingPoints}
                        />
                      </div>
                      <Button
                        onClick={() => handleAwardPoints(selectedReport)}
                        disabled={isAwardingPoints}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        {isAwardingPoints ? (
                          <>
                            <span className="animate-spin mr-2">⌛</span>
                            Awarding...
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4 mr-2" />
                            Award Points
                          </>
                        )}
                      </Button>
                    </div>
                    {awardSuccess && (
                      <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Points awarded successfully!
                      </div>
                    )}
                  </div>
                )}

                {/* Points Already Awarded */}
                {selectedReport.points_awarded > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Points Awarded</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">
                          {selectedReport.points_awarded} points
                        </p>
                        {selectedReport.points_awarded_at && (
                          <p className="text-gray-400 text-sm mt-1">
                            {formatDistanceToNow(new Date(selectedReport.points_awarded_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reward */}
                {selectedReport.reward_amount > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Reward Amount</h3>
                      <span className="text-2xl font-bold text-green-400">
                        ${selectedReport.reward_amount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
