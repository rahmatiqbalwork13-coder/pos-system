import { createClient } from '@/lib/supabase/server'
import SettingsClient, { type PaymentMethodItem } from './SettingsClient'

const DEFAULT_METHODS = ['Cash', 'Transfer BCA', 'Transfer BRI', 'GoPay', 'OVO', 'DANA', 'ShopeePay']

function parsePaymentMethods(raw: string | undefined): PaymentMethodItem[] {
  if (!raw) return DEFAULT_METHODS.map(name => ({ name, info: '' }))
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    if (typeof parsed[0] === 'string') return parsed.map((name: string) => ({ name, info: '' }))
    return parsed as PaymentMethodItem[]
  } catch { return [] }
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('created_at'),
    supabase.from('settings').select('*'),
  ])

  const paymentMethods = parsePaymentMethods(settings?.find(s => s.key === 'payment_methods')?.value)
  const businessName = settings?.find(s => s.key === 'business_name')?.value ?? 'Open PO Management'
  const bankInfo = settings?.find(s => s.key === 'bank_info')?.value ?? ''
  const businessWa = settings?.find(s => s.key === 'business_wa')?.value ?? ''

  return (
    <SettingsClient
      initialCategories={categories ?? []}
      initialPaymentMethods={paymentMethods}
      initialBusinessName={businessName}
      initialBankInfo={bankInfo}
      initialBusinessWa={businessWa}
    />
  )
}
