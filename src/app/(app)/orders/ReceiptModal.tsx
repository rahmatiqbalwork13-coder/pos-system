'use client'

import { useRef } from 'react'
import type { Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency, deliveryLabel, paymentStatusLabel } from '@/lib/utils'
import { X, Printer, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  order: OrderWithItems
  businessName: string
  onClose: () => void
}

export default function ReceiptModal({ order, businessName, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
  const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
  const total = subtotal + ongkir
  const selisih = order.amount_paid - total

  function handlePrint() {
    const content = receiptRef.current?.innerHTML ?? ''
    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Struk Pembayaran</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 300px; margin: 0 auto; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-sm { font-size: 13px; }
        .text-xs { font-size: 11px; }
        .text-gray { color: #666; }
        .border-dashed { border-top: 1px dashed #ccc; margin: 8px 0; }
        .mt-1 { margin-top: 4px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
        .green { background: #dcfce7; color: #15803d; }
        .yellow { background: #fef9c3; color: #a16207; }
        .red { background: #fee2e2; color: #b91c1c; }
        .items-section p { margin-bottom: 2px; }
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  function handleWhatsApp() {
    const lines = [
      `*Struk Pesanan - ${businessName}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `Tgl: ${format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}`,
      `Pelanggan: ${order.customer_name}`,
      `HP: ${order.customer_phone}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `*ITEM PESANAN:*`,
      ...order.order_items.map(i =>
        `• ${i.product_name} ×${i.quantity}\n  ${formatCurrency(i.sell_price)} = ${formatCurrency(i.subtotal_sell)}`
      ),
      `━━━━━━━━━━━━━━━━━━━`,
      `Subtotal: ${formatCurrency(subtotal)}`,
      ongkir > 0 ? `Ongkir (${deliveryLabel(order.delivery_type)}): ${formatCurrency(ongkir)}` : null,
      `*TOTAL: ${formatCurrency(total)}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      order.payment_method ? `Metode: ${order.payment_method}` : null,
      order.amount_paid > 0 ? `Dibayar: ${formatCurrency(order.amount_paid)}` : null,
      selisih > 0 ? `Kembalian: ${formatCurrency(selisih)}` : selisih < 0 ? `Sisa tagihan: ${formatCurrency(Math.abs(selisih))}` : null,
      `Status: *${paymentStatusLabel(order.payment_status).toUpperCase()}* ${order.payment_status === 'paid' ? '✓' : '⏳'}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `_Terima kasih sudah memesan! 🙏_`,
    ].filter(Boolean).join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Struk Pembayaran</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Receipt */}
        <div ref={receiptRef} className="p-5 font-mono text-sm">
          <div className="text-center mb-4">
            <p className="font-bold text-base text-gray-900">{businessName}</p>
            <p className="text-xs text-gray-500 mt-0.5">Struk Pembayaran</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="space-y-0.5 text-xs mb-2 text-gray-">
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal</span>
              <span className="text-gray-900">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-900 font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Pelanggan</span>
              <span className="text-gray-900 font-medium">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">HP</span>
              <span className="text-gray-900">{order.customer_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pengiriman</span>
              <span className="text-gray-900">{deliveryLabel(order.delivery_type)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <p className="text-xs font-semibold text-gray-700 mb-2">ITEM PESANAN</p>
          <div className="space-y-2 mb-2 items-section">
            {order.order_items.map(item => (
              <div key={item.id} className="text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-900 flex-1 mr-2 font-medium">{item.product_name}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.subtotal_sell)}</span>
                </div>
                <p className="text-gray-400">{item.quantity} × {formatCurrency(item.sell_price)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {ongkir > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Ongkir ({deliveryLabel(order.delivery_type)})</span>
                <span>{formatCurrency(ongkir)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-dashed border-gray-300 mt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="space-y-0.5 text-xs mb-3">
            {order.payment_method && (
              <div className="flex justify-between text-gray-600">
                <span>Metode Bayar</span>
                <span className="font-medium text-gray-900">{order.payment_method}</span>
              </div>
            )}
            {order.amount_paid > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Dibayar</span>
                <span>{formatCurrency(order.amount_paid)}</span>
              </div>
            )}
            {selisih > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Kembalian</span>
                <span className="font-medium text-green-600">{formatCurrency(selisih)}</span>
              </div>
            )}
            {selisih < 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Sisa Tagihan</span>
                <span className="font-medium text-red-600">{formatCurrency(Math.abs(selisih))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-0.5 rounded-full font-medium text-xs pill ${
                order.payment_status === 'paid' ? 'green bg-green-100 text-green-700' :
                order.payment_status === 'dp' ? 'yellow bg-yellow-100 text-yellow-700' :
                'red bg-red-100 text-red-700'
              }`}>
                {paymentStatusLabel(order.payment_status)}
              </span>
            </div>
          </div>

          <div className="text-center border-t border-dashed border-gray-300 pt-3">
            <p className="text-xs text-gray-500">Terima kasih sudah memesan!</p>
            <p className="text-xs text-gray-400 mt-0.5">🙏</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
