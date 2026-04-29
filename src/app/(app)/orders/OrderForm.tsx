'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem, PoSession, Product } from '@/lib/supabase/database.types'
import { formatCurrency, categoryLabel } from '@/lib/utils'
import { X, Plus, Minus } from 'lucide-react'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface CartItem {
  product: Product
  quantity: number
}

interface Props {
  order: OrderWithItems | null
  sessions: PoSession[]
  products: Product[]
  defaultSessionId?: string
  onSaved: (order: OrderWithItems) => void
  onClose: () => void
}

export default function OrderForm({ order, sessions, products, defaultSessionId, onSaved, onClose }: Props) {
  const [sessionId, setSessionId] = useState(order?.session_id ?? defaultSessionId ?? '')
  const [customerName, setCustomerName] = useState(order?.customer_name ?? '')
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone ?? '')
  const [source, setSource] = useState<string>(order?.source ?? 'whatsapp')
  const [deliveryType, setDeliveryType] = useState<string>(order?.delivery_type ?? 'pickup')
  const [deliveryNote, setDeliveryNote] = useState(order?.delivery_note ?? '')
  const [deliveryCost, setDeliveryCost] = useState(order?.delivery_cost?.toString() ?? '0')
  const [deliveryPaidBy, setDeliveryPaidBy] = useState<string>(order?.delivery_paid_by ?? 'customer')
  const [notes, setNotes] = useState(order?.notes ?? '')
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (order?.order_items) {
      return order.order_items.map(item => ({
        product: products.find(p => p.id === item.product_id) ?? {
          id: item.product_id,
          name: item.product_name,
          current_buy_price: item.buy_price,
          current_sell_price: item.sell_price,
          category: 'kebab' as const,
          image_url: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        quantity: item.quantity,
      }))
    }
    return []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const needsDeliveryCost = deliveryType !== 'pickup'
  const subtotal = cart.reduce((s, item) => s + item.product.current_sell_price * item.quantity, 0)
  const ongkir = parseFloat(deliveryCost) || 0
  const total = subtotal + (deliveryPaidBy === 'customer' ? ongkir : 0)

  function addProduct(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.product.id !== productId))
    else setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionId) return setError('Pilih sesi PO terlebih dahulu')
    if (!customerName.trim()) return setError('Nama customer wajib diisi')
    if (!customerPhone.trim()) return setError('Nomor HP wajib diisi')
    if (cart.length === 0) return setError('Tambahkan minimal 1 produk')
    setLoading(true)
    setError('')
    const supabase = createClient()

    const orderPayload = {
      session_id: sessionId,
      customer_name: customerName,
      customer_phone: customerPhone,
      source: source as Order['source'],
      delivery_type: deliveryType as Order['delivery_type'],
      delivery_note: deliveryNote || null,
      delivery_cost: ongkir,
      delivery_paid_by: deliveryPaidBy as Order['delivery_paid_by'],
      notes: notes || null,
      updated_at: new Date().toISOString(),
    }

    let orderId = order?.id
    if (order) {
      await supabase.from('orders').update(orderPayload).eq('id', order.id)
      await supabase.from('order_items').delete().eq('order_id', order.id)
    } else {
      const { data, error: err } = await supabase
        .from('orders')
        .insert({ ...orderPayload, payment_status: 'unpaid', amount_paid: 0 })
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      orderId = data.id
    }

    const items = cart.map(item => ({
      order_id: orderId!,
      product_id: item.product.id,
      product_name: item.product.name,
      buy_price: item.product.current_buy_price,
      sell_price: item.product.current_sell_price,
      quantity: item.quantity,
    }))
    await supabase.from('order_items').insert(items)

    const { data: saved } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId!)
      .single()

    if (saved) onSaved(saved as OrderWithItems)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">{order ? 'Edit Pesanan' : 'Input Pesanan Baru'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sesi PO *</label>
              <select
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">Pilih sesi...</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Customer *</label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP *</label>
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel Pesanan *</label>
              <div className="flex gap-2">
                {[['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['tatap_muka', 'Tatap Muka']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSource(val)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      source === val ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Pesanan *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {products.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="text-left p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <p className="text-xs font-medium text-gray-900 leading-tight">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{categoryLabel(product.category)}</p>
                    <p className="text-xs font-semibold text-orange-600 mt-1">{formatCurrency(product.current_sell_price)}</p>
                  </button>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <p className="flex-1 text-sm text-gray-700">{item.product.name}</p>
                      <p className="text-xs text-gray-500 w-20 text-right">{formatCurrency(item.product.current_sell_price * item.quantity)}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-medium">
                    <span>Subtotal Produk</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Pengiriman *</label>
              <select
                value={deliveryType}
                onChange={e => setDeliveryType(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="pickup">Ambil Sendiri</option>
                <option value="antar_langsung">Antar Langsung (Bensin)</option>
                <option value="gosend">GoSend</option>
                <option value="grabsend">GrabSend</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {deliveryType === 'lainnya' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Kurir</label>
                <input
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Nama kurir..."
                />
              </div>
            )}

            {needsDeliveryCost && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Biaya Kirim (Rp)</label>
                  <input
                    type="number"
                    value={deliveryCost}
                    onChange={e => setDeliveryCost(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ditanggung Oleh</label>
                  <select
                    value={deliveryPaidBy}
                    onChange={e => setDeliveryPaidBy(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Penjual</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                placeholder="Catatan pesanan..."
              />
            </div>

            {/* Total Summary */}
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Produk</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {needsDeliveryCost && ongkir > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkir ({deliveryPaidBy === 'customer' ? 'customer' : 'penjual'})</span>
                    <span>{formatCurrency(ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-orange-200">
                  <span>Total Tagihan Customer</span>
                  <span className="text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          </div>

          <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
