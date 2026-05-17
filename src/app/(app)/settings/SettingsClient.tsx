'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/supabase/database.types'
import { Plus, Trash2, X, Save } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export type PaymentMethodItem = { name: string; info: string }

interface Props {
  initialCategories: Category[]
  initialPaymentMethods: PaymentMethodItem[]
  initialBusinessName: string
  initialBankInfo: string
  initialBusinessWa: string
}

export default function SettingsClient({ initialCategories, initialPaymentMethods, initialBusinessName, initialBankInfo, initialBusinessWa }: Props) {
  const [activeTab, setActiveTab] = useState<'categories' | 'payment' | 'business'>('categories')
  const [categories, setCategories] = useState(initialCategories)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(initialPaymentMethods)
  const [newCategory, setNewCategory] = useState('')
  const [newName, setNewName] = useState('')
  const [newInfo, setNewInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [bankInfo, setBankInfo] = useState(initialBankInfo)
  const [businessWa, setBusinessWa] = useState(initialBusinessWa)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

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
      toast('Kategori berhasil ditambahkan', 'success')
    } else if (error) {
      toast('Gagal menambahkan kategori', 'error')
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
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    toast('Kategori berhasil dihapus', 'success')
  }

  async function savePaymentMethods(methods: PaymentMethodItem[]) {
    await supabase.from('settings').upsert({
      key: 'payment_methods',
      value: JSON.stringify(methods),
      updated_at: new Date().toISOString(),
    })
  }

  async function saveBusinessInfo() {
    setSavingBusiness(true)
    const entries = [
      { key: 'business_name', value: businessName.trim() || 'Open PO Management' },
      { key: 'bank_info', value: bankInfo.trim() },
      { key: 'business_wa', value: businessWa.trim() },
    ]
    const { error } = await supabase.from('settings').upsert(
      entries.map(e => ({ ...e, updated_at: new Date().toISOString() }))
    )
    setSavingBusiness(false)
    if (error) { toast('Gagal menyimpan info bisnis', 'error'); return }
    toast('Info bisnis berhasil disimpan', 'success')
  }

  async function addPayment() {
    const name = newName.trim()
    if (!name || paymentMethods.some(m => m.name === name)) return
    const updated = [...paymentMethods, { name, info: newInfo.trim() }]
    setPaymentMethods(updated)
    setNewName('')
    setNewInfo('')
    await savePaymentMethods(updated)
    toast('Metode pembayaran ditambahkan', 'success')
  }

  async function updatePaymentInfo(index: number, info: string) {
    const current = paymentMethods[index]
    if (current.info === info) return
    const updated = paymentMethods.map((m, i) => i === index ? { ...m, info } : m)
    setPaymentMethods(updated)
    await savePaymentMethods(updated)
    toast('Info rekening disimpan', 'success')
  }

  async function removePayment(name: string) {
    const updated = paymentMethods.filter(m => m.name !== name)
    setPaymentMethods(updated)
    await savePaymentMethods(updated)
    toast('Metode pembayaran dihapus', 'success')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola kategori produk dan metode pembayaran</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {([['categories', 'Kategori'], ['payment', 'Pembayaran'], ['business', 'Info Bisnis']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
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
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Tambahkan metode pembayaran beserta nomor rekening/akun. Info rekening akan muncul di struk.
          </div>

          {/* Add new method */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-gray-600 mb-3">Tambah Metode Baru</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPayment()}
              placeholder="Nama metode, misal: GoPay, Transfer BCA, Cash"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              value={newInfo}
              onChange={e => setNewInfo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPayment()}
              placeholder="Nomor rekening/akun (opsional), misal: 081234567890"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={addPayment}
              disabled={!newName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={15} /> Tambah
            </button>
          </div>

          {/* Existing methods */}
          <div className="space-y-2">
            {paymentMethods.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Belum ada metode pembayaran</p>
            )}
            {paymentMethods.map((method, i) => (
              <div key={method.name} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{method.name}</p>
                  <button
                    onClick={() => removePayment(method.name)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  key={`${method.name}-info`}
                  defaultValue={method.info}
                  placeholder="Nomor rekening / akun (opsional)"
                  onBlur={e => updatePaymentInfo(i, e.target.value.trim())}
                  className="w-full px-2.5 py-2 border border-gray-100 bg-gray-50 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
                />
                {method.info && (
                  <p className="text-xs text-green-600 mt-1 ml-0.5">✓ {method.info}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Info */}
      {activeTab === 'business' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Info ini ditampilkan di struk/invoice dan digunakan di tombol WhatsApp.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Toko</label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Contoh: Open PO Kebab Sari"
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp Toko</label>
            <input
              value={businessWa}
              onChange={e => setBusinessWa(e.target.value)}
              placeholder="Contoh: 6281234567890 (tanpa tanda +)"
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">Format internasional tanpa +, misal: 6281234567890</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Info Rekening / Pembayaran</label>
            <textarea
              value={bankInfo}
              onChange={e => setBankInfo(e.target.value)}
              placeholder="Contoh: BCA 1234567890 a/n Sari&#10;GoPay/OVO/Dana: 081234567890"
              rows={4}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Ditampilkan di bagian bawah struk/invoice</p>
          </div>

          <button
            onClick={saveBusinessInfo}
            disabled={savingBusiness}
            className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {savingBusiness ? 'Menyimpan...' : 'Simpan Info Bisnis'}
          </button>
        </div>
      )}
    </div>
  )
}
