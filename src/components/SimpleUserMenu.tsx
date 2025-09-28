'use client'

import * as React from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { createSupabaseClientComponent } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SimpleUserMenu() {
  const { user, loading } = useAuth()
  const supabase = createSupabaseClientComponent()
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    )
  }

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="relative h-10 w-10 rounded-full hover:bg-white/10 focus:ring-2 focus:ring-white/20"
        onClick={() => {
          console.log('Simple dropdown clicked, current state:', isOpen)
          setIsOpen(!isOpen)
        }}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
          <AvatarFallback className="bg-white/20 text-white text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="w-3 h-3 ml-1 text-white opacity-60" />
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[9999]"
          style={{ 
            position: 'fixed',
            right: '24px',
            top: '70px'
          }}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <User className="mr-3 h-4 w-4" />
              Profile
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button 
              onClick={() => {
                console.log('Logout clicked')
                handleLogout()
                setIsOpen(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}