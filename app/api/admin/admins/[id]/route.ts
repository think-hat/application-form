import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminSession, canManageAdmins, logAdminAction } from '@/lib/auth/admin'
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
    
    if (!admin || !canManageAdmins(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()

    const { data: targetAdmin, error } = await supabase
      .from('admins')
      .select('id, email, role, state, first_name, last_name, is_active, created_at, updated_at, last_login')
      .eq('id', id)
      .single()

    if (error || !targetAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Regular admin cannot view super admin
    if (admin.role === 'admin' && targetAdmin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ admin: targetAdmin })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminSession()
    
    if (!admin || !canManageAdmins(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const updates = await request.json()
    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()

    // Get target admin
    const { data: targetAdmin, error: fetchError } = await supabase
      .from('admins')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !targetAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Regular admin cannot modify super admin
    if (admin.role === 'admin' && targetAdmin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify super admin' },
        { status: 403 }
      )
    }

    // Regular admin cannot promote to super admin
    if (admin.role === 'admin' && updates.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot create super admin' },
        { status: 403 }
      )
    }

    // Don't allow password_hash updates through this endpoint
    delete updates.password_hash

    // State admin role requires state
    if (updates.role === 'state_admin' && !updates.state) {
      return NextResponse.json(
        { error: 'State is required for state admin role' },
        { status: 400 }
      )
    }

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, state, first_name, last_name, is_active, created_at, updated_at')
      .single()

    if (error) {
      console.error('Error updating admin:', error)
      return NextResponse.json(
        { error: 'Failed to update admin' },
        { status: 500 }
      )
    }

    // Log admin update
    await logAdminAction(
      admin.id,
      'update_admin',
      'admin',
      id,
      { updates },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({
      success: true,
      admin: updatedAdmin
    })
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
    
    if (!admin || !canManageAdmins(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Cannot delete self
    if (admin.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()

    // Get target admin
    const { data: targetAdmin, error: fetchError } = await supabase
      .from('admins')
      .select('role, email')
      .eq('id', id)
      .single()

    if (fetchError || !targetAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Regular admin cannot delete super admin
    if (admin.role === 'admin' && targetAdmin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting admin:', error)
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      )
    }

    // Log admin deletion
    await logAdminAction(
      admin.id,
      'delete_admin',
      'admin',
      id,
      { email: targetAdmin.email, role: targetAdmin.role },
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
