'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CalendarRange,
  BarChart3,
} from 'lucide-react'

const allNavItems = [
  { href: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { href: '/orders',     label: 'Pesanan',   icon: ShoppingBag,     permission: 'canManageOrders' },
  { href: '/products',   label: 'Produk',    icon: Package,         permission: 'canManageProducts' },
  { href: '/sessions',   label: 'Sesi PO',   icon: CalendarRange,   permission: 'canManageSessions' },
  { href: '/reports',    label: 'Laporan',   icon: BarChart3,        permission: 'canViewReports' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { hasPermission } = useAuth()

  const visibleItems = allNavItems.filter(item =>
    !item.permission || hasPermission(item.permission as Parameters<typeof hasPermission>[0])
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors relative',
                isActive ? 'text-orange-600' : 'text-gray-400'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
