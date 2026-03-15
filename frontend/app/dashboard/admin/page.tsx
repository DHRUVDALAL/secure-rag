'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ShieldAlert, ShieldCheck, Activity, Loader2 } from 'lucide-react';

interface QueryLogEntry {
  id: string;
  query: string;
  response: string | null;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  blocked: boolean;
  latencyMs: number;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
}

export default function AdminPage() {
  const [logs, setLogs] = useState<QueryLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suspicious'>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = filter === 'suspicious' ? '?suspiciousOnly=true' : '';
      const response = await api.get(`/admin/audit-logs${params}`);
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Monitor security and audit query activity</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          <Activity className="h-4 w-4 mr-1" />
          All Queries
        </Button>
        <Button
          variant={filter === 'suspicious' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setFilter('suspicious')}
        >
          <ShieldAlert className="h-4 w-4 mr-1" />
          Suspicious Only
        </Button>
      </div>

      {/* Audit Logs */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No {filter === 'suspicious' ? 'suspicious ' : ''}queries found</h3>
            <p className="text-muted-foreground">
              {filter === 'suspicious' ? 'No security threats detected.' : 'No queries have been made yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className={log.isSuspicious ? 'border-destructive/50' : ''}>
              <CardContent className="py-4 px-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {log.user.firstName} {log.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">{log.user.email}</span>
                    {log.isSuspicious && <Badge variant="destructive">Suspicious</Badge>}
                    {log.blocked && <Badge variant="outline" className="text-destructive border-destructive">Blocked</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{log.latencyMs}ms</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">Q: {log.query}</p>
                {log.response && (
                  <p className="text-sm text-muted-foreground line-clamp-2">A: {log.response}</p>
                )}
                {log.suspiciousReason && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                    <ShieldAlert className="h-3 w-3" />
                    {log.suspiciousReason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
