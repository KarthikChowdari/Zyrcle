import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get the pathname
  const pathname = req.nextUrl.pathname
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/auth/confirm',
    '/forgot-password',
    '/reset-password'
  ]
  
  // Define API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth'
  ]
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       publicApiRoutes.some(route => pathname.startsWith(route))
  
  // If user is not signed in and the current route is private, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is signed in and trying to access auth routes, redirect to main app
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  return res
}

// Ensure the middleware is run for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}