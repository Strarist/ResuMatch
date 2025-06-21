import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CustomRadarChart } from './CompatibilityRadar';
import { CareerTimeline } from '../timeline/CareerTimeline';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '../common';
import { SkillMatchChart } from './SkillMatchChart';
import { RoleFitScore } from './RoleFitScore';

interface Skill {
  name: string;
  level: number;
  required: boolean;
  category?: string;
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  year?: number;
  isRelevant: boolean;
}

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description?: string;
  skills?: string[];
}

interface ComparisonData {
  overallScore: number;
  skills: {
    matched: Skill[];
    missing: Skill[];
    score: number;
  };
  education: {
    match: Education;
    required: Education;
    score: number;
  };
  experience: {
    years: number;
    required: number;
    relevant: Experience[];
    score: number;
  };
  roleMatch: {
    score: number;
    explanation: string;
  };
  dimensions: {
    name: string;
    score: number;
    description: string;
  }[];
}

interface MatchResult {
  overall_score: number;
  resume_id: string;
  job_id: string;
  skill_match: {
    overall_score: number;
    matched_skills: string[];
    missing_skills: string[];
    suggestions: string[];
  };
  experience_match: {
    years_match: number;
    level_match: number;
    required_years: number;
    actual_years: number;
    suggestions: string[];
  };
  education_match: {
    match_score: number;
    level_match: number;
    field_relevance: number;
    missing_requirements: string[];
    suggestions: string[];
  };
  role_match: {
    title_similarity: number;
    level_match: number;
    required_level: string;
    actual_level: string;
    explanation: string;
    suggestions: string[];
  };
  suggestions: string[];
  timestamp: string;
}

interface ResumeJobComparisonProps {
  matchResult: MatchResult;
  resumeTitle?: string;
  jobTitle?: string;
}

const ResumeJobComparison: React.FC<ResumeJobComparisonProps> = ({ matchResult, resumeTitle, jobTitle }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'education' | 'role'>('overview');

  const theme = useTheme();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  const renderScoreSection = (
    title: string,
    score: number,
    maxScore: number = 1,
    color: string = theme.palette.primary.main
  ) => (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}
      >
        <Typography variant="subtitle1">
          {title}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color }}
        >
          {Math.round(score * 100)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(score / maxScore) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            bgcolor: color
          }
        }}
      />
    </Box>
  );
  
  const renderSkillsSection = () => (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Skills Match
        </Typography>
        {renderScoreSection(
          'Skills Alignment',
          matchResult.skill_match.overall_score,
          1,
          theme.palette.success.main
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Matched Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {matchResult.skill_match.matched_skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                color="primary"
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        {matchResult.skill_match.missing_skills.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Missing Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {matchResult.skill_match.missing_skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  variant="outlined"
                  color="error"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
  
  const renderEducationSection = () => (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Education Match
        </Typography>
        {renderScoreSection(
          'Education Alignment',
          matchResult.education_match.match_score,
          1,
          theme.palette.info.main
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <Typography variant="subtitle2" gutterBottom>
              Your Education
            </Typography>
            <Box>
              <Typography variant="body2">
                {matchResult.education_match.match_score >= 0.8 ? matchResult.education_match.match_score : 'Fair Match'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {matchResult.education_match.level_match >= 0.8 ? 'Excellent Match' : 'Fair Match'}
              </Typography>
              {matchResult.education_match.match_score >= 0.8 && (
                <Typography variant="body2" color="text.secondary">
                  {matchResult.education_match.level_match >= 0.8 ? 'Excellent Match' : 'Fair Match'}
                </Typography>
              )}
            </Box>
          </div>
          
          <div className="md:col-span-1">
            <Typography variant="subtitle2" gutterBottom>
              Required Education
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {matchResult.education_match.field_relevance >= 0.8 ? 'Excellent Match' : 'Fair Match'}
              </Typography>
            </Box>
          </div>
        </div>
      </Paper>
    </motion.div>
  );
  
  const renderExperienceSection = () => (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Experience Match
        </Typography>
        {renderScoreSection(
          'Experience Alignment',
          matchResult.experience_match.years_match,
          1,
          theme.palette.warning.main
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Years of Experience
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="body1">
              {matchResult.experience_match.actual_years} years
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Required: {matchResult.experience_match.required_years} years)
            </Typography>
          </Box>
        </Box>
        
        {matchResult.experience_match.level_match >= 0.8 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Level Match
            </Typography>
            <span className={`px-2 py-1 rounded-full ${getScoreColor(matchResult.experience_match.level_match)}`}>{Math.round(matchResult.experience_match.level_match * 100)}%</span>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
  
  const renderRoleMatchSection = () => (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Role Match
        </Typography>
        {renderScoreSection(
          'Role Alignment',
          matchResult.role_match.title_similarity,
          1,
          theme.palette.secondary.main
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {matchResult.role_match.explanation}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    if (score >= 0.6) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    return <XCircleIcon className="h-5 w-5 text-red-600" />;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'skills', label: 'Skills', icon: '💻' },
    { id: 'experience', label: 'Experience', icon: '⏰' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'role', label: 'Role', icon: '👔' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Resume vs Job Match Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {resumeTitle} vs {jobTitle}
        </p>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
              <span className="text-2xl font-bold text-white">
                {Math.round(matchResult.overall_score * 100)}%
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Overall Match Score
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {matchResult.overall_score >= 0.8 ? 'Excellent Match' :
               matchResult.overall_score >= 0.6 ? 'Good Match' :
               matchResult.overall_score >= 0.4 ? 'Fair Match' : 'Poor Match'}
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Skills Score */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h4>
                {getScoreIcon(matchResult.skill_match.overall_score)}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(matchResult.skill_match.overall_score)}`}>
                  {Math.round(matchResult.skill_match.overall_score * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {matchResult.skill_match.matched_skills.length} matched, {matchResult.skill_match.missing_skills.length} missing
                </p>
              </div>
            </GlassCard>

            {/* Experience Score */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Experience</h4>
                {getScoreIcon(matchResult.experience_match.years_match)}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(matchResult.experience_match.years_match)}`}>
                  {Math.round(matchResult.experience_match.years_match * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {matchResult.experience_match.actual_years} / {matchResult.experience_match.required_years} years
                </p>
              </div>
            </GlassCard>

            {/* Education Score */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Education</h4>
                {getScoreIcon(matchResult.education_match.match_score)}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(matchResult.education_match.match_score)}`}>
                  {Math.round(matchResult.education_match.match_score * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Level & Field Match
                </p>
              </div>
            </GlassCard>

            {/* Role Score */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Role</h4>
                {getScoreIcon(matchResult.role_match.title_similarity)}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(matchResult.role_match.title_similarity)}`}>
                  {Math.round(matchResult.role_match.title_similarity * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Title Similarity
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'skills' && (
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Skills Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Skills Chart */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Skills Match</h4>
                <SkillMatchChart
                  matchedSkills={matchResult.skill_match.matched_skills}
                  missingSkills={matchResult.skill_match.missing_skills}
                />
              </div>

              {/* Skills Lists */}
              <div className="space-y-6">
                {/* Matched Skills */}
                <div>
                  <h5 className="text-md font-medium text-green-600 mb-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Matched Skills ({matchResult.skill_match.matched_skills.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.skill_match.matched_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h5 className="text-md font-medium text-red-600 mb-3 flex items-center">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Missing Skills ({matchResult.skill_match.missing_skills.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.skill_match.missing_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {matchResult.skill_match.suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="text-md font-medium text-blue-600 dark:text-blue-400 mb-2">Suggestions</h5>
                <ul className="space-y-1">
                  {matchResult.skill_match.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'experience' && (
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Experience Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Experience Match</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Required Years:</span>
                    <span className="font-semibold">{matchResult.experience_match.required_years} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Your Experience:</span>
                    <span className="font-semibold">{matchResult.experience_match.actual_years} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Match Score:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.experience_match.years_match)}`}>
                      {Math.round(matchResult.experience_match.years_match * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Level Match</h4>
                <span className={`px-2 py-1 rounded-full ${getScoreColor(matchResult.experience_match.level_match)}`}>{Math.round(matchResult.experience_match.level_match * 100)}%</span>
              </div>
            </div>

            {/* Suggestions */}
            {matchResult.experience_match.suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h5 className="text-md font-medium text-yellow-600 dark:text-yellow-400 mb-2">Suggestions</h5>
                <ul className="space-y-1">
                  {matchResult.experience_match.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'education' && (
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Education Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Education Match</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Level Match:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.education_match.level_match)}`}>
                      {Math.round(matchResult.education_match.level_match * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Field Relevance:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.education_match.field_relevance)}`}>
                      {Math.round(matchResult.education_match.field_relevance * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Overall Score:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.education_match.match_score)}`}>
                      {Math.round(matchResult.education_match.match_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Missing Requirements</h4>
                {matchResult.education_match.missing_requirements.length > 0 ? (
                  <div className="space-y-2">
                    {matchResult.education_match.missing_requirements.map((req, index) => (
                      <div key={index} className="flex items-center text-red-600 dark:text-red-400">
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{req}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 dark:text-green-400 text-sm">All education requirements met!</p>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {matchResult.education_match.suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h5 className="text-md font-medium text-purple-600 dark:text-purple-400 mb-2">Suggestions</h5>
                <ul className="space-y-1">
                  {matchResult.education_match.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-purple-700 dark:text-purple-300">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'role' && (
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Role Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Role Compatibility</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Title Similarity:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.role_match.title_similarity)}`}>
                      {Math.round(matchResult.role_match.title_similarity * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Level Match:</span>
                    <span className={`font-semibold ${getScoreColor(matchResult.role_match.level_match)}`}>
                      {Math.round(matchResult.role_match.level_match * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Required Level:</span>
                    <span className="font-semibold capitalize">{matchResult.role_match.required_level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Your Level:</span>
                    <span className="font-semibold capitalize">{matchResult.role_match.actual_level}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Explanation</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {matchResult.role_match.explanation}
                </p>
              </div>
            </div>

            {/* Suggestions */}
            {matchResult.role_match.suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <h5 className="text-md font-medium text-indigo-600 dark:text-indigo-400 mb-2">Suggestions</h5>
                <ul className="space-y-1">
                  {matchResult.role_match.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-indigo-700 dark:text-indigo-300">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        )}
      </motion.div>

      {/* Overall Suggestions */}
      {matchResult.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overall Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchResult.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default ResumeJobComparison; 