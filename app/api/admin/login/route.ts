import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'
import { logAdminAction } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    // Use service role client to bypass RLS for admin authentication
    const supabase = createServiceRoleClient()

    console.log('🔍 Searching for admin with email:', normalizedEmail, 'and password:', password);
    // Get admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single()

      console.log('🔍 Admin found:', admin);
      console.log('🔍 Error:', error);
    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.password_hash)
    
    if (!isValidPassword) {
      await logAdminAction(
        admin.id,
        'failed_login_attempt',
        'admin',
        admin.id,
        { email: normalizedEmail },
        request.headers.get('x-forwarded-for') || undefined
      )
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // Create session
    const sessionData = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      state: admin.state,
      first_name: admin.first_name,
      last_name: admin.last_name
    }

    const cookieStore = await cookies()
    cookieStore.set('admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    // Log successful login
    await logAdminAction(
      admin.id,
      'login',
      'admin',
      admin.id,
      undefined,
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({
      success: true,
      admin: sessionData
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
