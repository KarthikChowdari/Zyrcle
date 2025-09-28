'use client'

import * as React from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { createSupabaseClientComponent } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BasicUserMenu() {
  const { user, loading } = useAuth()
  const supabase = createSupabaseClientComponent()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = React.useState(false)

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Logout button clicked')
    
    try {
      await supabase.auth.signOut()
      console.log('Logged out successfully')
      router.push('/login')
      window.location.href = '/login' // Force navigation
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost" className="text-white hover:bg-white/10">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild className="bg-white text-black hover:bg-gray-100">
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
    <div className="flex items-center space-x-3">
      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
        <AvatarFallback className="bg-white/20 text-white text-sm">
          {userInitials}
        </AvatarFallback>
      </Avatar>

      {/* Direct Logout Button - No Dropdown */}
      <button
        onClick={handleLogout}
        className="flex items-center px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        style={{ zIndex: 9999 }}
      >
        <LogOut className="w-4 h-4 mr-1" />
        Logout
      </button>
    </div>
  )
}