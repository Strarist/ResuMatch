interface SkillMatchProps {
  skills: string[]
  matchScore: number
}

export default function SkillMatch({ skills, matchScore }: SkillMatchProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-300">Match Score</div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-gray-700">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${matchScore}%` }}
            />
          </div>
          <span className="text-sm font-medium text-blue-400">{matchScore}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
} 