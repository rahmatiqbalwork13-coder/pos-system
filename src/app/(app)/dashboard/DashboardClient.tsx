'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PoSession, Order, OrderItem, Product } from '@/lib/supabase/database.types'
import { formatCurrency, calcMargin } from '@/lib/utils'
import { ShoppingBag, Users, Wallet, TrendingUp, ChevronRight, AlertTriangle, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  activeSession: PoSession | null
  activeOrders: OrderWithItems[]
  allOrders: OrderWithItems[]
  products: Product[]
}

export default function DashboardClient({ activeSession, activeOrders, allOrders, products }: Props) {
  const [view, setView] = useState<'session' | 'all'>('session')

  const displayOrders = view === 'session' ? activeOrders : allOrders

  const totalOrders = displayOrders.length
  const paidOrders = displayOrders.filter(o => o.payment_status === 'paid')
  const unpaidOrders = displayOrders.filter(o => o.payment_status === 'unpaid')
  const dpOrders = displayOrders.filter(o => o.payment_status === 'dp')

  const calcOrderTotal = (order: OrderWithItems) => {
    const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
    const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
    return subtotal + ongkir
  }

  const totalRevenue = activeOrders.reduce((s, o) => s + calcOrderTotal(o), 0)
  const totalPaid = paidOrders.reduce((s, o) => s + calcOrderTotal(o), 0)
  const lowMarginProducts = products.filter(p => {
    const { marginPct } = calcMargin(p.current_buy_price, p.current_sell_price)
    return marginPct < 15
  })

  const statCards = [
    {
      label: 'Total Pesanan',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Sudah Bayar',
      value: paidOrders.length.toString(),
      icon: Wallet,
      color: 'bg-green-50 text-green-600',
      sub: `${formatCurrency(totalPaid)}`,
    },
    {
      label: 'Belum Bayar',
      value: unpaidOrders.length.toString(),
      icon: Users,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Total Omzet',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Selamat datang di Sistem Open PO</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setView('session')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'session' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sesi Ini
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Low Margin Warning */}
      {lowMarginProducts.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {lowMarginProducts.length} produk dengan margin rendah (&lt;15%)
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {lowMarginProducts.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Banner */}
      {activeSession ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-orange-200 mb-1">SESI AKTIF</p>
              <p className="font-bold text-lg">{activeSession.name}</p>
              <p className="text-xs text-orange-200 mt-1">
                Tutup: {format(new Date(activeSession.close_date), 'dd MMMM yyyy', { locale: id })}
                {activeSession.pickup_date && ` · Pickup: ${format(new Date(activeSession.pickup_date), 'dd MMM', { locale: id })}`}
              </p>
            </div>
            <Link
              href={`/orders?session=${activeSession.id}`}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 flex-shrink-0"
            >
              Pesanan <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500 text-center mb-2">Tidak ada sesi aktif</p>
          <div className="text-center">
            <Link href="/sessions" className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium">
              <Plus size={14} /> Buat Sesi Baru
            </Link>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            {card.sub && <p className="text-xs text-green-600 font-medium mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {totalOrders > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Payment Progress */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Status Pembayaran</h3>
            <div className="space-y-3">
              {[
                { label: 'Lunas', count: paidOrders.length, color: 'bg-green-500' },
                { label: 'DP', count: dpOrders.length, color: 'bg-yellow-500' },
                { label: 'Belum Bayar', count: unpaidOrders.length, color: 'bg-red-400' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.count} pesanan</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: totalOrders > 0 ? `${(item.count / totalOrders) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Pesanan Terbaru</h3>
              <Link href="/orders" className="text-xs text-orange-600 font-medium">Lihat semua</Link>
            </div>
            <div className="space-y-3">
              {displayOrders.slice(0, 4).map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.order_items.length} item</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(calcOrderTotal(order))}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700'
                      : order.payment_status === 'dp' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {order.payment_status === 'paid' ? 'Lunas' : order.payment_status === 'dp' ? 'DP' : 'Belum'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/orders', label: 'Input Pesanan', emoji: '📝', desc: 'Catat pesanan baru' },
          { href: '/products', label: 'Kelola Produk', emoji: '🛍️', desc: 'Atur harga & produk' },
          { href: '/sessions', label: 'Sesi PO', emoji: '📅', desc: 'Buat & kelola sesi' },
          { href: '/reports', label: 'Laporan', emoji: '📊', desc: 'Laba rugi per sesi' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
          >
            <p className="text-2xl mb-2">{item.emoji}</p>
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
