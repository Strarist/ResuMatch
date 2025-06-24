'use client'

import Image from 'next/image'
import { UserCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/auth/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 animate-slide-in-bottom flex items-center gap-2">
        <UserCircleIcon className="h-7 w-7 text-blue-400" /> My Profile
      </h1>
      <div className="max-w-lg mx-auto bg-gray-900/60 p-8 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center gap-6 animate-scale-in">
        <div className="relative group">
          {user?.profile_img ? (
            <Image src={user.profile_img} alt={user.name || user.email} width={96} height={96} unoptimized className="rounded-full border-4 border-blue-500 shadow-lg group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-900 flex items-center justify-center border-4 border-blue-500 shadow-lg">
              <span className="text-3xl text-blue-300 font-bold">{user?.name?.[0] || user?.email?.[0]}</span>
            </div>
          )}
          <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100">
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">{user?.name}</div>
          <div className="text-gray-400">{user?.email}</div>
        </div>
        <button className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-scale active:scale-95 flex items-center gap-2">
          <PencilSquareIcon className="h-5 w-5" /> Edit Profile
        </button>
      </div>
    </main>
  )
} 