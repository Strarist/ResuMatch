'use client'
import { useState } from 'react'
import { Cog6ToothIcon, BellIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)

  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 animate-slide-in-bottom flex items-center gap-2">
        <Cog6ToothIcon className="h-7 w-7 text-blue-400" /> Settings
      </h1>
      <div className="max-w-xl space-y-8">
        <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          <span className="flex items-center gap-2 text-white font-medium">
            <MoonIcon className="h-5 w-5 text-blue-400" /> Dark Mode
          </span>
          <button
            className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${darkMode ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${darkMode ? 'translate-x-6' : ''}`}></span>
          </button>
        </div>
        <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
          <span className="flex items-center gap-2 text-white font-medium">
            <BellIcon className="h-5 w-5 text-purple-400" /> Email Notifications
          </span>
          <button
            className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${notifications ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
            onClick={() => setNotifications(!notifications)}
          >
            <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${notifications ? 'translate-x-6' : ''}`}></span>
          </button>
        </div>
      </div>
    </main>
  )
} 