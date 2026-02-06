import { getAdminSession } from '@/lib/auth/admin'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/admin-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminSession()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav admin={admin} />
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
}
