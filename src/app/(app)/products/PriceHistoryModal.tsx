'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PriceHistory } from '@/lib/supabase/database.types'
import { formatCurrency } from '@/lib/utils'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Props {
  productId: string
  productName: string
  onClose: () => void
}

export default function PriceHistoryModal({ productId, productName, onClose }: Props) {
  const [history, setHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('changed_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [productId])

  const filtered = history.filter(h => filter === 'all' || h.price_type === filter)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Riwayat Harga</h2>
            <p className="text-sm text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2">
          {[['all', 'Semua'], ['buy', 'Harga Beli'], ['sell', 'Harga Jual']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                filter === val ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading && <p className="text-center text-gray-400 py-4">Memuat...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-400 py-4">Belum ada riwayat perubahan harga</p>
          )}
          {filtered.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  h.delta > 0 ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {h.delta > 0
                    ? <TrendingUp size={14} className="text-red-600" />
                    : <TrendingDown size={14} className="text-green-600" />
                  }
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {h.price_type === 'buy' ? 'Harga Beli' : 'Harga Jual'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(h.changed_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 line-through">{formatCurrency(h.old_price)}</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(h.new_price)}</p>
                <p className={`text-xs font-medium ${h.delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {h.delta > 0 ? '+' : ''}{formatCurrency(h.delta)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
