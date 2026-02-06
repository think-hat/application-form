import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminSession, canViewAllApplications, logAdminAction } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminSession()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const supabase = createServiceRoleClient()

    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if state admin can access this application
    if (admin.role === 'state_admin') {
      if (admin.state !== application.state_of_residence) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminSession()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only super admin and admin can delete applications
    if (!canViewAllApplications(admin)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const supabase = createServiceRoleClient()

    // Get application before deleting for logging
    const { data: application } = await supabase
      .from('applications')
      .select('email, surname, first_name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting application:', error)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    // Log deletion
    await logAdminAction(
      admin.id,
      'delete_application',
      'application',
      id,
      { application },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
