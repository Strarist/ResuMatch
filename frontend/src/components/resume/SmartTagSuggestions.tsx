import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  useTheme
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Tag {
  text: string;
  category: 'skill' | 'role' | 'education' | 'achievement';
  relevance: number;
  explanation?: string;
}

interface SmartTagSuggestionsProps {
  tags: Tag[];
  onTagSelect?: (tag: Tag) => void;
  onTagApply?: (tags: Tag[]) => void;
  maxSuggestions?: number;
  showExplanations?: boolean;
}

const SmartTagSuggestions: React.FC<SmartTagSuggestionsProps> = ({
  tags,
  onTagSelect,
  onTagApply,
  maxSuggestions = 5,
  showExplanations = true
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  
  // Sort tags by relevance
  const sortedTags = [...tags].sort((a, b) => b.relevance - a.relevance);
  const displayedTags = expanded ? sortedTags : sortedTags.slice(0, maxSuggestions);
  
  const handleTagClick = (tag: Tag) => {
    if (selectedTags.some(t => t.text === tag.text)) {
      setSelectedTags(selectedTags.filter(t => t.text !== tag.text));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    onTagSelect?.(tag);
  };
  
  const handleCopyTag = async (tag: Tag) => {
    try {
      await navigator.clipboard.writeText(tag.text);
      setCopiedTag(tag.text);
      setTimeout(() => setCopiedTag(null), 2000);
    } catch (err) {
      console.error('Failed to copy tag:', err);
    }
  };
  
  const handleApplyTags = () => {
    onTagApply?.(selectedTags);
    setSelectedTags([]);
  };
  
  const getCategoryColor = (category: Tag['category']) => {
    switch (category) {
      case 'skill':
        return theme.palette.primary.main;
      case 'role':
        return theme.palette.secondary.main;
      case 'education':
        return theme.palette.success.main;
      case 'achievement':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const tagVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6" component="h3">
            Suggested Tags
          </Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <AnimatePresence>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2
            }}
          >
            {displayedTags.map((tag) => (
              <motion.div
                key={tag.text}
                variants={tagVariants}
                layout
              >
                <Chip
                  label={tag.text}
                  onClick={() => handleTagClick(tag)}
                  onDelete={() => handleCopyTag(tag)}
                  deleteIcon={
                    copiedTag === tag.text ? (
                      <CheckIcon fontSize="small" />
                    ) : (
                      <CopyIcon fontSize="small" />
                    )
                  }
                  sx={{
                    bgcolor: selectedTags.some(t => t.text === tag.text)
                      ? getCategoryColor(tag.category)
                      : theme.palette.grey[100],
                    color: selectedTags.some(t => t.text === tag.text)
                      ? theme.palette.common.white
                      : theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: selectedTags.some(t => t.text === tag.text)
                        ? getCategoryColor(tag.category)
                        : theme.palette.grey[200]
                    }
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </AnimatePresence>
        
        {showExplanations && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {displayedTags.map((tag) => (
                <Box
                  key={tag.text}
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[50]
                  }}
                >
                  <Typography variant="subtitle2" color="primary">
                    {tag.text}
                  </Typography>
                  {tag.explanation && (
                    <Typography variant="body2" color="text.secondary">
                      {tag.explanation}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        )}
        
        {selectedTags.length > 0 && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setSelectedTags([])}
              size="small"
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyTags}
              startIcon={<AddIcon />}
              size="small"
            >
              Apply {selectedTags.length} Tags
            </Button>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default SmartTagSuggestions; 