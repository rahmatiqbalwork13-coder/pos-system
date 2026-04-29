'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/lib/supabase/database.types'
import { formatCurrency, calcMargin, categoryLabel } from '@/lib/utils'
import { Plus, Edit2, Trash2, History } from 'lucide-react'
import ProductForm from './ProductForm'
import PriceHistoryModal from './PriceHistoryModal'

interface Props {
  initialProducts: Product[]
  initialCategories: Category[]
}

export default function ProductsClient({ initialProducts, initialCategories }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [categories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const supabase = createClient()

  const filtered = products.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterStatus === 'active' && !p.is_active) return false
    if (filterStatus === 'inactive' && p.is_active) return false
    return true
  })

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  async function handleToggleActive(product: Product) {
    const { data } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
      .select()
      .single()
    if (data) setProducts(prev => prev.map(p => p.id === data.id ? data : p))
  }

  function handleSaved(product: Product) {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      return exists ? prev.map(p => p.id === product.id ? product : p) : [product, ...prev]
    })
    setShowForm(false)
    setEditProduct(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500">{products.length} produk terdaftar</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Produk</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Semua
        </button>
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setFilterCategory(cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat.slug ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
        <div className="border-l border-gray-200 mx-1" />
        {[['all', 'Semua'], ['active', 'Aktif'], ['inactive', 'Nonaktif']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === val ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Harga Beli</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Harga Jual</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada produk</td></tr>
            )}
            {filtered.map(product => {
              const { marginRp, marginPct } = calcMargin(product.current_buy_price, product.current_sell_price)
              const lowMargin = marginPct < 15
              return (
                <tr key={product.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{categoryLabel(product.category)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(product.current_buy_price)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.current_sell_price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${lowMargin ? 'text-red-600' : 'text-green-600'}`}>
                      {marginPct.toFixed(1)}%
                    </span>
                    <span className="text-gray-400 text-xs ml-1">({formatCurrency(marginRp)})</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setHistoryProductId(product.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Riwayat Harga"
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => { setEditProduct(product); setShowForm(true) }}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Tidak ada produk</div>
        )}
        {filtered.map(product => {
          const { marginPct } = calcMargin(product.current_buy_price, product.current_sell_price)
          const lowMargin = marginPct < 15
          return (
            <div key={product.id} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{categoryLabel(product.category)}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {product.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-gray-500">Harga Beli</p>
                  <p className="font-medium">{formatCurrency(product.current_buy_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Harga Jual</p>
                  <p className="font-medium">{formatCurrency(product.current_sell_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Margin</p>
                  <p className={`font-medium ${lowMargin ? 'text-red-600' : 'text-green-600'}`}>
                    {marginPct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end border-t border-gray-50 pt-3">
                <button
                  onClick={() => setHistoryProductId(product.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  <History size={13} /> Riwayat
                </button>
                <button
                  onClick={() => { setEditProduct(product); setShowForm(true) }}
                  className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB Mobile */}
      <button
        onClick={() => { setEditProduct(null); setShowForm(true) }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {/* Form Modal */}
      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
        />
      )}

      {/* Price History Modal */}
      {historyProductId && (
        <PriceHistoryModal
          productId={historyProductId}
          productName={products.find(p => p.id === historyProductId)?.name ?? ''}
          onClose={() => setHistoryProductId(null)}
        />
      )}
    </div>
  )
}
