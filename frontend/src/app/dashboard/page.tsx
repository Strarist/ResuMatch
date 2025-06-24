'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import AnimatedCounter from '@/components/AnimatedCounter'
import { useAuth } from "@/auth/AuthContext"
import { useRouter } from "next/navigation"

// Mock data
const recentActivity = [
  { id: 1, type: 'match', text: 'New job match: Senior Frontend Developer', time: '2h ago', icon: BriefcaseIcon },
  { id: 2, type: 'upload', text: 'Resume uploaded: Resume_June2024.pdf', time: '1d ago', icon: DocumentTextIcon },
  { id: 3, type: 'analysis', text: 'Skills analysis completed', time: '2d ago', icon: ChartBarIcon },
]

const stats = [
  { title: 'Resume Matches', value: 12, change: 3, color: 'blue', icon: BriefcaseIcon, details: '3 new matches from top tech companies.' },
  { title: 'Analysis Reports', value: 4, change: 1, color: 'purple', icon: ChartBarIcon, details: 'Your skills in React have improved.' },
  { title: 'Recent Uploads', value: 3, change: 0, color: 'pink', icon: DocumentTextIcon, details: 'Your latest resume has been processed.' },
]

export default function DashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStat, setSelectedStat] = useState<any>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          {user?.profile_img ? (
            <img src={user.profile_img} alt={user.name || user.email} className="w-14 h-14 rounded-full border-2 border-blue-400 shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center border-2 border-blue-400 shadow-lg">
              <span className="text-2xl text-blue-300 font-bold">{user?.name?.[0] || user?.email?.[0]}</span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {user?.name?.split(' ')[0] || user?.email}!</h1>
            <div className="text-gray-400 text-sm">{user?.email}</div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link 
            href="/upload" 
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-lift flex items-center gap-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Upload Resume
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div 
            key={stat.title}
            className={`rounded-xl bg-${stat.color}-500/20 p-6 shadow-lg backdrop-blur-md border border-${stat.color}-500/30 hover-scale animate-fade-in cursor-pointer`}
            style={{ animationDelay: `${0.4 + index * 0.2}s` }}
            onClick={() => setSelectedStat(stat)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-lg font-bold text-${stat.color}-300 mb-2`}>{stat.title}</h2>
                <AnimatedCounter end={stat.value} className="text-3xl font-extrabold text-white" />
              </div>
              <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
              <span className="text-green-400">+{stat.change}</span>
              <span className="text-gray-400">vs last week</span>
            </div>
            {selectedStat?.title === stat.title && (
              <p className="mt-4 text-sm text-gray-300 animate-fade-in">{stat.details}</p>
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="md:col-span-2 rounded-xl bg-gray-900/60 p-6 shadow-lg backdrop-blur-md border border-gray-800 animate-slide-in-left" style={{ animationDelay: '1s' }}>
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.map((activity, index) => (
              <div 
                key={activity.id}
                className="flex gap-4 items-start group hover-lift"
              >
                <div className={`p-2 rounded-lg bg-gray-800 group-hover:bg-${activity.type === 'match' ? 'blue' : activity.type === 'upload' ? 'purple' : 'pink'}-500/20 transition-colors`}>
                  <activity.icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">{activity.text}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-gray-900/60 p-6 shadow-lg backdrop-blur-md border border-gray-800 animate-slide-in-right" style={{ animationDelay: '1.2s' }}>
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="space-y-4">
            {[
              { text: 'View Job Matches', icon: BriefcaseIcon, href: '/matches' },
              { text: 'Update Resume', icon: DocumentTextIcon, href: '/upload' },
              { text: 'View Analytics', icon: ChartBarIcon, href: '/analysis' },
            ].map((action, index) => (
              <Link
                key={action.text}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group hover-lift"
              >
                <action.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-gray-300 group-hover:text-white transition-colors">{action.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
} 