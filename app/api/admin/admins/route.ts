import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminSession, canManageAdmins, logAdminAction } from '@/lib/auth/admin'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    
    if (!admin || !canManageAdmins(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role') || ''
    
    // Build query - exclude password hash
    let query = supabase
      .from('admins')
      .select('id, email, role, state, first_name, last_name, is_active, created_at, updated_at, last_login', { count: 'exact' })

    // Regular admin cannot view super admins
    if (admin.role === 'admin') {
      query = query.neq('role', 'super_admin')
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      admins: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    
    if (!admin || !canManageAdmins(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, password, role, state, first_name, last_name } = await request.json()

    // Validate input
    if (!email || !password || !role || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Regular admin cannot create super admin
    if (admin.role === 'admin' && role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot create super admin' },
        { status: 403 }
      )
    }

    // State admin role requires state
    if (role === 'state_admin' && !state) {
      return NextResponse.json(
        { error: 'State is required for state admin role' },
        { status: 400 }
      )
    }

    // Validate password
    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('admins')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        state: role === 'state_admin' ? state : null,
        first_name,
        last_name,
        is_active: true
      })
      .select('id, email, role, state, first_name, last_name, is_active, created_at')
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json(
        { error: 'Failed to create admin' },
        { status: 500 }
      )
    }

    // Log admin creation
    await logAdminAction(
      admin.id,
      'create_admin',
      'admin',
      newAdmin.id,
      { email: newAdmin.email, role: newAdmin.role },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({
      success: true,
      admin: newAdmin
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
