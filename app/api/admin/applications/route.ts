import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminSession, getApplicationsFilter } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS since we're using cookie auth
    const supabase = createServiceRoleClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const state = searchParams.get('state') || ''
    
    // Get filter based on admin role
    const roleFilter = getApplicationsFilter(admin)
    
    if (roleFilter === null) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })

    // Apply role-based filter
    if (Object.keys(roleFilter).length > 0) {
      Object.entries(roleFilter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    // Apply additional filters
    if (state && admin.role !== 'state_admin') {
      query = query.eq('state_of_residence', state)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,surname.ilike.%${search}%,first_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      applications: data || [],
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
