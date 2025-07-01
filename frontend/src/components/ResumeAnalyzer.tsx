'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Target,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  overall_score: number;
  skills_match: {
    matched_skills: string[];
    missing_skills: string[];
    skill_scores: Record<string, number>;
  };
  experience_score: number;
  education_score: number;
  recommendations: string[];
}

interface ResumeAnalyzerProps {
  resumeId: string;
  resumeName?: string;
}

export default function ResumeAnalyzer({ resumeId }: ResumeAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resume_id: resumeId,
          job_description: jobDescription
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Analysis completed successfully!');
    } catch {
      setError('Failed to analyze resume. Please try again.');
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    if (score >= 60) return <Target className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px]"
              disabled={isAnalyzing}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !jobDescription.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze Match
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Overall Match Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {getScoreIcon(result.overall_score)}
                  <span className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                    {result.overall_score}%
                  </span>
                </div>
                <Progress value={result.overall_score} className="w-full" />
                <p className="text-gray-600">
                  {result.overall_score >= 80 ? 'Excellent match!' : 
                   result.overall_score >= 60 ? 'Good match' : 
                   'Needs improvement'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Skills Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Matched Skills */}
              {result.skills_match.matched_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Matched Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.skills_match.matched_skills.map((skill, index) => (
                      <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {result.skills_match.missing_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Missing Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.skills_match.missing_skills.map((skill, index) => (
                      <Badge key={index} variant="destructive">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Experience Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.experience_score)}`}>
                    {result.experience_score}%
                  </div>
                  <Progress value={result.experience_score} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Education Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.education_score)}`}>
                    {result.education_score}%
                  </div>
                  <Progress value={result.education_score} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 