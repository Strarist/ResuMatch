import { BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import SkillRadar from './SkillRadar'

interface JobCardProps {
  job: {
    title: string
    company: string
    location: string
    description: string
    skills: string[]
    matchScore: number
  }
  children?: React.ReactNode
}

export default function JobCard({ job, children }: JobCardProps) {
  // Transform skills into radar chart data
  const skillData = job.skills.map(skill => ({
    name: skill,
    score: Math.random() * 40 + 60 // Random score between 60-100 for demo
  }))

  return (
    <div className="group relative rounded-xl bg-gray-900/50 p-6 backdrop-blur-sm ring-1 ring-gray-800 hover:ring-gray-700 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
              {job.title}
            </h3>
            
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>{job.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          {children}

          <p className="text-gray-400 line-clamp-2">
            {job.description}
          </p>

          <div className="mt-2">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2">
              View Details
            </button>
          </div>
        </div>

        <div className="w-full md:w-[300px] animate-fade-in">
          <SkillRadar jobSkills={skillData} />
        </div>
      </div>
    </div>
  )
} 