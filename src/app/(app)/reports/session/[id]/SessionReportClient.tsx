'use client'

import type { PoSession, Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency, deliveryLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Printer, ArrowLeft, TrendingUp, TrendingDown, Minus, FileText, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { usePermission } from '@/hooks/useAuth'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  session: PoSession
  orders: OrderWithItems[]
}

export default function SessionReportClient({ session, orders }: Props) {
  const canExportData = usePermission('canExportData')
  const canViewProfit = usePermission('canViewProfit')
  
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
    ...(canViewProfit ? [
      { label: 'Total Modal (HPB)', value: formatCurrency(totalCogs), color: 'text-gray-700', bg: 'bg-gray-50' },
      { label: 'Biaya Kirim (Penjual)', value: formatCurrency(sellerDeliveryCost), color: 'text-red-600', bg: 'bg-red-50' },
      { label: 'Laba Kotor', value: formatCurrency(grossProfit), color: grossProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
    ] : []),
  ]

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(16)
    doc.text(`Laporan: ${session.name}`, 14, 20)
    
    doc.setFontSize(10)
    doc.text(`Periode: ${format(new Date(session.open_date), 'dd MMM yyyy')} - ${format(new Date(session.close_date), 'dd MMM yyyy')}`, 14, 28)
    doc.text(`Total Pesanan: ${orders.length} (${paidOrders.length} lunas)`, 14, 33)
    
    if (canViewProfit) {
      doc.text(`Total Pendapatan: ${formatCurrency(totalRevenue)}`, 14, 40)
      doc.text(`Laba Kotor: ${formatCurrency(grossProfit)}`, 14, 45)
      doc.text(`Margin: ${margin.toFixed(1)}%`, 14, 50)
    }
    
    // Product table
    let y = canViewProfit ? 60 : 45
    doc.setFillColor(249, 115, 22)
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Produk', 16, y)
    doc.text('Qty', 70, y)
    doc.text('Pendapatan', 90, y)
    if (canViewProfit) {
      doc.text('Modal', 120, y)
      doc.text('Laba', 150, y)
    }
    
    doc.setTextColor(0, 0, 0)
    y += 8
    
    productBreakdown.forEach((p) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(8)
      doc.text(p.name.substring(0, 25), 16, y)
      doc.text(p.qty.toString(), 70, y)
      doc.text(formatCurrency(p.revenue), 90, y)
      if (canViewProfit) {
        doc.text(formatCurrency(p.cogs), 120, y)
        doc.text(formatCurrency(p.profit), 150, y)
      }
      y += 6
    })
    
    doc.save(`laporan-${session.name}.pdf`)
  }

  const exportToExcel = () => {
    const worksheetData = [
      ['Laporan Sesi', session.name],
      ['Periode', `${format(new Date(session.open_date), 'dd MMM yyyy')} - ${format(new Date(session.close_date), 'dd MMM yyyy')}`],
      ['Total Pesanan', orders.length],
      ['Pesanan Lunas', paidOrders.length],
      ['Total Pendapatan', totalRevenue],
      ...(canViewProfit ? [
        ['Total Modal', totalCogs],
        ['Biaya Kirim (Penjual)', sellerDeliveryCost],
        ['Laba Kotor', grossProfit],
        ['Margin (%)', margin.toFixed(2)],
      ] : []),
      [],
      ['Breakdown per Produk'],
      ['Produk', 'Qty', 'Pendapatan', ...(canViewProfit ? ['Modal', 'Laba', 'Margin (%)'] : [])],
      ...productBreakdown.map(p => [
        p.name,
        p.qty,
        p.revenue,
        ...(canViewProfit ? [p.cogs, p.profit, ((p.profit / p.revenue) * 100).toFixed(2)] : []),
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    
    XLSX.writeFile(wb, `laporan-${session.name}.xlsx`)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/reports" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Kembali
        </Link>
        <div className="flex items-center gap-2">
          {canExportData && (
            <>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100"
              >
                <FileText size={16} /> Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100"
              >
                <FileSpreadsheet size={16} /> Export Excel
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>
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
      {canViewProfit && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-6 ${margin >= 15 ? 'bg-green-100 text-green-700' : margin >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {margin >= 15 ? <TrendingUp size={18} /> : margin < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
          <span className="font-bold text-lg">{margin.toFixed(1)}%</span>
          <span className="text-sm">Margin Sesi</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className={`grid gap-3 mb-6 ${canViewProfit ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
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
                {canViewProfit && (
                  <>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Modal</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Laba</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Margin</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productBreakdown.length === 0 && (
                <tr><td colSpan={canViewProfit ? 6 : 3} className="text-center py-6 text-gray-400">Belum ada pesanan lunas</td></tr>
              )}
              {productBreakdown.map(p => {
                const pMargin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
                return (
                  <tr key={p.name} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.qty}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                    {canViewProfit && (
                      <>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.cogs)}</td>
                        <td className="px-5 py-3 text-right font-medium text-green-600">{formatCurrency(p.profit)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-medium ${pMargin >= 15 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {pMargin.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              {productBreakdown.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-5 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right">{productBreakdown.reduce((s, p) => s + p.qty, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalRevenue)}</td>
                  {canViewProfit && (
                    <>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(totalCogs)}</td>
                      <td className="px-5 py-3 text-right text-green-600">{formatCurrency(grossProfit + sellerDeliveryCost)}</td>
                      <td className="px-5 py-3 text-right"></td>
                    </>
                  )}
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
