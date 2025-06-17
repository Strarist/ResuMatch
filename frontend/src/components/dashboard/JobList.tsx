import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Job, jobs } from '../../lib/api';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

interface JobListProps {
  onSelectJob?: (job: Job) => void;
}

const jobTypes = ['full-time', 'part-time', 'contract', 'remote'] as const;

export default function JobList({ onSelectJob }: JobListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', { search, sortBy, type: selectedType, location: selectedLocation, skills: selectedSkills }],
    queryFn: () =>
      jobs.list({
        search,
        sortBy,
        type: selectedType || undefined,
        location: selectedLocation || undefined,
        skills: selectedSkills,
      }),
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
        Error loading jobs. Please try again later.
      </div>
    );
  }

  // Extract unique locations and skills from all jobs
  const allLocations = Array.from(
    new Set(data.map((job) => job.location))
  ).sort();

  const allSkills = Array.from(
    new Set(data.flatMap((job) => job.requirements))
  ).sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">Jobs</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="createdAt">Recently Posted</option>
              <option value="matchScore">Match Score</option>
              <option value="salary">Salary</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Job Type Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Job Type</h3>
            <div className="flex flex-wrap gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
            <div className="flex flex-wrap gap-2">
              {allLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLocation === location
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h3>
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
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {data.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectJob?.(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <BriefcaseIcon className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        {job.type}
                      </div>
                      {job.salary && (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}{' '}
                          {job.salary.currency}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.requirements.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requirements.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{job.requirements.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {job.matchScore && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      Match Score
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        job.matchScore >= 80
                          ? 'text-green-600'
                          : job.matchScore >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {job.matchScore}%
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