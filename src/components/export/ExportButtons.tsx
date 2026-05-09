'use client'

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderItem } from '@/lib/supabase/database.types'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface ExportButtonsProps {
  data: OrderWithItems[]
  sessionName?: string
  fileName?: string
}

export function ExportButtons({ data, sessionName = 'Laporan', fileName = 'laporan' }: ExportButtonsProps) {
  
  const calcOrderTotal = (order: OrderWithItems) => {
    const subtotal = order.order_items.reduce((s, i) => s + i.subtotal_sell, 0)
    const ongkir = order.delivery_paid_by === 'customer' ? order.delivery_cost : 0
    return subtotal + ongkir
  }

  const exportToPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFontSize(16)
    doc.text(sessionName, 14, 20)
    
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28)
    doc.text(`Total Pesanan: ${data.length}`, 14, 33)
    
    // Summary
    const totalRevenue = data.reduce((sum, o) => sum + calcOrderTotal(o), 0)
    const totalProfit = data.reduce((sum, o) => 
      sum + o.order_items.reduce((s, i) => s + i.profit, 0), 0
    )
    
    doc.text(`Total Omzet: ${formatCurrency(totalRevenue)}`, 14, 40)
    doc.text(`Total Laba: ${formatCurrency(totalProfit)}`, 14, 45)
    
    // Table Header
    let y = 55
    doc.setFillColor(249, 115, 22)
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('No', 16, y)
    doc.text('Pelanggan', 26, y)
    doc.text('Item', 70, y)
    doc.text('Total', 100, y)
    doc.text('Status', 130, y)
    doc.text('Tanggal', 160, y)
    
    // Table Data
    doc.setTextColor(0, 0, 0)
    y += 8
    
    data.forEach((order, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(8)
      doc.text(`${index + 1}`, 16, y)
      doc.text(order.customer_name.substring(0, 20), 26, y)
      doc.text(`${order.order_items.length} item`, 70, y)
      doc.text(formatCurrency(calcOrderTotal(order)), 100, y)
      doc.text(
        order.payment_status === 'paid' ? 'Lunas' : 
        order.payment_status === 'dp' ? 'DP' : 'Belum',
        130, y
      )
      doc.text(
        new Date(order.created_at).toLocaleDateString('id-ID'),
        160, y
      )
      
      y += 6
    })
    
    doc.save(`${fileName}.pdf`)
  }

  const exportToExcel = () => {
    const worksheetData = data.map((order, index) => ({
      'No': index + 1,
      'Nama Pelanggan': order.customer_name,
      'No. Telepon': order.customer_phone,
      'Sumber': order.source,
      'Jenis Pengiriman': order.delivery_type,
      'Item': order.order_items.map(i => `${i.product_name} (${i.quantity})`).join(', '),
      'Total': calcOrderTotal(order),
      'Status Pembayaran': order.payment_status === 'paid' ? 'Lunas' : order.payment_status === 'dp' ? 'DP' : 'Belum Bayar',
      'Metode Pembayaran': order.payment_method || '-',
      'Tanggal': new Date(order.created_at).toLocaleDateString('id-ID'),
    }))

    const ws = XLSX.utils.json_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    
    // Adjust column widths
    ws['!cols'] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ]
    
    XLSX.writeFile(wb, `${fileName}.xlsx`)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
      >
        <FileText size={18} />
        Export PDF
      </button>
      <button
        onClick={exportToExcel}
        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium"
      >
        <FileSpreadsheet size={18} />
        Export Excel
      </button>
    </div>
  )
}

export default ExportButtons
