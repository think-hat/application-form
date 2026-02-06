import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type AdminRole = 'super_admin' | 'admin' | 'state_admin'

export interface Admin {
  id: string
  email: string
  role: AdminRole
  state?: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

/**
 * Get the currently logged in admin from session
 */
export async function getAdminSession(): Promise<Admin | null> {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    
    if (!adminSession) {
      return null
    }
    
    const adminData = JSON.parse(adminSession.value)
    
    // Verify the session is still valid in database
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', adminData.id)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data as Admin
  } catch (error) {
    console.error('Error getting admin session:', error)
    return null
  }
}

/**
 * Check if the current admin has the required role
 */
export async function requireAdminRole(allowedRoles: AdminRole[]): Promise<Admin | null> {
  const admin = await getAdminSession()
  
  if (!admin || !allowedRoles.includes(admin.role)) {
    return null
  }
  
  return admin
}

/**
 * Check if admin can manage other admins
 */
export function canManageAdmins(admin: Admin): boolean {
  return admin.role === 'super_admin' || admin.role === 'admin'
}

/**
 * Check if admin can view all applications
 */
export function canViewAllApplications(admin: Admin): boolean {
  return admin.role === 'super_admin' || admin.role === 'admin'
}

/**
 * Get applications filter based on admin role
 */
export function getApplicationsFilter(admin: Admin) {
  if (canViewAllApplications(admin)) {
    return {} // No filter, can view all
  }
  
  if (admin.role === 'state_admin' && admin.state) {
    return { state_of_residence: admin.state }
  }
  
  return null // Invalid state, no access
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
  ipAddress?: string
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress
    })
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}
