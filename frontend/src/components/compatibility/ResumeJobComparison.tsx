import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RadarChart } from './CompatibilityRadar';
import { CareerTimeline } from '../timeline/CareerTimeline';

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

interface ResumeJobComparisonProps {
  data: ComparisonData;
  onDownload?: () => void;
  onShare?: () => void;
  showDetails?: boolean;
}

const ResumeJobComparison: React.FC<ResumeJobComparisonProps> = ({
  data,
  onDownload,
  onShare,
  showDetails = true
}) => {
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
          data.skills.score,
          1,
          theme.palette.success.main
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Matched Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.skills.matched.map((skill) => (
              <Chip
                key={skill.name}
                label={skill.name}
                color={skill.required ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        {data.skills.missing.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Missing Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {data.skills.missing.map((skill) => (
                <Chip
                  key={skill.name}
                  label={skill.name}
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
          data.education.score,
          1,
          theme.palette.info.main
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Your Education
            </Typography>
            <Box>
              <Typography variant="body2">
                {data.education.match.degree}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.education.match.institution}
              </Typography>
              {data.education.match.year && (
                <Typography variant="body2" color="text.secondary">
                  {data.education.match.year}
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Required Education
            </Typography>
            <Box>
              <Typography variant="body2">
                {data.education.required.degree}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.education.required.field}
              </Typography>
            </Box>
          </Grid>
        </Grid>
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
          data.experience.score,
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
              {data.experience.years} years
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Required: {data.experience.required} years)
            </Typography>
          </Box>
        </Box>
        
        {showDetails && data.experience.relevant.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Relevant Experience
            </Typography>
            <CareerTimeline
              experiences={data.experience.relevant}
              variant="horizontal"
              showSkills
            />
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
          data.roleMatch.score,
          1,
          theme.palette.secondary.main
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {data.roleMatch.explanation}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography variant="h5" component="h2">
            Resume vs Job Match Analysis
          </Typography>
          
          <Box>
            {onDownload && (
              <Tooltip title="Download Analysis">
                <IconButton onClick={onDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {onShare && (
              <Tooltip title="Share Analysis">
                <IconButton onClick={onShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {renderScoreSection(
          'Overall Match Score',
          data.overallScore,
          1,
          theme.palette.primary.main
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderSkillsSection()}
            {renderEducationSection()}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {renderExperienceSection()}
            {renderRoleMatchSection()}
          </Grid>
          
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Detailed Analysis
              </Typography>
              <Box sx={{ height: 400 }}>
                <RadarChart
                  data={data.dimensions}
                  showTooltips
                  showLegend
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default ResumeJobComparison; 