import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SessionReportClient from './SessionReportClient'

export default async function SessionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [{ data: session }, { data: orders }] = await Promise.all([
    supabase.from('po_sessions').select('*').eq('id', id).single(),
    supabase.from('orders').select('*, order_items(*)').eq('session_id', id).order('created_at'),
  ])

  if (!session) notFound()

  return <SessionReportClient session={session} orders={orders ?? []} />
}
