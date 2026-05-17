import { createClient } from '@/lib/supabase/server'
import OrdersClient from './OrdersClient'
import type { PaymentMethodItem } from '../settings/SettingsClient'

function parsePaymentMethods(raw: string | undefined): PaymentMethodItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    if (typeof parsed[0] === 'string') return parsed.map((name: string) => ({ name, info: '' }))
    return parsed as PaymentMethodItem[]
  } catch { return [] }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const supabase = await createClient()
  const { session: sessionId } = await searchParams

  const [{ data: sessions }, { data: products }, { data: settings }, { data: categories }] = await Promise.all([
    supabase.from('po_sessions').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('settings').select('*'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  const DEFAULT_METHODS: PaymentMethodItem[] = ['Cash', 'Transfer BCA', 'Transfer BRI', 'GoPay', 'OVO', 'DANA', 'ShopeePay'].map(n => ({ name: n, info: '' }))
  const paymentMethodItems = parsePaymentMethods(settings?.find(x => x.key === 'payment_methods')?.value)
  const paymentMethods = paymentMethodItems.length ? paymentMethodItems : DEFAULT_METHODS
  const businessName = settings?.find(x => x.key === 'business_name')?.value ?? 'Open PO Management'
  const bankInfo = paymentMethods.some(m => m.info.trim())
    ? paymentMethods.filter(m => m.info.trim()).map(m => `${m.name}: ${m.info}`).join('\n')
    : (settings?.find(x => x.key === 'bank_info')?.value ?? '')
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
      categories={categories ?? []}
      defaultSessionId={sessionId}
      paymentMethods={paymentMethods}
      businessName={businessName}
      bankInfo={bankInfo}
    />
  )
}
