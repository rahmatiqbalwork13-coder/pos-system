'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  order: OrderWithItems
  paymentMethods: string[]
  onUpdated: (order: OrderWithItems) => void
  onClose: () => void
}

export default function PaymentModal({ order, paymentMethods, onUpdated, onClose }: Props) {
  const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
  const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
  const totalTagihan = subtotal + ongkir

  const [status, setStatus] = useState<Order['payment_status']>(order.payment_status)
  const [amountPaid, setAmountPaid] = useState(order.amount_paid.toString())
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method ?? '')
  const [loading, setLoading] = useState(false)

  const remaining = totalTagihan - (parseFloat(amountPaid) || 0)

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .update({
        payment_status: status,
        amount_paid: parseFloat(amountPaid) || 0,
        payment_method: paymentMethod || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single()
    if (data) onUpdated(data as OrderWithItems)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Manajemen Pembayaran</h2>
            <p className="text-sm text-gray-500">{order.customer_name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Produk</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {ongkir > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Ongkir</span>
                  <span>{formatCurrency(ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total Tagihan</span>
                <span>{formatCurrency(totalTagihan)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Pembayaran</label>
            <div className="flex gap-2">
              {[['unpaid', 'Belum Bayar'], ['dp', 'DP / Cicil'], ['paid', 'Lunas']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    setStatus(val as Order['payment_status'])
                    if (val === 'paid') setAmountPaid(totalTagihan.toString())
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    status === val
                      ? val === 'unpaid' ? 'bg-red-500 text-white'
                        : val === 'dp' ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          {status !== 'unpaid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Dibayar (Rp)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                min="0"
              />
              {parseFloat(amountPaid) > 0 && (
                <p className={`text-xs mt-1 ${remaining > 0 ? 'text-yellow-600' : remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remaining > 0 ? `Sisa: ${formatCurrency(remaining)}` :
                   remaining < 0 ? `Lebih bayar: ${formatCurrency(Math.abs(remaining))}` :
                   'Lunas penuh ✓'}
                </p>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">Pilih metode...</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
              Batal
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
