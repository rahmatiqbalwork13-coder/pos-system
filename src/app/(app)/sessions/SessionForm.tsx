'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PoSession } from '@/lib/supabase/database.types'
import { X } from 'lucide-react'

interface Props {
  session: PoSession | null
  onSaved: (session: PoSession) => void
  onClose: () => void
}

export default function SessionForm({ session, onSaved, onClose }: Props) {
  const [name, setName] = useState(session?.name ?? '')
  const [openDate, setOpenDate] = useState(session?.open_date ?? new Date().toISOString().split('T')[0])
  const [closeDate, setCloseDate] = useState(session?.close_date ?? '')
  const [pickupDate, setPickupDate] = useState(session?.pickup_date ?? '')
  const [maxCapacity, setMaxCapacity] = useState(session?.max_capacity?.toString() ?? '')
  const [notes, setNotes] = useState(session?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Nama sesi wajib diisi')
    if (!closeDate) return setError('Tanggal tutup wajib diisi')
    setLoading(true)
    setError('')
    const supabase = createClient()
    const payload = {
      name,
      open_date: openDate,
      close_date: closeDate,
      pickup_date: pickupDate || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      notes: notes || null,
    }
    if (session) {
      const { data, error: err } = await supabase
        .from('po_sessions')
        .update(payload)
        .eq('id', session.id)
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error: err } = await supabase
        .from('po_sessions')
        .insert({ ...payload, status: 'draft' })
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      onSaved(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{session ? 'Edit Sesi PO' : 'Buat Sesi PO Baru'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Sesi *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contoh: PO Minggu 5 Mei"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Buka *</label>
              <input
                type="date"
                value={openDate}
                onChange={e => setOpenDate(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Tutup *</label>
              <input
                type="date"
                value={closeDate}
                onChange={e => setCloseDate(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pickup</label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Maks. Kapasitas</label>
              <input
                type="number"
                value={maxCapacity}
                onChange={e => setMaxCapacity(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Opsional"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Catatan khusus sesi ini..."
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
