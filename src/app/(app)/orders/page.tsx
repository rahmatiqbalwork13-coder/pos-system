import { createClient } from '@/lib/supabase/server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const supabase = await createClient()
  const { session: sessionId } = await searchParams

  const [{ data: sessions }, { data: products }, { data: settings }] = await Promise.all([
    supabase.from('po_sessions').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('settings').select('*'),
  ])

  const paymentMethods: string[] = (() => {
    const s = settings?.find(x => x.key === 'payment_methods')
    return s ? JSON.parse(s.value) : ['Cash', 'Transfer BCA', 'Transfer BRI', 'GoPay', 'OVO', 'DANA', 'ShopeePay']
  })()
  const businessName = settings?.find(x => x.key === 'business_name')?.value ?? 'Open PO Management'
  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (sessionId) query = query.eq('session_id', sessionId)

  const { data: orders } = await query

  return (
    <OrdersClient
      initialOrders={orders ?? []}
      sessions={sessions ?? []}
      products={products ?? []}
      defaultSessionId={sessionId}
      paymentMethods={paymentMethods}
      businessName={businessName}
    />
  )
}
