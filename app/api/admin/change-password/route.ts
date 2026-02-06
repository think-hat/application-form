import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminSession, logAdminAction } from '@/lib/auth/admin'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient()

    // Get current admin with password hash
    const { data: currentAdmin, error: fetchError } = await supabase
      .from('admins')
      .select('password_hash')
      .eq('id', admin.id)
      .single()

    if (fetchError || !currentAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, currentAdmin.password_hash)
    
    if (!isValidPassword) {
      await logAdminAction(
        admin.id,
        'failed_password_change',
        'admin',
        admin.id,
        { reason: 'invalid_current_password' },
        request.headers.get('x-forwarded-for') || undefined
      )
      
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: newPasswordHash })
      .eq('id', admin.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log successful password change
    await logAdminAction(
      admin.id,
      'password_changed',
      'admin',
      admin.id,
      undefined,
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
