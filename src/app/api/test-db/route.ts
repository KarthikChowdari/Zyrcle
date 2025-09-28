import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        user: null,
        authenticated: false
      }, { status: 401 })
    }

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count(*)')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        user: { id: user.id, email: user.email },
        authenticated: true,
        tableExists: false,
        error: testError.message,
        errorCode: testError.code
      })
    }

    // Try to insert a test project
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert([{
        name: 'Test Project',
        project_data: { test: true },
        user_id: user.id
      }])
      .select()

    if (insertError) {
      return NextResponse.json({
        user: { id: user.id, email: user.email },
        authenticated: true,
        tableExists: true,
        canRead: true,
        canInsert: false,
        insertError: insertError.message,
        insertErrorCode: insertError.code
      })
    }

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertData[0].id)
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      authenticated: true,
      tableExists: true,
      canRead: true,
      canInsert: true,
      message: 'All tests passed'
    })

  } catch (error) {
    console.error('Error in test API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}