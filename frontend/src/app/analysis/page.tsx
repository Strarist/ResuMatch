'use client'

import SkillRadar from '@/components/SkillRadar'
import { ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const mockSkills = [
  { name: 'React', score: 95 },
  { name: 'TypeScript', score: 90 },
  { name: 'Next.js', score: 85 },
  { name: 'Tailwind CSS', score: 80 },
  { name: 'Node.js', score: 75 },
]

export default function AnalysisPage() {
  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 animate-slide-in-bottom">Analysis</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-xl bg-gray-900/60 p-6 shadow-lg backdrop-blur-md border border-gray-800 hover-lift hover:shadow-2xl transition-all animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-bold text-blue-400">Skill Radar</h2>
          </div>
          <SkillRadar jobSkills={mockSkills} />
        </div>
        <div className="rounded-xl bg-gray-900/60 p-6 shadow-lg backdrop-blur-md border border-gray-800 flex flex-col items-center justify-center hover-lift hover:shadow-2xl transition-all animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownTrayIcon className="h-6 w-6 text-purple-400" />
            <h2 className="text-lg font-bold text-purple-400">Download Report</h2>
          </div>
          <button className="px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold shadow-lg transition-all hover-scale active:scale-95 flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" /> Download PDF
          </button>
        </div>
      </div>
    </main>
  )
} 