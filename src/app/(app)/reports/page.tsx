import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { sessionStatusLabel } from '@/lib/utils'
import { ChevronRight, BarChart3 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-yellow-100 text-yellow-700',
  done: 'bg-blue-100 text-blue-700',
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('po_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
        <p className="text-sm text-gray-500">Pilih sesi untuk melihat laporan laba rugi</p>
      </div>

      <div className="space-y-3">
        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-12 text-gray-400">Belum ada sesi PO</div>
        )}
        {sessions?.map(session => (
          <Link
            key={session.id}
            href={`/reports/session/${session.id}`}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-900 truncate">{session.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[session.status]}`}>
                  {sessionStatusLabel(session.status)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {format(new Date(session.open_date), 'dd MMM', { locale: id })} –{' '}
                {format(new Date(session.close_date), 'dd MMM yyyy', { locale: id })}
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
