"use client";

import Link from 'next/link'
import { UserCircleIcon, Cog6ToothIcon, HomeIcon, DocumentTextIcon, ChartBarIcon, Squares2X2Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/auth/AuthContext'
import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'

const navLinks = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Upload', href: '/upload', icon: DocumentTextIcon },
  { name: 'Resumes', href: '/resumes', icon: DocumentTextIcon },
  { name: 'Analysis', href: '/analysis', icon: ChartBarIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
]

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Successfully logged out')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
      setIsDropdownOpen(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-900/60 backdrop-blur-md border-b border-gray-800 shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">ResuMatch</span>
        </Link>
        <div className="flex gap-2 md:gap-4 items-center">
          {navLinks.map(link => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-blue-500/20 transition-colors font-medium"
            >
              <link.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{link.name}</span>
            </Link>
          ))}
          {/* User Info / Auth Buttons */}
          {isAuthenticated && user ? (
            <div className="relative ml-4">
              <button 
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-blue-500/20 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400" 
                aria-haspopup="true" 
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.profile_img ? (
                  <Image src={user.profile_img} alt={user.name || user.email} width={32} height={32} className="rounded-full border-2 border-blue-400" />
                ) : (
                  <UserCircleIcon className="h-7 w-7 text-blue-400" />
                )}
                <span className="hidden sm:inline text-white font-medium">{user.name || user.email}</span>
                <svg className={`h-4 w-4 ml-1 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-lg z-50 py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-white font-medium truncate">{user.email}</p>
                  </div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-gray-300 hover:bg-blue-500/20 hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-gray-300 hover:bg-blue-500/20 hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t border-gray-800 my-2" />
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-red-500/20 hover:text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" /> 
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-4 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-lift"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </nav>
  )
} 