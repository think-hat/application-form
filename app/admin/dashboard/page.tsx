import { getAdminSession, canViewAllApplications } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, UserCheck, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const admin = await getAdminSession()

  if (!admin) {
    redirect('/admin/login')
  }

  // Use service role client to bypass RLS since we're using cookie auth
  const supabase = createServiceRoleClient()
  
  // Get application count based on role
  let applicationsQuery = supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })

  if (admin.role === 'state_admin' && admin.state) {
    applicationsQuery = applicationsQuery.eq('state_of_residence', admin.state)
  }

  const { count: applicationsCount } = await applicationsQuery

  // Get admin count (only for super admin and admin)
  let adminsCount = 0
  if (admin.role === 'super_admin' || admin.role === 'admin') {
    const { count } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true })
    adminsCount = count || 0
  }

  // Get recent applications
  let recentQuery = supabase
    .from('applications')
    .select('id, email, surname, first_name, state_of_residence, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (admin.role === 'state_admin' && admin.state) {
    recentQuery = recentQuery.eq('state_of_residence', admin.state)
  }

  const { data: recentApplications } = await recentQuery

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, {admin.first_name}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsCount || 0}</div>
            <p className="text-xs text-slate-500">
              {admin.role === 'state_admin' ? `In ${admin.state}` : 'All states'}
            </p>
          </CardContent>
        </Card>

        {canViewAllApplications(admin) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Admins
              </CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminsCount}</div>
              <p className="text-xs text-slate-500">
                Active administrators
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Role
            </CardTitle>
            <UserCheck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {admin.role.replace('_', ' ')}
            </div>
            <p className="text-xs text-slate-500">
              {admin.state || 'All states'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-slate-500">
              System operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Latest submissions to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications && recentApplications.length > 0 ? (
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">
                      {app.surname} {app.first_name}
                    </p>
                    <p className="text-sm text-slate-500">{app.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{app.state_of_residence}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              No applications yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
