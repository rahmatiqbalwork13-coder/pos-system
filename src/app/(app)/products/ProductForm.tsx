'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/lib/supabase/database.types'
import { calcMargin } from '@/lib/utils'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
  product: Product | null
  categories: Category[]
  onSaved: (product: Product) => void
  onClose: () => void
}

export default function ProductForm({ product, categories, onSaved, onClose }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState<string>(product?.category ?? (categories[0]?.slug ?? ''))
  const [buyPrice, setBuyPrice] = useState(product?.current_buy_price?.toString() ?? '')
  const [sellPrice, setSellPrice] = useState(product?.current_sell_price?.toString() ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buy = parseFloat(buyPrice) || 0
  const sell = parseFloat(sellPrice) || 0
  const { marginRp, marginPct } = calcMargin(buy, sell)
  const lowMargin = marginPct < 15 && sell > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Nama produk wajib diisi')
    if (buy <= 0) return setError('Harga beli harus lebih dari 0')
    if (sell <= 0) return setError('Harga jual harus lebih dari 0')
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (product) {
      // Record price history if prices changed
      if (buy !== product.current_buy_price) {
        await supabase.from('price_history').insert({
          product_id: product.id,
          price_type: 'buy',
          old_price: product.current_buy_price,
          new_price: buy,
          changed_by: user?.id,
        })
      }
      if (sell !== product.current_sell_price) {
        await supabase.from('price_history').insert({
          product_id: product.id,
          price_type: 'sell',
          old_price: product.current_sell_price,
          new_price: sell,
          changed_by: user?.id,
        })
      }
      const { data, error: err } = await supabase
        .from('products')
        .update({
          name,
          category: category as Product['category'],
          current_buy_price: buy,
          current_sell_price: sell,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error: err } = await supabase
        .from('products')
        .insert({
          name,
          category: category as Product['category'],
          current_buy_price: buy,
          current_sell_price: sell,
          is_active: isActive,
        })
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      // Record initial prices in history
      await supabase.from('price_history').insert([
        { product_id: data.id, price_type: 'buy', old_price: 0, new_price: buy, changed_by: user?.id },
        { product_id: data.id, price_type: 'sell', old_price: 0, new_price: sell, changed_by: user?.id },
      ])
      onSaved(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Produk *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contoh: Kebab Daging Sapi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Beli (Rp) *</label>
              <input
                type="number"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Jual (Rp) *</label>
              <input
                type="number"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Margin Preview */}
          {buy > 0 && sell > 0 && (
            <div className={`rounded-xl p-3 ${lowMargin ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className={lowMargin ? 'text-red-700' : 'text-green-700'}>
                  {lowMargin && <AlertTriangle size={14} className="inline mr-1" />}
                  Margin: {marginPct.toFixed(1)}%
                </span>
                <span className={`font-medium ${lowMargin ? 'text-red-700' : 'text-green-700'}`}>
                  +Rp {marginRp.toLocaleString('id-ID')}
                </span>
              </div>
              {lowMargin && <p className="text-xs text-red-600 mt-1">Margin di bawah 15% — pertimbangkan menaikkan harga jual</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-700">Produk aktif</span>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
