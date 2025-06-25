'use client'

import { useState } from 'react'
import JobCard from '@/components/JobCard'
import SkillMatch from '@/components/SkillMatch'

// Mock data - will be replaced with real API data
const mockMatches = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    matchScore: 92,
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'Looking for an experienced frontend developer to join our team...'
  },
  {
    id: 2,
    title: 'Full Stack Engineer',
    company: 'StartupX',
    location: 'Remote',
    matchScore: 88,
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    description: 'Join our fast-growing startup as a full stack engineer...'
  },
  // Add more mock data as needed
]

export default function MatchesPage() {
  const [matches] = useState(mockMatches)

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Your Job Matches
          </h1>
          <p className="text-lg text-gray-300">
            We found {matches.length} positions that match your skills
          </p>
        </div>

        <div className="grid gap-6">
          {matches.map((job) => (
            <JobCard key={job.id} job={job}>
              <SkillMatch skills={job.skills} matchScore={job.matchScore} />
            </JobCard>
          ))}
        </div>
      </div>
    </main>
  )
} 