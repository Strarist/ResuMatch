import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard, LoadingBlur, AnimatedChart, Scrollable } from '../components/common';
import { MatchResult } from '../types/matching';
import { useToast } from '../hooks/useToast';
import { useMatchingStatus } from '../hooks/useMatchingStatus';

export const ResumeMatchResults = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { status, progress, error, isConnected } = useMatchingStatus(jobId!);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isConnected) return;
      
      try {
        const response = await fetch(`/api/v1/matching/batch-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId }),
        });
        const data = await response.json();
        setMatches(data.matches);
        showToast('Match results updated', 'success');
      } catch (error) {
        showToast('Error fetching match results', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [jobId, isConnected]);

  const chartData = matches.map(match => ({
    name: `Resume ${match.resume_id.slice(0, 8)}`,
    score: match.overall_score * 100,
    skills: match.skill_match.match_score * 100,
    experience: match.experience_match.match_score * 100,
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Resume Match Results</h1>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {status === 'processing' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Processing matches... {Math.round(progress)}%
        </div>
      )}
      
      <LoadingBlur isLoading={isLoading}>
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Match Overview</h2>
          <div className="h-80">
            <AnimatedChart
              data={chartData}
              type="bar"
              keys={['score', 'skills', 'experience']}
              indexBy="name"
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
            />
          </div>
        </GlassCard>

        <Scrollable className="mt-6 max-h-[600px]">
          {matches.map((match) => (
            <GlassCard key={match.resume_id} className="p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    Match Score: {(match.overall_score * 100).toFixed(1)}%
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-medium">Skills Match: </span>
                      {(match.skill_match.match_score * 100).toFixed(1)}%
                      {match.skill_match.semantic_score && (
                        <span className="text-sm text-gray-600 ml-2">
                          (Semantic: {(match.skill_match.semantic_score * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Experience Match: </span>
                      {(match.experience_match.match_score * 100).toFixed(1)}%
                      <span className="text-sm text-gray-600 ml-2">
                        (Role Similarity: {(match.experience_match.role_similarity * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Missing Skills:
                  </div>
                  <div className="mt-1">
                    {match.skill_match.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2 mb-2"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </Scrollable>
      </LoadingBlur>
    </div>
  );
}; 