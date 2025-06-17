import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../../utils';

interface TimelineItem {
  id: string;
  title: string;
  company?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'job' | 'education' | 'project' | 'certification';
  skills?: string[];
  icon?: string;
}

interface CareerTimelineProps {
  items: TimelineItem[];
  className?: string;
  showIcons?: boolean;
  showSkills?: boolean;
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  items,
  className = '',
  showIcons = true,
  showSkills = true,
}) => {
  const sortedItems = [...items].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const getTypeIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'job':
        return '💼';
      case 'education':
        return '🎓';
      case 'project':
        return '🚀';
      case 'certification':
        return '🏆';
      default:
        return '📅';
    }
  };

  const getTypeColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'job':
        return 'bg-blue-500';
      case 'education':
        return 'bg-green-500';
      case 'project':
        return 'bg-purple-500';
      case 'certification':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-8">
        {sortedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative flex items-start"
          >
            {/* Timeline dot */}
            <div className="absolute left-6 transform -translate-x-1/2">
              <div className={cn(
                'w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 shadow-lg',
                getTypeColor(item.type)
              )} />
            </div>

            {/* Content */}
            <div className="ml-16 flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {showIcons && (
                      <div className="text-2xl">
                        {item.icon || getTypeIcon(item.type)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      {item.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.company}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Date range */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(item.startDate)}
                    </p>
                    {item.endDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        - {formatDate(item.endDate)}
                      </p>
                    )}
                    {!item.endDate && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Present
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Skills */}
                {showSkills && item.skills && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 