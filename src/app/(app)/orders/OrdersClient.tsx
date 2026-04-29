'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem, PoSession, Product } from '@/lib/supabase/database.types'
import {
  formatCurrency, maskPhone, sourceLabel, deliveryLabel,
} from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, Receipt } from 'lucide-react'
import OrderForm from './OrderForm'
import PaymentModal from './PaymentModal'
import ReceiptModal from './ReceiptModal'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  initialOrders: OrderWithItems[]
  sessions: PoSession[]
  products: Product[]
  defaultSessionId?: string
  paymentMethods: string[]
  businessName: string
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700',
  dp: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
}

export default function OrdersClient({ initialOrders, sessions, products, defaultSessionId, paymentMethods, businessName }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState<OrderWithItems | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<OrderWithItems | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<OrderWithItems | null>(null)
  const [search, setSearch] = useState('')
  const [filterSession, setFilterSession] = useState(defaultSessionId ?? 'all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDelivery] = useState('all')
  const supabase = createClient()

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterSession !== 'all' && o.session_id !== filterSession) return false
      if (filterStatus !== 'all' && o.payment_status !== filterStatus) return false
      if (filterDelivery !== 'all' && o.delivery_type !== filterDelivery) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = o.customer_name.toLowerCase().includes(q)
        const phoneMatch = o.customer_phone.includes(q)
        const itemMatch = o.order_items.some(i => i.product_name.toLowerCase().includes(q))
        if (!nameMatch && !phoneMatch && !itemMatch) return false
      }
      return true
    })
  }, [orders, filterSession, filterStatus, filterDelivery, search])

  function calcOrderTotal(order: OrderWithItems) {
    const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
    const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
    return subtotal + ongkir
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pesanan ini?')) return
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  async function handleQuickStatusChange(order: OrderWithItems, status: Order['payment_status']) {
    const { data } = await supabase
      .from('orders')
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single()
    if (data) setOrders(prev => prev.map(o => o.id === data.id ? data as OrderWithItems : o))
  }

  function handleSaved(order: OrderWithItems) {
    setOrders(prev => {
      const exists = prev.find(o => o.id === order.id)
      return exists ? prev.map(o => o.id === order.id ? order : o) : [order, ...prev]
    })
    setShowForm(false)
    setEditOrder(null)
  }

  function handlePaymentUpdated(order: OrderWithItems) {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o))
    setPaymentOrder(null)
  }

  const activeSession = sessions.find(s => s.status === 'active')

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-sm text-gray-500">{filtered.length} dari {orders.length} pesanan</p>
        </div>
        <button
          onClick={() => { setEditOrder(null); setShowForm(true) }}
          className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Pesanan
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Cari nama, HP, atau produk..."
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {/* Session filter */}
          <select
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
            className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="all">Semua Sesi</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Payment status */}
          {[['all', 'Status Bayar'], ['unpaid', 'Belum Bayar'], ['dp', 'DP'], ['paid', 'Lunas']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === val ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pengiriman</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status Bayar</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada pesanan</td></tr>
            )}
            {filtered.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{maskPhone(order.customer_phone)}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{sourceLabel(order.source)}</td>
                <td className="px-4 py-3">
                  {order.order_items.map(item => (
                    <p key={item.id} className="text-xs text-gray-600">{item.product_name} ×{item.quantity}</p>
                  ))}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <p>{deliveryLabel(order.delivery_type)}</p>
                  {order.delivery_cost > 0 && (
                    <p className={order.delivery_paid_by === 'seller' ? 'text-red-500' : 'text-gray-400'}>
                      {formatCurrency(order.delivery_cost)} ({order.delivery_paid_by === 'seller' ? 'penjual' : 'customer'})
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(calcOrderTotal(order))}</td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={order.payment_status}
                    onChange={e => handleQuickStatusChange(order, e.target.value as Order['payment_status'])}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                  >
                    <option value="unpaid">Belum Bayar</option>
                    <option value="dp">DP</option>
                    <option value="paid">Lunas</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Struk"
                    >
                      <Receipt size={14} />
                    </button>
                    <button
                      onClick={() => setPaymentOrder(order)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg text-xs"
                      title="Pembayaran"
                    >💳</button>
                    <button
                      onClick={() => { setEditOrder(order); setShowForm(true) }}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Tidak ada pesanan</div>
        )}
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{maskPhone(order.customer_phone)} · {sourceLabel(order.source)}</p>
              </div>
              <select
                value={order.payment_status}
                onChange={e => handleQuickStatusChange(order, e.target.value as Order['payment_status'])}
                className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
              >
                <option value="unpaid">Belum Bayar</option>
                <option value="dp">DP</option>
                <option value="paid">Lunas</option>
              </select>
            </div>

            <div className="text-xs text-gray-600 mb-2">
              {order.order_items.map(item => (
                <span key={item.id} className="inline-block bg-gray-100 rounded-lg px-2 py-0.5 mr-1 mb-1">
                  {item.product_name} ×{item.quantity}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {deliveryLabel(order.delivery_type)}
                {order.delivery_cost > 0 && ` · ${formatCurrency(order.delivery_cost)}`}
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(calcOrderTotal(order))}</p>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button
                onClick={() => setReceiptOrder(order)}
                className="py-2 px-3 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
              >
                Struk
              </button>
              <button
                onClick={() => setPaymentOrder(order)}
                className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
              >
                Bayar
              </button>
              <button
                onClick={() => { setEditOrder(order); setShowForm(true) }}
                className="flex-1 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(order.id)}
                className="py-2 px-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB Mobile */}
      <button
        onClick={() => { setEditOrder(null); setShowForm(true) }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <OrderForm
          order={editOrder}
          sessions={sessions}
          products={products}
          defaultSessionId={filterSession !== 'all' ? filterSession : activeSession?.id}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditOrder(null) }}
        />
      )}

      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          paymentMethods={paymentMethods}
          onUpdated={handlePaymentUpdated}
          onClose={() => setPaymentOrder(null)}
        />
      )}

      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          businessName={businessName}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  )
}
