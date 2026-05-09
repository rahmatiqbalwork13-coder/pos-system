'use client'

import { useRef, useState } from 'react'
import type { Order, OrderItem } from '@/lib/supabase/database.types'
import { formatCurrency, deliveryLabel, paymentStatusLabel, sourceLabel } from '@/lib/utils'
import { X, Printer, MessageCircle, Download, Check, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'


type OrderWithItems = Order & { order_items: OrderItem[] }

interface Props {
  order: OrderWithItems
  businessName: string
  businessInfo?: {
    address?: string
    phone?: string
    email?: string
    website?: string
    paymentInfo?: string
  }
  onClose: () => void
}

export default function ReceiptModal({ order, businessName, businessInfo, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal')

  const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
  const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
  const total = subtotal + ongkir
  const selisih = order.amount_paid - total
  const remaining = total - order.amount_paid

  function handlePrint() {
    const content = receiptRef.current?.innerHTML ?? ''
    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return
    
    const isThermal = printFormat === 'thermal'
    
    win.document.write(`<!DOCTYPE html><html><head><title>Struk Pembayaran</title>
      <meta charset="UTF-8">
      <style>
        @page { 
          size: ${isThermal ? '80mm auto' : 'A4'};
          margin: ${isThermal ? '0' : '20mm'};
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: ${isThermal ? "'Courier New', monospace" : "system-ui, -apple-system, sans-serif"}; 
          font-size: ${isThermal ? '12px' : '14px'}; 
          padding: ${isThermal ? '8px' : '0'}; 
          max-width: ${isThermal ? '80mm' : '210mm'}; 
          margin: 0 auto;
          background: white;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: ${isThermal ? '14px' : '18px'}; }
        .text-sm { font-size: ${isThermal ? '11px' : '13px'}; }
        .text-xs { font-size: ${isThermal ? '10px' : '11px'}; }
        .text-gray { color: #666; }
        .border-t { border-top: ${isThermal ? '1px dashed #ccc' : '1px solid #e5e7eb'}; }
        .border-b { border-bottom: ${isThermal ? '1px dashed #ccc' : '1px solid #e5e7eb'}; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .p-2 { padding: 8px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .w-full { width: 100%; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        /* Thermal specific */
        .thermal-header { text-align: center; margin-bottom: 12px; }
        .thermal-header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .thermal-divider { border-top: 1px dashed #999; margin: 8px 0; }
        .thermal-total { font-size: 14px; font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 8px 0; margin: 8px 0; }
        
        /* A4 specific */
        .a4-header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
        .a4-logo { font-size: 24px; font-weight: bold; color: #f97316; }
        .a4-title { font-size: 24px; font-weight: bold; margin-top: 8px; }
        .a4-section { margin-bottom: 24px; }
        .a4-section-title { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 0.5px; }
        .a4-table { width: 100%; border-collapse: collapse; }
        .a4-table th { text-align: left; padding: 12px 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #666; }
        .a4-table td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
        .a4-total-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px; }
        
        /* Status badges */
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 600; font-size: 10px; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-dp { background: #fef9c3; color: #a16207; }
        .badge-unpaid { background: #fee2e2; color: #b91c1c; }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  function handleDownloadPDF() {
    // This would require a PDF library like jsPDF or html2pdf
    // For now, we'll use the print to PDF feature of the browser
    handlePrint()
  }

  async function handleCopyText() {
    const lines = [
      `╔════════════════════════════════════╗`,
      `║     ${businessName.toUpperCase().padEnd(28)} ║`,
      `╚════════════════════════════════════╝`,
      ``,
      `📄 INVOICE #${order.id.slice(0, 8).toUpperCase()}`,
      `📅 ${format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}`,
      ``,
      `👤 Pelanggan: ${order.customer_name}`,
      `📱 HP: ${order.customer_phone}`,
      `📍 Sumber: ${sourceLabel(order.source)}`,
      `🚚 Pengiriman: ${deliveryLabel(order.delivery_type)}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🛒 ITEM PESANAN:`,
      ...order.order_items.map(i =>
        `  ${i.product_name}
   ${i.quantity} × ${formatCurrency(i.sell_price)} = ${formatCurrency(i.subtotal_sell)}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Subtotal:     ${formatCurrency(subtotal).padStart(20)}`,
      ongkir > 0 ? `Ongkir:       ${formatCurrency(ongkir).padStart(20)}` : null,
      `──────────────────────────────────`,
      `*TOTAL:       ${formatCurrency(total).padStart(20)}*`,
      ``,
      order.payment_method ? `💳 Metode: ${order.payment_method}` : null,
      order.amount_paid > 0 ? `💰 Dibayar:    ${formatCurrency(order.amount_paid).padStart(18)}` : null,
      selisih > 0 ? `🔄 Kembalian:  ${formatCurrency(selisih).padStart(18)}` : null,
      remaining > 0 ? `⚠️ Sisa:       ${formatCurrency(remaining).padStart(18)}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Status: *${paymentStatusLabel(order.payment_status).toUpperCase()}* ${order.payment_status === 'paid' ? '✅' : order.payment_status === 'dp' ? '⏳' : '❌'}`,
      ``,
      businessInfo?.paymentInfo ? `💳 ${businessInfo.paymentInfo}` : null,
      ``,
      `Terima kasih sudah memesan! 🙏`,
      `_${businessName}_`,
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(lines)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  function handleWhatsApp() {
    const lines = [
      `*🧾 INVOICE - ${businessName}*`,
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `*📄 No. Invoice:* #${order.id.slice(0, 8).toUpperCase()}`,
      `*📅 Tanggal:* ${format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}`,
      `━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*👤 Pelanggan:*`,
      `Nama: ${order.customer_name}`,
      `HP: ${order.customer_phone}`,
      ``,
      `*🛒 Item Pesanan:*`,
      ...order.order_items.map(i =>
        `• ${i.product_name}\n  ${i.quantity} × ${formatCurrency(i.sell_price)} = *${formatCurrency(i.subtotal_sell)}*`
      ),
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `Subtotal: ${formatCurrency(subtotal)}`,
      ongkir > 0 ? `Ongkir: ${formatCurrency(ongkir)}` : null,
      `*TOTAL: ${formatCurrency(total)}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      ``,
      order.payment_method ? `💳 Metode: ${order.payment_method}` : null,
      order.amount_paid > 0 ? `💰 Dibayar: ${formatCurrency(order.amount_paid)}` : null,
      selisih > 0 ? `🔄 Kembalian: ${formatCurrency(selisih)}` : null,
      remaining > 0 ? `⚠️ Sisa Tagihan: ${formatCurrency(remaining)}` : null,
      ``,
      `Status: *${paymentStatusLabel(order.payment_status).toUpperCase()}* ${order.payment_status === 'paid' ? '✅' : order.payment_status === 'dp' ? '⏳' : '❌'}`,
      ``,
      businessInfo?.paymentInfo ? `💳 ${businessInfo.paymentInfo}` : null,
      ``,
      `_Terima kasih sudah memesan! 🙏_`,
    ].filter(Boolean).join('\n')

    window.open(`https://wa.me/${order.customer_phone}?text=${encodeURIComponent(lines)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900">Invoice / Struk</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  printFormat === 'thermal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                Thermal (58/80mm)
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  printFormat === 'a4' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                A4 Letter
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div ref={receiptRef} className={`bg-white mx-auto shadow-sm ${
            printFormat === 'thermal' ? 'max-w-[300px] p-4 font-mono text-xs' : 'max-w-[210mm] p-8'
          }`}>
            {printFormat === 'thermal' ? (
              // Thermal Receipt Format
              <>
                <div className="thermal-header">
                  <h1 className="text-lg font-bold text-gray-900">{businessName}</h1>
                  {businessInfo?.address && <p className="text-xs text-gray-500">{businessInfo.address}</p>}
                  {businessInfo?.phone && <p className="text-xs text-gray-500">Telp: {businessInfo.phone}</p>}
                  <p className="text-xs text-gray-400 mt-2">STRUK PEMBAYARAN</p>
                </div>

                <div className="thermal-divider" />

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">No</span>
                    <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span>{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</span>
                  </div>
                </div>

                <div className="thermal-divider" />

                <div className="space-y-1 text-xs mb-2">
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

                <div className="thermal-divider" />

                <p className="text-xs font-bold mb-2">ITEM</p>
                <div className="space-y-2">
                  {order.order_items.map(item => (
                    <div key={item.id} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium flex-1 mr-2">{item.product_name}</span>
                        <span className="font-bold">{formatCurrency(item.subtotal_sell)}</span>
                      </div>
                      <p className="text-gray-400 text-10">{item.quantity} × {formatCurrency(item.sell_price)}</p>
                    </div>
                  ))}
                </div>

                <div className="thermal-total">
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
                  <div className="flex justify-between text-sm font-bold border-t-2 border-black pt-1 mt-1">
                    <span>TOTAL</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs mt-2">
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
                    <span className={`badge ${
                      order.payment_status === 'paid' ? 'badge-paid' :
                      order.payment_status === 'dp' ? 'badge-dp' : 'badge-unpaid'
                    }`}>
                      {paymentStatusLabel(order.payment_status).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
                  <p className="text-xs text-gray-500">Terima kasih!</p>
                  <p className="text-10 text-gray-400 mt-1">{businessName}</p>
                </div>
              </>
            ) : (
              // A4 Invoice Format
              <>
                <div className="a4-header">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="a4-logo">{businessName}</div>
                      <p className="text-sm text-gray-500 mt-1">Invoice / Struk Pembayaran</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">INVOICE</p>
                      <p className="text-lg font-mono text-gray-600 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="grid-2 mb-8">
                  <div>
                    <p className="a4-section-title">Dari</p>
                    <p className="font-bold text-gray-900">{businessName}</p>
                    {businessInfo?.address && <p className="text-sm text-gray-600 mt-1">{businessInfo.address}</p>}
                    {businessInfo?.phone && <p className="text-sm text-gray-600">Telp: {businessInfo.phone}</p>}
                    {businessInfo?.email && <p className="text-sm text-gray-600">{businessInfo.email}</p>}
                  </div>
                  <div>
                    <p className="a4-section-title">Kepada</p>
                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{order.customer_phone}</p>
                    <p className="text-sm text-gray-600">{deliveryLabel(order.delivery_type)}</p>
                  </div>
                </div>

                <div className="grid-2 mb-8">
                  <div>
                    <p className="a4-section-title">Tanggal Pesanan</p>
                    <p className="text-gray-900">{format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
                  </div>
                  <div>
                    <p className="a4-section-title">Status Pembayaran</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                      order.payment_status === 'dp' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {paymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>

                <div className="a4-section">
                  <p className="a4-section-title">Detail Pesanan</p>
                  <table className="a4-table">
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Harga</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{formatCurrency(item.sell_price)}</td>
                          <td className="text-right font-medium">{formatCurrency(item.subtotal_sell)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="a4-total-box">
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
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  
                  {order.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between text-sm mt-3 pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Dibayar</span>
                        <span>{formatCurrency(order.amount_paid)}</span>
                      </div>
                      {selisih > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Kembalian</span>
                          <span>{formatCurrency(selisih)}</span>
                        </div>
                      )}
                      {remaining > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Sisa Tagihan</span>
                          <span>{formatCurrency(remaining)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {order.payment_method && (
                    <div className="mt-3 pt-2 border-t border-gray-200 text-sm">
                      <span className="text-gray-600">Metode Pembayaran: </span>
                      <span className="font-medium">{order.payment_method}</span>
                    </div>
                  )}
                </div>

                {businessInfo?.paymentInfo && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Informasi Pembayaran</p>
                    <p className="text-sm text-gray-700">{businessInfo.paymentInfo}</p>
                  </div>
                )}

                <div className="mt-8 text-center text-sm text-gray-500">
                  <p>Terima kasih atas kepercayaan Anda!</p>
                  <p className="mt-1 text-xs">{businessName}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 p-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} />
            Kirim WA
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Tersalin!' : 'Copy Text'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Printer size={16} />
            Cetak
          </button>
        </div>
      </div>
    </div>
  )
}
