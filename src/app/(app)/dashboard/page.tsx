import { createClient } from '@/lib/supabase/server'
import type { PoSession, Order, OrderItem, Product } from '@/lib/supabase/database.types'
import DashboardClient from './DashboardClient'

type OrderWithItems = Order & { order_items: OrderItem[] }

export default async function DashboardPage() {
  const supabase = await createClient()

  const sessionsRes = await supabase
    .from('po_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  const ordersRes = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  const productsRes = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  const sessions = (sessionsRes.data ?? []) as PoSession[]
  const allOrders = (ordersRes.data ?? []) as OrderWithItems[]
  const products = (productsRes.data ?? []) as Product[]

  const activeSession = sessions.find(s => s.status === 'active') ?? null
  const activeOrders = activeSession
    ? allOrders.filter(o => o.session_id === activeSession.id)
    : []

  return (
    <DashboardClient
      activeSession={activeSession}
      activeOrders={activeOrders}
      allOrders={allOrders}
      products={products}
    />
  )
}
