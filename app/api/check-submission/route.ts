import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email provided' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const supabase = await createClient()

    // Check if submission exists in Supabase
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    console.log('data', data)
    console.log('error', error)
    // If there's an error and it's not "no rows found", it's a real error
    const exists = !error || error.code !== 'PGRST116'

    return NextResponse.json(
      {
        exists,
        message: exists
          ? 'An application already exists for this email'
          : 'No existing application found',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error checking submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
