import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem, PoSession, Product } from '@/lib/supabase/database.types'

const supabase = createClient()

// Query keys
export const queryKeys = {
  orders: 'orders',
  sessions: 'sessions',
  products: 'products',
  settings: 'settings',
  dashboard: 'dashboard',
}

// Orders hooks
export function useOrders(sessionId?: string) {
  return useQuery({
    queryKey: [queryKeys.orders, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
      
      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as (Order & { order_items: OrderItem[] })[]
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [queryKeys.orders, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Order & { order_items: OrderItem[] }
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select('*, order_items(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders] })
      queryClient.invalidateQueries({ queryKey: [queryKeys.dashboard] })
    },
  })
}

// Sessions hooks
export function useSessions() {
  return useQuery({
    queryKey: [queryKeys.sessions],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('po_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PoSession[]
    },
  })
}

export function useActiveSession() {
  return useQuery({
    queryKey: [queryKeys.sessions, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('po_sessions')
        .select('*')
        .eq('status', 'active')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data as PoSession | null
    },
  })
}

// Products hooks
export function useProducts() {
  return useQuery({
    queryKey: [queryKeys.products],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as Product[]
    },
  })
}

// Dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: [queryKeys.dashboard],
    queryFn: async () => {
      const [sessionsRes, ordersRes, productsRes] = await Promise.all([
        supabase.from('po_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('is_active', true),
      ])

      return {
        sessions: (sessionsRes.data ?? []) as PoSession[],
        orders: (ordersRes.data ?? []) as (Order & { order_items: OrderItem[] })[],
        products: (productsRes.data ?? []) as Product[],
      }
    },
  })
}
