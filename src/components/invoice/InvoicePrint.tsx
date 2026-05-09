'use client'

import { useRef } from 'react'
import type { Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency, deliveryLabel, paymentStatusLabel, sourceLabel } from '@/lib/utils'
import { Printer, Download } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { jsPDF } from 'jspdf'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface InvoicePrintProps {
  order: OrderWithItems
  businessName: string
  businessInfo?: {
    address?: string
    phone?: string
    email?: string
    website?: string
    paymentInfo?: string
    logo?: string
  }
  format?: 'thermal' | 'a4'
}

export function InvoicePrint({ order, businessName, businessInfo, format: printFormat = 'a4' }: InvoicePrintProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
  const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
  const total = subtotal + ongkir
  const selisih = order.amount_paid - total
  const remaining = total - order.amount_paid

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF(printFormat === 'thermal' ? 'p' : 'p', 'mm', printFormat === 'thermal' ? [80, 200] : 'a4')
    
    if (printFormat === 'thermal') {
      // Thermal format
      let y = 10
      doc.setFontSize(14)
      doc.text(businessName, 40, y, { align: 'center' })
      y += 8
      doc.setFontSize(10)
      doc.text('STRUK PEMBAYARAN', 40, y, { align: 'center' })
      y += 10
      
      doc.setLineWidth(0.5)
      doc.line(5, y, 75, y)
      y += 6
      
      doc.setFontSize(9)
      doc.text(`No: #${order.id.slice(0, 8).toUpperCase()}`, 5, y)
      y += 5
      doc.text(`Tgl: ${format(new Date(order.created_at), 'dd/MM/yy HH:mm')}`, 5, y)
      y += 10
      
      doc.line(5, y, 75, y)
      y += 6
      
      doc.text(`Pelanggan: ${order.customer_name}`, 5, y)
      y += 5
      doc.text(`HP: ${order.customer_phone}`, 5, y)
      y += 5
      doc.text(`Kirim: ${deliveryLabel(order.delivery_type)}`, 5, y)
      y += 10
      
      doc.line(5, y, 75, y)
      y += 6
      
      doc.setFontSize(10)
      doc.text('ITEM:', 5, y)
      y += 6
      
      doc.setFontSize(9)
      order.order_items.forEach(item => {
        doc.text(item.product_name.substring(0, 20), 5, y)
        y += 4
        doc.text(`${item.quantity} x ${formatCurrency(item.sell_price)} = ${formatCurrency(item.subtotal_sell)}`, 5, y)
        y += 6
      })
      
      y += 2
      doc.line(5, y, 75, y)
      y += 6
      
      doc.setFontSize(9)
      doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 5, y)
      y += 5
      if (ongkir > 0) {
        doc.text(`Ongkir: ${formatCurrency(ongkir)}`, 5, y)
        y += 5
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`TOTAL: ${formatCurrency(total)}`, 5, y)
      doc.setFont('helvetica', 'normal')
      y += 8
      
      doc.setFontSize(9)
      if (order.payment_method) {
        doc.text(`Metode: ${order.payment_method}`, 5, y)
        y += 5
      }
      if (order.amount_paid > 0) {
        doc.text(`Bayar: ${formatCurrency(order.amount_paid)}`, 5, y)
        y += 5
      }
      if (selisih > 0) {
        doc.text(`Kembali: ${formatCurrency(selisih)}`, 5, y)
        y += 5
      }
      if (remaining > 0) {
        doc.text(`Sisa: ${formatCurrency(remaining)}`, 5, y)
        y += 5
      }
      
      y += 5
      doc.line(5, y, 75, y)
      y += 6
      
      doc.text(`Status: ${paymentStatusLabel(order.payment_status).toUpperCase()}`, 5, y)
      y += 10
      
      doc.text('Terima kasih!', 40, y, { align: 'center' })
      
    } else {
      // A4 format
      let y = 20
      
      // Header
      doc.setFontSize(24)
      doc.setTextColor(249, 115, 22)
      doc.text(businessName, 20, y)
      doc.setTextColor(0, 0, 0)
      y += 10
      
      doc.setFontSize(12)
      doc.text('INVOICE', 20, y)
      y += 8
      
      doc.setFontSize(10)
      doc.text(`#${order.id.slice(0, 8).toUpperCase()}`, 20, y)
      y += 15
      
      // From/To
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Dari:', 20, y)
      doc.text('Kepada:', 110, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(businessName, 20, y)
      doc.text(order.customer_name, 110, y)
      y += 5
      
      if (businessInfo?.address) {
        doc.text(businessInfo.address, 20, y)
      }
      doc.text(order.customer_phone, 110, y)
      y += 15
      
      // Table header
      doc.setFillColor(249, 250, 251)
      doc.rect(20, y - 5, 170, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text('Produk', 25, y)
      doc.text('Qty', 100, y)
      doc.text('Harga', 130, y)
      doc.text('Total', 170, y, { align: 'right' })
      y += 10
      
      doc.setFont('helvetica', 'normal')
      order.order_items.forEach(item => {
        doc.text(item.product_name.substring(0, 30), 25, y)
        doc.text(item.quantity.toString(), 100, y)
        doc.text(formatCurrency(item.sell_price), 130, y)
        doc.text(formatCurrency(item.subtotal_sell), 170, y, { align: 'right' })
        y += 8
      })
      
      y += 5
      doc.setDrawColor(229, 231, 235)
      doc.line(20, y, 190, y)
      y += 10
      
      // Totals
      doc.text('Subtotal:', 130, y)
      doc.text(formatCurrency(subtotal), 170, y, { align: 'right' })
      y += 8
      
      if (ongkir > 0) {
        doc.text('Ongkir:', 130, y)
        doc.text(formatCurrency(ongkir), 170, y, { align: 'right' })
        y += 8
      }
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('TOTAL:', 130, y)
      doc.text(formatCurrency(total), 170, y, { align: 'right' })
      y += 15
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      if (order.amount_paid > 0) {
        doc.text('Dibayar:', 130, y)
        doc.text(formatCurrency(order.amount_paid), 170, y, { align: 'right' })
        y += 8
        
        if (selisih > 0) {
          doc.text('Kembalian:', 130, y)
          doc.text(formatCurrency(selisih), 170, y, { align: 'right' })
          y += 8
        } else if (remaining > 0) {
          doc.text('Sisa:', 130, y)
          doc.text(formatCurrency(remaining), 170, y, { align: 'right' })
          y += 8
        }
      }
      
      y += 10
      doc.text(`Status: ${paymentStatusLabel(order.payment_status)}`, 20, y)
      y += 15
      
      doc.text('Terima kasih atas kepercayaan Anda!', 105, y, { align: 'center' })
    }
    
    doc.save(`invoice-${order.id.slice(0, 8)}.pdf`)
  }

  return (
    <div className="print-container">
      {/* Print Controls */}
      <div className="flex gap-2 mb-4 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
        >
          <Printer size={16} />
          Cetak
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Invoice Content */}
      <div 
        ref={invoiceRef}
        className={`bg-white mx-auto shadow-lg ${
          printFormat === 'thermal' 
            ? 'max-w-[300px] p-4 font-mono text-xs print:w-[80mm]' 
            : 'max-w-[210mm] p-8 print:w-[210mm]'
        }`}
      >
        {printFormat === 'thermal' ? (
          <ThermalFormat 
            order={order} 
            businessName={businessName} 
            businessInfo={businessInfo}
            subtotal={subtotal}
            ongkir={ongkir}
            total={total}
            selisih={selisih}
            remaining={remaining}
          />
        ) : (
          <A4Format 
            order={order} 
            businessName={businessName} 
            businessInfo={businessInfo}
            subtotal={subtotal}
            ongkir={ongkir}
            total={total}
            selisih={selisih}
            remaining={remaining}
          />
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .print-container {
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Sub-components for different formats
function ThermalFormat({ order, businessName, businessInfo, subtotal, ongkir, total, selisih, remaining }: any) {
  return (
    <div className="text-center">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">{businessName}</h1>
        {businessInfo?.address && <p className="text-xs text-gray-500">{businessInfo.address}</p>}
        {businessInfo?.phone && <p className="text-xs text-gray-500">Telp: {businessInfo.phone}</p>}
        <p className="text-xs text-gray-400 mt-2">STRUK PEMBAYARAN</p>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="space-y-1 text-xs text-left">
        <div className="flex justify-between">
          <span className="text-gray-500">No</span>
          <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tanggal</span>
          <span>{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="space-y-1 text-xs text-left mb-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Pelanggan</span>
          <span className="font-medium">{order.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">HP</span>
          <span>{order.customer_phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Kirim</span>
          <span>{deliveryLabel(order.delivery_type)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <p className="text-xs font-bold text-left mb-2">ITEM</p>
      <div className="space-y-2 text-left">
        {order.order_items.map((item: OrderItem) => (
          <div key={item.id} className="text-xs">
            <div className="flex justify-between">
              <span className="font-medium flex-1 mr-2">{item.product_name}</span>
              <span className="font-bold">{formatCurrency(item.subtotal_sell)}</span>
            </div>
            <p className="text-gray-400 text-10">{item.quantity} × {formatCurrency(item.sell_price)}</p>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-b-2 border-black py-2 my-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {ongkir > 0 && (
          <div className="flex justify-between text-xs mb-1">
            <span>Ongkir</span>
            <span>{formatCurrency(ongkir)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-1 mt-1 border-t border-black">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-1 text-xs text-left">
        {order.payment_method && (
          <div className="flex justify-between">
            <span className="text-gray-500">Metode</span>
            <span>{order.payment_method}</span>
          </div>
        )}
        {order.amount_paid > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Bayar</span>
            <span>{formatCurrency(order.amount_paid)}</span>
          </div>
        )}
        {selisih > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Kembali</span>
            <span className="text-green-600 font-medium">{formatCurrency(selisih)}</span>
          </div>
        )}
        {remaining > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Sisa</span>
            <span className="text-red-600 font-medium">{formatCurrency(remaining)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t-2 border-dashed border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Status</span>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
            order.payment_status === 'dp' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {paymentStatusLabel(order.payment_status).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
        <p className="text-xs text-gray-500">Terima kasih!</p>
        <p className="text-10 text-gray-400 mt-1">{businessName}</p>
      </div>
    </div>
  )
}

function A4Format({ order, businessName, businessInfo, subtotal, ongkir, total, selisih, remaining }: any) {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-orange-500 pb-6 mb-6">
        <div>
          <div className="text-3xl font-bold text-orange-500">{businessName}</div>
          <p className="text-sm text-gray-500 mt-1">Invoice / Struk Pembayaran</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">INVOICE</p>
          <p className="text-xl font-mono text-gray-600 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Dari</p>
          <p className="font-bold text-gray-900 text-lg">{businessName}</p>
          {businessInfo?.address && <p className="text-sm text-gray-600 mt-1">{businessInfo.address}</p>}
          {businessInfo?.phone && <p className="text-sm text-gray-600">Telp: {businessInfo.phone}</p>}
          {businessInfo?.email && <p className="text-sm text-gray-600">{businessInfo.email}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Kepada</p>
          <p className="font-bold text-gray-900 text-lg">{order.customer_name}</p>
          <p className="text-sm text-gray-600 mt-1">{order.customer_phone}</p>
          <p className="text-sm text-gray-600">{deliveryLabel(order.delivery_type)}</p>
          <p className="text-sm text-gray-600">Sumber: {sourceLabel(order.source)}</p>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tanggal Pesanan</p>
          <p className="text-gray-900">{format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status Pembayaran</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
            order.payment_status === 'dp' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Detail Pesanan</p>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase">Produk</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase">Harga</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.order_items.map((item: OrderItem) => (
              <tr key={item.id}>
                <td className="p-3">{item.product_name}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{formatCurrency(item.sell_price)}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal_sell)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {ongkir > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Ongkir ({deliveryLabel(order.delivery_type)})</span>
            <span>{formatCurrency(ongkir)}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-3 mt-3">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        
        {order.amount_paid > 0 && (
          <>
            <div className="flex justify-between text-sm mt-4 pt-3 border-t border-gray-200">
              <span className="text-gray-600">Dibayar</span>
              <span>{formatCurrency(order.amount_paid)}</span>
            </div>
            {selisih > 0 ? (
              <div className="flex justify-between text-sm text-green-600">
                <span>Kembalian</span>
                <span>{formatCurrency(selisih)}</span>
              </div>
            ) : remaining > 0 ? (
              <div className="flex justify-between text-sm text-red-600">
                <span>Sisa Tagihan</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            ) : null}
          </>
        )}

        {order.payment_method && (
          <div className="mt-4 pt-3 border-t border-gray-200 text-sm">
            <span className="text-gray-600">Metode Pembayaran: </span>
            <span className="font-medium">{order.payment_method}</span>
          </div>
        )}
      </div>

      {/* Payment Info */}
      {businessInfo?.paymentInfo && (
        <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <p className="text-xs text-orange-600 uppercase tracking-wide mb-2">Informasi Pembayaran</p>
          <p className="text-sm text-gray-700">{businessInfo.paymentInfo}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Terima kasih atas kepercayaan Anda!</p>
        <p className="mt-2 text-xs">{businessName} - Invoice #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  )
}

export default InvoicePrint
