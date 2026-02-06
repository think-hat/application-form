import { getAdminSession, logAdminAction } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    
    if (admin) {
      // Log logout
      await logAdminAction(
        admin.id,
        'logout',
        'admin',
        admin.id,
        undefined,
        request.headers.get('x-forwarded-for') || undefined
      )
    }

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
