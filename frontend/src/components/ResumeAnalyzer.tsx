'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeAnalysisProps {
  resumeId: string;
  resumeName: string;
}

interface AnalysisResult {
  resume_id: string;
  resume_filename: string;
  overall_match_score: number;
  detailed_scores: {
    skills_score: number;
    experience_score: number;
    education_score: number;
  };
  resume_analysis: {
    extracted_skills: string[];
    skill_confidence_scores: Record<string, number>;
    education: string[];
    experience: string[];
    metadata: Record<string, any>;
  };
  job_analysis: {
    required_skills: string[];
    required_education: string[];
    required_experience: string[];
  };
  skill_matching: {
    skill_matches: Array<{
      resume_skill: string;
      job_skill: string;
      similarity_score: number;
      is_good_match: boolean;
    }>;
    missing_skills: string[];
    extra_skills: string[];
    match_percentage: number;
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function ResumeAnalyzer({ resumeId, resumeName }: ResumeAnalysisProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_id: resumeId,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      toast.success('Analysis completed successfully!');
    } catch (err) {
      setError('Failed to analyze resume. Please try again.');
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resume Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description
            </label>
            <Textarea
              placeholder="Paste the job description here to analyze how well your resume matches..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
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
              'Analyze Resume'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getScoreIcon(analysisResult.overall_match_score)}
                    <span className={`text-2xl font-bold ${getScoreColor(analysisResult.overall_match_score)}`}>
                      {Math.round(analysisResult.overall_match_score * 100)}%
                    </span>
                  </div>
                  <Progress value={analysisResult.overall_match_score * 100} className="h-3" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Resume: {analysisResult.resume_filename}</p>
                  <p className="text-xs text-gray-500">Analyzed at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Skills Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getScoreIcon(analysisResult.detailed_scores.skills_score)}
                  <span className={`text-xl font-semibold ${getScoreColor(analysisResult.detailed_scores.skills_score)}`}>
                    {Math.round(analysisResult.detailed_scores.skills_score * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Experience Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getScoreIcon(analysisResult.detailed_scores.experience_score)}
                  <span className={`text-xl font-semibold ${getScoreColor(analysisResult.detailed_scores.experience_score)}`}>
                    {Math.round(analysisResult.detailed_scores.experience_score * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Education Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getScoreIcon(analysisResult.detailed_scores.education_score)}
                  <span className={`text-xl font-semibold ${getScoreColor(analysisResult.detailed_scores.education_score)}`}>
                    {Math.round(analysisResult.detailed_scores.education_score * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Required Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.job_analysis.required_skills.map((skill, index) => {
                    const match = analysisResult.skill_matching.skill_matches.find(
                      m => m.job_skill === skill
                    );
                    const isMatched = match && match.is_good_match;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{skill}</span>
                        {isMatched ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Your Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.resume_analysis.extracted_skills.map((skill, index) => {
                    const match = analysisResult.skill_matching.skill_matches.find(
                      m => m.resume_skill === skill
                    );
                    const isMatched = match && match.is_good_match;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{skill}</span>
                        {isMatched ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missing Skills */}
          {analysisResult.skill_matching.missing_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Missing Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.skill_matching.missing_skills.map((skill, index) => (
                    <Badge key={index} variant="destructive">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-gray-600">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Skill Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Skill Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResult.skill_matching.skill_matches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{match.resume_skill}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">{match.job_skill}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getScoreColor(match.similarity_score)}`}>
                        {Math.round(match.similarity_score * 100)}%
                      </span>
                      {match.is_good_match ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 