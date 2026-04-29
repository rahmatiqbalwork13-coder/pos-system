'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PoSession } from '@/lib/supabase/database.types'
import { sessionStatusLabel } from '@/lib/utils'
import { Plus, Edit2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import SessionForm from './SessionForm'

interface Props { initialSessions: PoSession[] }

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-yellow-100 text-yellow-700',
  done: 'bg-blue-100 text-blue-700',
}

export default function SessionsClient({ initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [showForm, setShowForm] = useState(false)
  const [editSession, setEditSession] = useState<PoSession | null>(null)
  const supabase = createClient()

  const activeSession = sessions.find(s => s.status === 'active')

  async function handleStatusChange(session: PoSession, newStatus: PoSession['status']) {
    if (newStatus === 'active' && activeSession && activeSession.id !== session.id) {
      alert('Sudah ada sesi yang aktif. Tutup sesi aktif terlebih dahulu.')
      return
    }
    const { data } = await supabase
      .from('po_sessions')
      .update({ status: newStatus })
      .eq('id', session.id)
      .select()
      .single()
    if (data) setSessions(prev => prev.map(s => s.id === data.id ? data : s))
  }

  function handleSaved(session: PoSession) {
    setSessions(prev => {
      const exists = prev.find(s => s.id === session.id)
      return exists ? prev.map(s => s.id === session.id ? session : s) : [session, ...prev]
    })
    setShowForm(false)
    setEditSession(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sesi PO</h1>
          <p className="text-sm text-gray-500">{sessions.length} sesi tercatat</p>
        </div>
        <button
          onClick={() => { setEditSession(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Buat Sesi</span>
          <span className="sm:hidden">Buat</span>
        </button>
      </div>

      {activeSession && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 mb-0.5">SESI AKTIF</p>
              <p className="font-semibold text-green-900">{activeSession.name}</p>
              <p className="text-xs text-green-700 mt-0.5">
                Tutup: {format(new Date(activeSession.close_date), 'dd MMM yyyy', { locale: id })}
              </p>
            </div>
            <Link
              href={`/orders?session=${activeSession.id}`}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
            >
              Lihat Pesanan <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-400">Belum ada sesi PO</div>
        )}
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{session.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[session.status]}`}>
                    {sessionStatusLabel(session.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Buka: {format(new Date(session.open_date), 'dd MMM', { locale: id })} →
                  Tutup: {format(new Date(session.close_date), 'dd MMM yyyy', { locale: id })}
                  {session.pickup_date && ` · Pickup: ${format(new Date(session.pickup_date), 'dd MMM', { locale: id })}`}
                </p>
                {session.max_capacity && (
                  <p className="text-xs text-gray-400 mt-0.5">Kapasitas: {session.max_capacity} pesanan</p>
                )}
              </div>
              <button
                onClick={() => { setEditSession(session); setShowForm(true) }}
                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
              >
                <Edit2 size={15} />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {session.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange(session, 'active')}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium"
                >
                  Aktifkan
                </button>
              )}
              {session.status === 'active' && (
                <>
                  <Link
                    href={`/orders?session=${session.id}`}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium"
                  >
                    Lihat Pesanan
                  </Link>
                  <button
                    onClick={() => handleStatusChange(session, 'closed')}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium"
                  >
                    Tutup PO
                  </button>
                </>
              )}
              {session.status === 'closed' && (
                <>
                  <Link
                    href={`/orders?session=${session.id}`}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium"
                  >
                    Lihat Pesanan
                  </Link>
                  <button
                    onClick={() => handleStatusChange(session, 'done')}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium"
                  >
                    Tandai Selesai
                  </button>
                  <Link
                    href={`/reports/session/${session.id}`}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                  >
                    Lihat Laporan
                  </Link>
                </>
              )}
              {session.status === 'done' && (
                <Link
                  href={`/reports/session/${session.id}`}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                >
                  Lihat Laporan
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setEditSession(null); setShowForm(true) }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <SessionForm
          session={editSession}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditSession(null) }}
        />
      )}
    </div>
  )
}
