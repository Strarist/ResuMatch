import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description?: string;
  skills?: string[];
  achievements?: string[];
}

interface CareerTimelineProps {
  experiences: Experience[];
  onExperienceClick?: (experience: Experience) => void;
  showSkills?: boolean;
  showAchievements?: boolean;
  variant?: 'vertical' | 'horizontal';
}

const CareerTimeline: React.FC<CareerTimelineProps> = ({
  experiences,
  onExperienceClick,
  showSkills = true,
  showAchievements = true,
  variant = 'vertical'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Sort experiences by date
  const sortedExperiences = [...experiences].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  
  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    return format(new Date(date), 'MMM yyyy');
  };
  
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
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };
  
  const renderExperienceContent = (experience: Experience) => (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          cursor: onExperienceClick ? 'pointer' : 'default',
          '&:hover': onExperienceClick ? {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            transition: 'all 0.2s ease-in-out'
          } : {}
        }}
        onClick={() => onExperienceClick?.(experience)}
      >
        <Typography variant="h6" component="h3" gutterBottom>
          {experience.title}
        </Typography>
        <Typography
          variant="subtitle1"
          color="primary"
          gutterBottom
        >
          {experience.company}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
        >
          {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
        </Typography>
        
        {experience.description && (
          <Typography variant="body2" paragraph>
            {experience.description}
          </Typography>
        )}
        
        {showSkills && experience.skills && experience.skills.length > 0 && (
          <Box sx={{ mt: 1, mb: 1 }}>
            {experience.skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
        
        {showAchievements && experience.achievements && experience.achievements.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Key Achievements:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {experience.achievements.map((achievement, index) => (
                <li key={index}>
                  <Typography variant="body2">
                    {achievement}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
  
  if (variant === 'horizontal' && !isMobile) {
    return (
      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex',
            minWidth: 'max-content',
            gap: '2rem',
            padding: '1rem'
          }}
        >
          {sortedExperiences.map((experience, index) => (
            <Box
              key={index}
              sx={{
                minWidth: 300,
                maxWidth: 400,
                position: 'relative'
              }}
            >
              {index < sortedExperiences.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '-1rem',
                    width: '2rem',
                    height: 2,
                    bgcolor: 'primary.main',
                    zIndex: 1
                  }}
                />
              )}
              {renderExperienceContent(experience)}
            </Box>
          ))}
        </motion.div>
      </Box>
    );
  }
  
  return (
    <Timeline
      position={isMobile ? 'right' : 'alternate'}
      sx={{
        '& .MuiTimelineItem-root:before': {
          flex: 0,
          padding: 0
        }
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sortedExperiences.map((experience, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent
              color="text.secondary"
              sx={{ flex: isMobile ? 0 : 1 }}
            >
              <Typography variant="body2">
                {formatDate(experience.startDate)}
              </Typography>
              <Typography variant="body2">
                {formatDate(experience.endDate)}
              </Typography>
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot
                color="primary"
                sx={{
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    transform: 'scale(1.2)',
                    transition: 'transform 0.2s ease-in-out'
                  }
                }}
              />
              {index < sortedExperiences.length - 1 && (
                <TimelineConnector
                  sx={{
                    bgcolor: 'primary.main',
                    width: 2
                  }}
                />
              )}
            </TimelineSeparator>
            
            <TimelineContent>
              {renderExperienceContent(experience)}
            </TimelineContent>
          </TimelineItem>
        ))}
      </motion.div>
    </Timeline>
  );
};

export default CareerTimeline; 