'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/supabase/database.types'
import { Plus, Trash2, X } from 'lucide-react'

interface Props {
  initialCategories: Category[]
  initialPaymentMethods: string[]
}

export default function SettingsClient({ initialCategories, initialPaymentMethods }: Props) {
  const [activeTab, setActiveTab] = useState<'categories' | 'payment'>('categories')
  const [categories, setCategories] = useState(initialCategories)
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods)
  const [newCategory, setNewCategory] = useState('')
  const [newPayment, setNewPayment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, sort_order: categories.length + 1 })
      .select()
      .single()
    if (!error && data) {
      setCategories(prev => [...prev, data])
      setNewCategory('')
    }
    setLoading(false)
  }

  async function toggleCategory(cat: Category) {
    const { data } = await supabase
      .from('categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id)
      .select()
      .single()
    if (data) setCategories(prev => prev.map(c => c.id === data.id ? data : c))
  }

  async function deleteCategory(id: string) {
    if (!confirm('Hapus kategori ini? Produk yang sudah ada tidak terpengaruh.')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function savePaymentMethods(methods: string[]) {
    await supabase.from('settings').upsert({
      key: 'payment_methods',
      value: JSON.stringify(methods),
      updated_at: new Date().toISOString(),
    })
  }

  async function addPayment() {
    const name = newPayment.trim()
    if (!name || paymentMethods.includes(name)) return
    const updated = [...paymentMethods, name]
    setPaymentMethods(updated)
    setNewPayment('')
    await savePaymentMethods(updated)
  }

  async function removePayment(method: string) {
    const updated = paymentMethods.filter(m => m !== method)
    setPaymentMethods(updated)
    await savePaymentMethods(updated)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola kategori produk dan metode pembayaran</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {([['categories', 'Kategori Produk'], ['payment', 'Metode Pembayaran']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="Nama kategori baru..."
              className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={addCategory}
              disabled={loading || !newCategory.trim()}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Belum ada kategori</p>
            )}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${!cat.is_active ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.slug}</p>
                </div>
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {cat.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newPayment}
              onChange={e => setNewPayment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPayment()}
              placeholder="Nama metode pembayaran baru..."
              className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={addPayment}
              disabled={!newPayment.trim()}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {paymentMethods.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Belum ada metode pembayaran</p>
            )}
            {paymentMethods.map(method => (
              <div key={method} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                <p className="flex-1 text-sm text-gray-900">{method}</p>
                <button
                  onClick={() => removePayment(method)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
