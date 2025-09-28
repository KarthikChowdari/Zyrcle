'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseClientComponent } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export default function LogoutButton({ className, variant = 'outline' }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createSupabaseClientComponent()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  )
}