'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuth, usePermission } from '@/hooks/useAuth'
import RoleBadge from '@/components/auth/RoleBadge'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CalendarRange,
  BarChart3,
  Settings,
  LogOut,
  Users,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { href: '/orders', label: 'Pesanan', icon: ShoppingBag, permission: 'canManageOrders' },
  { href: '/products', label: 'Produk', icon: Package, permission: 'canManageProducts' },
  { href: '/sessions', label: 'Sesi PO', icon: CalendarRange, permission: 'canManageSessions' },
  { href: '/reports', label: 'Laporan', icon: BarChart3, permission: 'canViewReports' },
  { href: '/settings', label: 'Pengaturan', icon: Settings, permission: null },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role } = useAuth()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredNavItems = navItems

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥙</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Open PO</p>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map(({ href, label, icon: Icon, permission }) => (
          <NavItem 
            key={href} 
            href={href} 
            label={label} 
            icon={Icon} 
            permission={permission}
            isActive={pathname.startsWith(href)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-3 px-3">
          <RoleBadge />
          {user?.email && (
            <span className="text-xs text-gray-500 truncate">
              {user.email.split('@')[0]}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  permission,
  isActive
}: {
  href: string
  label: string
  icon: React.ElementType
  permission: string | null
  isActive: boolean
}) {
  const { hasPermission } = useAuth()
  const hasAccess = !permission || hasPermission(permission as Parameters<typeof hasPermission>[0])

  if (!hasAccess) return null

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        isActive
          ? 'bg-orange-50 text-orange-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}
