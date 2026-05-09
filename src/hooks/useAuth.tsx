'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleType } from '@/lib/supabase/database.types'

interface AuthContextType {
  user: any
  role: UserRoleType | null
  loading: boolean
  permissions: {
    canViewReports: boolean
    canViewProfit: boolean
    canManageProducts: boolean
    canManageSessions: boolean
    canManageOrders: boolean
    canManageUsers: boolean
    canExportData: boolean
    canDeleteOrders: boolean
  }
  hasPermission: (permission: keyof AuthContextType['permissions']) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<UserRoleType | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle instead of single to avoid error when no row
          
          if (error) {
            console.error('Error fetching role:', error)
            // Default to 'kasir' if error
            setRole('kasir')
          } else if (roleData) {
            setRole(roleData.role as UserRoleType)
          } else {
            // No role assigned, default to 'kasir'
            setRole('kasir')
          }
        }
      } catch (err) {
        console.error('Auth error:', err)
        setRole('kasir')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const { data: roleData, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            if (error) {
              console.error('Error fetching role:', error)
              setRole('kasir')
            } else if (roleData) {
              setRole(roleData.role as UserRoleType)
            } else {
              setRole('kasir')
            }
          } catch (err) {
            console.error('Auth error:', err)
            setRole('kasir')
          }
        } else {
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const permissions = {
    canViewReports: role === 'owner' || role === 'admin',
    canViewProfit: role === 'owner',
    canManageProducts: role === 'owner' || role === 'admin',
    canManageSessions: role === 'owner' || role === 'admin',
    canManageOrders: true, // All roles can manage orders
    canManageUsers: role === 'owner',
    canExportData: role === 'owner' || role === 'admin',
    canDeleteOrders: role === 'owner' || role === 'admin',
  }

  const hasPermission = (permission: keyof typeof permissions) => {
    return permissions[permission]
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, permissions, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function usePermission(permission: keyof AuthContextType['permissions']) {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}
