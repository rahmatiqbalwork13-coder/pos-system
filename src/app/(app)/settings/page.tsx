import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('created_at'),
    supabase.from('settings').select('*'),
  ])

  const paymentMethodsSetting = settings?.find(s => s.key === 'payment_methods')
  const paymentMethods: string[] = paymentMethodsSetting
    ? JSON.parse(paymentMethodsSetting.value)
    : ['Cash', 'Transfer BCA', 'Transfer BRI', 'GoPay', 'OVO', 'DANA', 'ShopeePay']

  return (
    <SettingsClient
      initialCategories={categories ?? []}
      initialPaymentMethods={paymentMethods}
    />
  )
}
