'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import ResumeAnalyzer from '@/components/ResumeAnalyzer';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

interface Resume {
  id: string;
  filename: string;
  upload_date: string;
  file_size: number;
  skills?: string[];
}

export default function AnalysisPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    // Check for resume ID in URL parameters
    const resumeId = searchParams.get('resume');
    if (resumeId && resumes.length > 0) {
      const resumeExists = resumes.find(r => r.id === resumeId);
      if (resumeExists) {
        setSelectedResumeId(resumeId);
      } else {
        toast.error('Resume not found');
      }
    }
  }, [searchParams, resumes]);

  const fetchResumes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/resumes`);
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

  const selectedResume = resumes.find(r => r.id === selectedResumeId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading resumes...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resumes Found</h3>
              <p className="text-gray-600 mb-4">
                You need to upload a resume first before you can analyze it.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push('/upload')}>
                  Upload Resume
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resume Analysis</h1>
            <p className="text-gray-600">
              Analyze your resume against job descriptions to see how well you match
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Resume Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Select Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Choose a resume to analyze
                </label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{resume.filename}</span>
                          {resume.skills && resume.skills.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({resume.skills.length} skills)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedResume && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{selectedResume.filename}</h4>
                      <p className="text-sm text-gray-600">
                        Uploaded: {new Date(selectedResume.upload_date).toLocaleDateString()}
                      </p>
                      {selectedResume.skills && selectedResume.skills.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Skills detected: {selectedResume.skills.length}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {(selectedResume.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Component */}
        {selectedResume && (
          <ResumeAnalyzer 
            resumeId={selectedResume.id} 
            resumeName={selectedResume.filename} 
          />
        )}

        {/* Instructions */}
        {!selectedResume && (
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Select Your Resume</h4>
                    <p className="text-gray-600">
                      Choose the resume you want to analyze from the dropdown above.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Paste Job Description</h4>
                    <p className="text-gray-600">
                      Copy and paste the job description you want to match against.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Get Analysis Results</h4>
                    <p className="text-gray-600">
                      View detailed matching scores, skill gaps, and personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 