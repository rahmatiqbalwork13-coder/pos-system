'use client'

import type { PoSession, Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency, deliveryLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Printer, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  session: PoSession
  orders: OrderWithItems[]
}

export default function SessionReportClient({ session, orders }: Props) {
  const paidOrders = orders.filter(o => o.payment_status === 'paid')

  // Revenue = sell price * qty + customer-borne delivery
  const totalRevenue = paidOrders.reduce((s, o) => {
    const subtotal = o.order_items.reduce((ss, i) => ss + i.subtotal_sell, 0)
    const ongkir = o.delivery_paid_by === 'customer' ? o.delivery_cost : 0
    return s + subtotal + ongkir
  }, 0)

  // COGS = buy price * qty
  const totalCogs = paidOrders.reduce((s, o) =>
    s + o.order_items.reduce((ss, i) => ss + i.subtotal_buy, 0), 0)

  // Delivery cost borne by seller
  const sellerDeliveryCost = paidOrders.reduce((s, o) =>
    s + (o.delivery_paid_by === 'seller' ? o.delivery_cost : 0), 0)

  const grossProfit = totalRevenue - totalCogs - sellerDeliveryCost
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // Per-product breakdown
  const productMap: Record<string, {
    name: string
    qty: number
    revenue: number
    cogs: number
    profit: number
  }> = {}
  paidOrders.forEach(o => {
    o.order_items.forEach(item => {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { name: item.product_name, qty: 0, revenue: 0, cogs: 0, profit: 0 }
      }
      productMap[item.product_id].qty += item.quantity
      productMap[item.product_id].revenue += item.subtotal_sell
      productMap[item.product_id].cogs += item.subtotal_buy
      productMap[item.product_id].profit += item.profit
    })
  })
  const productBreakdown = Object.values(productMap).sort((a, b) => b.profit - a.profit)

  // Delivery breakdown
  const deliveryMap: Record<string, { count: number; totalCost: number; byCustomer: number; bySeller: number }> = {}
  orders.forEach(o => {
    if (!deliveryMap[o.delivery_type]) {
      deliveryMap[o.delivery_type] = { count: 0, totalCost: 0, byCustomer: 0, bySeller: 0 }
    }
    deliveryMap[o.delivery_type].count += 1
    deliveryMap[o.delivery_type].totalCost += o.delivery_cost
    if (o.delivery_paid_by === 'customer') deliveryMap[o.delivery_type].byCustomer += o.delivery_cost
    else deliveryMap[o.delivery_type].bySeller += o.delivery_cost
  })

  const summaryCards = [
    { label: 'Total Pendapatan', value: formatCurrency(totalRevenue), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Modal (HPB)', value: formatCurrency(totalCogs), color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'Biaya Kirim (Penjual)', value: formatCurrency(sellerDeliveryCost), color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Laba Kotor', value: formatCurrency(grossProfit), color: grossProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/reports" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Kembali
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Printer size={16} /> Cetak / PDF
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(session.open_date), 'dd MMM', { locale: id })} – {format(new Date(session.close_date), 'dd MMM yyyy', { locale: id })}
          {session.pickup_date && ` · Pickup: ${format(new Date(session.pickup_date), 'dd MMM yyyy', { locale: id })}`}
        </p>
        <p className="text-sm text-gray-500">
          {orders.length} total pesanan · {paidOrders.length} pesanan lunas
        </p>
      </div>

      {/* Margin Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-6 ${margin >= 15 ? 'bg-green-100 text-green-700' : margin >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
        {margin >= 15 ? <TrendingUp size={18} /> : margin < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
        <span className="font-bold text-lg">{margin.toFixed(1)}%</span>
        <span className="text-sm">Margin Sesi</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4`}>
            <p className="text-xs text-gray-600 mb-1">{card.label}</p>
            <p className={`font-bold text-sm ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Product Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Breakdown per Produk</h2>
          <p className="text-xs text-gray-500">Berdasarkan pesanan lunas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Produk</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Pendapatan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Modal</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Laba</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productBreakdown.length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">Belum ada pesanan lunas</td></tr>
              )}
              {productBreakdown.map(p => {
                const pMargin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
                return (
                  <tr key={p.name} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.qty}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.cogs)}</td>
                    <td className="px-5 py-3 text-right font-medium text-green-600">{formatCurrency(p.profit)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${pMargin >= 15 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {pMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
              {productBreakdown.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-5 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right">{productBreakdown.reduce((s, p) => s + p.qty, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(totalCogs)}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(grossProfit + sellerDeliveryCost)}</td>
                  <td className="px-5 py-3 text-right"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Breakdown Pengiriman</h2>
          <p className="text-xs text-gray-500">Semua pesanan (termasuk belum lunas)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Jenis Kirim</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Pesanan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total Biaya</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Penjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(deliveryMap).map(([type, data]) => (
                <tr key={type} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{deliveryLabel(type)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{data.count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(data.totalCost)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(data.byCustomer)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{data.bySeller > 0 ? formatCurrency(data.bySeller) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Dicetak: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
        <p>Sistem Manajemen Open PO</p>
      </div>
    </div>
  )
}
