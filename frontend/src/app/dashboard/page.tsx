'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Plus, TrendingUp, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Resume {
  id: string;
  filename: string;
  upload_date: string;
  file_size: number;
  skills?: string[];
}

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [isAuthenticated]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/v1/resumes');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      const data = await response.json();
      setResumes(data.resumes || []);
    } catch {
      setError('Failed to load resumes');
      toast.error('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Manage your resumes and analyze job matches
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/upload')} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Resume
            </Button>
            <Button onClick={() => router.push('/analysis')} variant="outline" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analyze
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumes.length}</div>
              <p className="text-xs text-muted-foreground">
                {resumes.length === 1 ? 'resume uploaded' : 'resumes uploaded'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Detected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumes.reduce((total, resume) => total + (resume.skills?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                total skills across all resumes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumes.length > 0 ? new Date(resumes[0].upload_date).toLocaleDateString() : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                last resume uploaded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resumes List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </CardContent>
          </Card>
        ) : resumes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Resumes Yet</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4">
                Upload your first resume to start analyzing job matches
              </p>
              <Button onClick={() => router.push('/upload')} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">{resume.filename}</h4>
                        <p className="text-sm text-gray-600">
                          Uploaded: {new Date(resume.upload_date).toLocaleDateString()} • 
                          {(resume.file_size / 1024).toFixed(1)} KB
                        </p>
                        {resume.skills && resume.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {resume.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {resume.skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{resume.skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => router.push(`/analysis?resume=${resume.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        Analyze
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push('/upload')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-6 h-6" />
                <span>Upload New Resume</span>
              </Button>
              <Button 
                onClick={() => router.push('/analysis')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <TrendingUp className="w-6 h-6" />
                <span>Analyze Job Matches</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 