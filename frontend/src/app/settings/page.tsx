'use client'
import { useState } from 'react'
import { Cog6ToothIcon, BellIcon, MoonIcon, UserCircleIcon, PaintBrushIcon, EnvelopeIcon, ExclamationTriangleIcon, LockClosedIcon, LinkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/auth/ThemeContext'
import { useAuth } from '@/auth/AuthContext'

const TABS = [
  { key: 'general', label: 'General', icon: Cog6ToothIcon },
  { key: 'account', label: 'Account', icon: UserCircleIcon },
  { key: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    product: false,
    security: true,
  })
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [linked, setLinked] = useState({ google: user?.provider === 'google', linkedin: user?.provider === 'linkedin' })

  // Dummy password reset handler
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) {
      setPwMessage('Passwords do not match')
      return
    }
    setPwMessage('Password changed! (demo only)')
    setPasswords({ current: '', next: '', confirm: '' })
  }

  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 animate-slide-in-bottom flex items-center gap-2">
        <Cog6ToothIcon className="h-7 w-7 text-blue-400" /> Settings
      </h1>
      <div className="max-w-xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'general' && (
            <>
              <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-left">
                <span className="flex items-center gap-2 text-white font-medium">
                  <BellIcon className="h-5 w-5 text-purple-400" /> Email Notifications
                </span>
                <button
                  className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${notifications.email ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
                  onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
                >
                  <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${notifications.email ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-left">
                <span className="flex items-center gap-2 text-white font-medium">
                  <EnvelopeIcon className="h-5 w-5 text-blue-400" /> Product Updates
                </span>
                <button
                  className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${notifications.product ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
                  onClick={() => setNotifications(n => ({ ...n, product: !n.product }))}
                >
                  <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${notifications.product ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-left">
                <span className="flex items-center gap-2 text-white font-medium">
                  <ExclamationTriangleIcon className="h-5 w-5 text-pink-400" /> Security Alerts
                </span>
                <button
                  className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${notifications.security ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
                  onClick={() => setNotifications(n => ({ ...n, security: !n.security }))}
                >
                  <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${notifications.security ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
            </>
          )}
          {activeTab === 'account' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Password Reset (only for email/password users) */}
              {user?.provider === 'email' && (
                <form onSubmit={handlePasswordChange} className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col gap-4">
                  <span className="text-white font-medium flex items-center gap-2"><LockClosedIcon className="h-5 w-5 text-blue-400" /> Change Password</span>
                  <input type="password" placeholder="Current Password" className="input input-bordered bg-gray-800 text-white" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required />
                  <input type="password" placeholder="New Password" className="input input-bordered bg-gray-800 text-white" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} required />
                  <input type="password" placeholder="Confirm New Password" className="input input-bordered bg-gray-800 text-white" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
                  <button type="submit" className="btn bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg mt-2">Change Password</button>
                  {pwMessage && <div className="text-sm text-pink-400 mt-2">{pwMessage}</div>}
                </form>
              )}
              {/* Linked Accounts */}
              <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col gap-4">
                <span className="text-white font-medium flex items-center gap-2"><LinkIcon className="h-5 w-5 text-purple-400" /> Linked Accounts</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-200">Google</span>
                    {linked.google ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <XCircleIcon className="h-5 w-5 text-gray-500" />}
                    <button className="ml-2 btn btn-xs bg-blue-500 hover:bg-blue-600 text-white rounded" onClick={() => setLinked(l => ({ ...l, google: !l.google }))}>
                      {linked.google ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-200">LinkedIn</span>
                    {linked.linkedin ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <XCircleIcon className="h-5 w-5 text-gray-500" />}
                    <button className="ml-2 btn btn-xs bg-blue-500 hover:bg-blue-600 text-white rounded" onClick={() => setLinked(l => ({ ...l, linkedin: !l.linkedin }))}>
                      {linked.linkedin ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'appearance' && (
            <div className="flex items-center justify-between bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg hover-lift hover:shadow-xl transition-all animate-slide-in-right">
              <span className="flex items-center gap-2 text-white font-medium">
                <MoonIcon className="h-5 w-5 text-blue-400" /> Dark Mode
              </span>
              <button
                className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-700'} hover:scale-105`}
                onClick={toggleTheme}
              >
                <span className={`h-6 w-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 