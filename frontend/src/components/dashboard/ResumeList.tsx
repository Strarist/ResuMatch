import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Resume, resumes } from '../../lib/api';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

interface ResumeListProps {
  onSelectResume?: (resume: Resume) => void;
}

export default function ResumeList({ onSelectResume }: ResumeListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', { search, sortBy, skills: selectedSkills }],
    queryFn: () => resumes.list({ search, sortBy, skills: selectedSkills }),
  });

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error || !data) {
    return (
      <div className="text-red-500">
        Error loading resumes. Please try again later.
      </div>
    );
  }

  // Extract unique skills from all resumes
  const allSkills = Array.from(
    new Set(data.flatMap((resume) => resume.skills))
  ).sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">Resumes</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resumes..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="createdAt">Recently Added</option>
              <option value="matchScore">Match Score</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Skills Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Skills</h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Resume List */}
        <div className="space-y-4">
          {data.map((resume) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectResume?.(resume)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{resume.title}</h3>
                    <p className="text-sm text-gray-500">
                      {resume.experience} years of experience
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resume.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.skills.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{resume.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {resume.matchScore && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      Match Score
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        resume.matchScore >= 80
                          ? 'text-green-600'
                          : resume.matchScore >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {resume.matchScore}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
} 