import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-3)
}

export function calcMargin(buyPrice: number, sellPrice: number) {
  const marginRp = sellPrice - buyPrice
  const marginPct = sellPrice > 0 ? (marginRp / sellPrice) * 100 : 0
  return { marginRp, marginPct }
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    kebab: 'Kebab',
    roti_maryam: 'Roti Maryam',
    donat: 'Donat',
  }
  return map[cat] ?? cat
}

export function sourceLabel(src: string): string {
  const map: Record<string, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    tatap_muka: 'Tatap Muka',
  }
  return map[src] ?? src
}

export function deliveryLabel(d: string): string {
  const map: Record<string, string> = {
    pickup: 'Ambil Sendiri',
    antar_langsung: 'Antar Langsung',
    gosend: 'GoSend',
    grabsend: 'GrabSend',
    lainnya: 'Lainnya',
  }
  return map[d] ?? d
}

export function paymentStatusLabel(s: string): string {
  const map: Record<string, string> = {
    unpaid: 'Belum Bayar',
    dp: 'DP',
    paid: 'Lunas',
  }
  return map[s] ?? s
}

export function sessionStatusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    active: 'Aktif',
    closed: 'Tutup',
    done: 'Selesai',
  }
  return map[s] ?? s
}
