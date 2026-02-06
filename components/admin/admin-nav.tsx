'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  User
} from 'lucide-react'
import { Admin } from '@/lib/auth/admin'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  admin: Admin
}

export default function AdminNav({ admin }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const canManageAdmins = admin.role === 'super_admin' || admin.role === 'admin'

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      href: '/admin/applications',
      label: 'Applications',
      icon: FileText,
      show: true
    },
    {
      href: '/admin/admins',
      label: 'Admins',
      icon: Users,
      show: canManageAdmins
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      show: true
    }
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const NavLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => (
    <>
      {navItems.filter(item => item.show).map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
              mobile && 'text-base'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col gap-4 py-4">
                <div className="px-3 py-2">
                  <SheetTitle className="mb-2">Admin Panel</SheetTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {admin.first_name} {admin.last_name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {admin.role.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <nav className="flex flex-col gap-1">
                  <NavLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
          </nav>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {admin.first_name} {admin.last_name}
                </p>
                <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                  {admin.email}
                </p>
                <p className="text-xs leading-none text-slate-400 dark:text-slate-500">
                  {admin.role.replace('_', ' ').toUpperCase()}
                  {admin.state && ` - ${admin.state}`}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
