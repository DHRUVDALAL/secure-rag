'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { FileText, MessageSquare, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DashboardStats {
  documents: {
    totalDocuments: number;
    readyDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
  };
  security: {
    totalQueries: number;
    suspiciousQueries: number;
    blockedQueries: number;
    queriesLast24h: number;
  };
}

export default function DashboardPage() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [docRes, adminRes] = await Promise.all([
          api.get('/documents/stats'),
          user?.role === 'ADMIN' ? api.get('/admin/dashboard') : Promise.resolve(null),
        ]);

        setStats({
          documents: docRes.data,
          security: adminRes?.data?.security || { totalQueries: 0, suspiciousQueries: 0, blockedQueries: 0, queriesLast24h: 0 },
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.firstName}! Here&apos;s your {company?.name} overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.documents.readyDocuments || 0} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents.processingDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">documents in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.security.totalQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.security.queriesLast24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            {(stats?.security.suspiciousQueries || 0) > 0 ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.security.blockedQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              threats blocked
              {(stats?.security.suspiciousQueries || 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats?.security.suspiciousQueries} suspicious
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Access Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'} className="text-sm py-1 px-3">
              {user?.role}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {user?.role === 'ADMIN' && 'Full access: manage users, documents, and view audit logs'}
              {user?.role === 'MANAGER' && 'Upload and manage documents, query the AI assistant'}
              {user?.role === 'EMPLOYEE' && 'Query the AI assistant using company knowledge base'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
