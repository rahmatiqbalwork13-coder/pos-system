import { createClient } from '@/lib/supabase/server'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').order('created_at'),
  ])

  return <ProductsClient initialProducts={products ?? []} initialCategories={categories ?? []} />
}
