import { motion } from 'framer-motion';
import { SkillMatch } from '../../../backend/app/schemas/compatibility';
import { Tooltip } from '../common/Tooltip';

interface SkillTagsProps {
  matchedSkills: SkillMatch[];
  missingSkills: SkillMatch[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical':
      return 'bg-blue-100 text-blue-800';
    case 'soft':
      return 'bg-green-100 text-green-800';
    case 'domain':
      return 'bg-purple-100 text-purple-800';
    case 'tools':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'technical':
      return '💻';
    case 'soft':
      return '🤝';
    case 'domain':
      return '🎯';
    case 'tools':
      return '🛠️';
    default:
      return '📌';
  }
};

export const SkillTags = ({ matchedSkills, missingSkills }: SkillTagsProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Matched Skills */}
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <span className="text-green-500 mr-2">✅</span>
          Matched Skills
          <span className="ml-2 text-sm text-gray-500">
            ({matchedSkills.length})
          </span>
        </h3>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-2"
        >
          {matchedSkills.map((skill) => (
            <motion.div key={skill.name} variants={item}>
              <Tooltip
                content={
                  <div className="p-2">
                    <div className="font-medium mb-1">Match Details</div>
                    <div className="text-sm">
                      <div>Semantic Score: {Math.round(skill.semantic_score! * 100)}%</div>
                      <div>Keyword Score: {Math.round(skill.keyword_score! * 100)}%</div>
                    </div>
                  </div>
                }
              >
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getCategoryColor(
                    skill.category
                  )}`}
                >
                  <span>{getCategoryIcon(skill.category)}</span>
                  <span>{skill.name}</span>
                </div>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Missing Skills */}
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <span className="text-red-500 mr-2">❌</span>
          Missing Skills
          <span className="ml-2 text-sm text-gray-500">
            ({missingSkills.length})
          </span>
        </h3>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-2"
        >
          {missingSkills.map((skill) => (
            <motion.div key={skill.name} variants={item}>
              <Tooltip
                content={
                  <div className="p-2">
                    <div className="font-medium mb-1">Improvement Suggestions</div>
                    <ul className="text-sm space-y-1">
                      {skill.suggestions?.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              >
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 border-2 border-dashed ${getCategoryColor(
                    skill.category
                  )}`}
                >
                  <span>{getCategoryIcon(skill.category)}</span>
                  <span>{skill.name}</span>
                </div>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Category Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Skills by Category
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['technical', 'soft', 'domain', 'tools'].map((category) => {
            const categorySkills = [
              ...matchedSkills,
              ...missingSkills
            ].filter((s) => s.category === category);
            
            const matchedCount = categorySkills.filter((s) => s.is_matched).length;
            const totalCount = categorySkills.length;
            
            if (totalCount === 0) return null;
            
            return (
              <div
                key={category}
                className={`p-3 rounded-lg ${getCategoryColor(category)}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span>{getCategoryIcon(category)}</span>
                  <span className="text-sm font-medium capitalize">
                    {category}
                  </span>
                </div>
                <div className="text-sm">
                  {matchedCount}/{totalCount} matched
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 