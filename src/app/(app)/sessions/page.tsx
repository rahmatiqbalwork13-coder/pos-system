import { createClient } from '@/lib/supabase/server'
import SessionsClient from './SessionsClient'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('po_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return <SessionsClient initialSessions={sessions ?? []} />
}
