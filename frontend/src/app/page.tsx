'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import AnimatedCounter from '@/components/AnimatedCounter'
import TiltCard from '@/components/TiltCard'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-3xl relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-glow"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight animate-fade-in">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI-Powered
          </span>
          <br />
          <span className="animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
            Resume Matcher
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-gray-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Instantly match your resume to the best jobs. Visualize your skills, track your progress, 
          and land your dream role with ResuMatch.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-6 animate-slide-in-bottom" style={{ animationDelay: '0.6s' }}>
          <Link 
            href="/upload" 
            className="group px-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-lift flex items-center gap-2"
          >
            Upload Resume
            <ArrowRightIcon className="h-5 w-5 transform transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="/dashboard" 
            className="px-8 py-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold shadow-lg transition-all hover-lift"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="mt-24 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          {
            title: 'Smart Matching',
            description: 'Advanced AI matches your resume to jobs with skill-based scoring and instant feedback.',
            color: 'blue',
            delay: '0.8s'
          },
          {
            title: 'Visual Analytics',
            description: 'Interactive charts and dashboards help you understand your strengths and opportunities.',
            color: 'purple',
            delay: '1s'
          },
          {
            title: 'Seamless Workflow',
            description: 'Upload, analyze, and track your resumes all in one beautiful, responsive platform.',
            color: 'pink',
            delay: '1.2s'
          }
        ].map((feature) => (
          <TiltCard key={feature.title}>
            <div 
              className="h-full group rounded-xl glass p-8 shadow-lg animate-fade-in"
              style={{ animationDelay: feature.delay }}
            >
              <div className={`text-${feature.color}-400 mb-4 text-2xl font-bold`}>{feature.title}</div>
              <p className="text-gray-300 group-hover:text-white transition-colors">{feature.description}</p>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-24 w-full bg-gray-900/50 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
          {[
            { number: 95, suffix: '%', label: 'Match Accuracy' },
            { number: 1000, prefix: '', suffix: '+', label: 'Jobs Matched' },
            { number: 24, label: 'AI Analysis' },
            { number: 100, suffix: '%', label: 'Satisfaction' }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${1.4 + index * 0.2}s` }}
            >
              <AnimatedCounter 
                end={stat.number} 
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-3xl font-bold text-white mb-2" 
              />
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
