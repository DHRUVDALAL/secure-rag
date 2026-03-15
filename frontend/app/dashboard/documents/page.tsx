'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { FileText, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  type: string;
  status: string;
  chunkCount: number;
  isConfidential: boolean;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string; email: string };
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  READY: { icon: CheckCircle, color: 'text-green-500', label: 'Ready' },
  PROCESSING: { icon: Loader2, color: 'text-yellow-500', label: 'Processing' },
  PENDING: { icon: Clock, color: 'text-blue-500', label: 'Pending' },
  FAILED: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
      setTotal(response.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">{total} documents in your knowledge base</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Link href="/dashboard/upload">
            <Button>Upload Document</Button>
          </Link>
        )}
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Upload documents to start building your knowledge base</p>
            <Link href="/dashboard/upload">
              <Button>Upload your first document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const status = statusConfig[doc.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;

            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.title}</h3>
                        {doc.isConfidential && <Badge variant="destructive">Confidential</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.fileName} · {formatFileSize(doc.fileSize)} · {doc.chunkCount} chunks
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} ·{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                      <StatusIcon className={`h-4 w-4 ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
