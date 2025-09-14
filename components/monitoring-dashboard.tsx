import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import { analyticsTracker } from '@/lib/hooks/use-analytics';
import { performanceMonitor } from '@/lib/performance-monitor';
import { RefreshCw, TrendingUp, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

interface MonitoringDashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState(analyticsTracker.getUserMetrics());
  const [performanceData, setPerformanceData] = useState(performanceMonitor.getMetrics());
  const [memoryUsage, setMemoryUsage] = useState(performanceMonitor.getMemoryUsage());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'performance' | 'system'>(
    'overview'
  );

  const refreshData = () => {
    setAnalyticsData(analyticsTracker.getUserMetrics());
    setPerformanceData(performanceMonitor.getMetrics());
    setMemoryUsage(performanceMonitor.getMemoryUsage());
    setLastUpdate(new Date());
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getHealthStatus = () => {
    const memoryPercent = memoryUsage ? (memoryUsage.used / memoryUsage.limit) * 100 : 0;
    if (memoryPercent > 90) return { status: 'critical', color: 'destructive' };
    if (memoryPercent > 75) return { status: 'warning', color: 'secondary' };
    return { status: 'healthy', color: 'default' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={healthStatus.color as 'default' | 'secondary' | 'destructive'}>
            {healthStatus.status.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('analytics')}
          >
            Analytics
          </Button>
          <Button
            variant={activeView === 'performance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('performance')}
          >
            Performance
          </Button>
          <Button
            variant={activeView === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('system')}
          >
            System
          </Button>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">Analytics events tracked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(analyticsData.sessionDuration)}
                  </div>
                  <p className="text-xs text-muted-foreground">Current session time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {memoryUsage ? formatBytes(memoryUsage.used) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">JavaScript heap usage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.categories.length}</div>
                  <p className="text-xs text-muted-foreground">Event categories tracked</p>
                </CardContent>
              </Card>
            </div>

            {memoryUsage && (
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>Current JavaScript heap memory consumption</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{formatBytes(memoryUsage.used)}</span>
                    </div>
                    <Progress
                      value={(memoryUsage.used / memoryUsage.limit) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0</span>
                      <span>{formatBytes(memoryUsage.limit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most used features by event count</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {Object.entries(analyticsData.featureUsage)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Categories</CardTitle>
                <CardDescription>All tracked event categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analyticsData.categories.map(category => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'performance' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Average timing for key operations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {Object.entries(performanceData).map(([label, metrics]) => (
                      <div key={label} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{label.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-muted-foreground">
                            {metrics.count} samples
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Average</div>
                            <div className="font-mono">{formatDuration(metrics.average)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Latest</div>
                            <div className="font-mono">{formatDuration(metrics.latest)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Count</div>
                            <div className="font-mono">{metrics.count}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'system' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Browser and environment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>User Agent:</span>
                    <span className="text-muted-foreground max-w-[300px] truncate">
                      {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Language:</span>
                    <span className="text-muted-foreground">
                      {typeof window !== 'undefined' ? navigator.language : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Cookies Enabled:</span>
                    <span className="text-muted-foreground">
                      {typeof window !== 'undefined'
                        ? navigator.cookieEnabled
                          ? 'Yes'
                          : 'No'
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online:</span>
                    <span className="text-muted-foreground">
                      {typeof window !== 'undefined' ? (navigator.onLine ? 'Yes' : 'No') : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
