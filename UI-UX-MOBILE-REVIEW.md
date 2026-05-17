# UI/UX Review — Mobile PWA & Desktop
**Tanggal:** 2026-05-17  
**Reviewer:** Claude (UI/UX + PWA Specialist)  
**Scope:** Mobile PWA + Desktop — Next.js 16, Tailwind CSS, Supabase

---

## Stack & Arsitektur UI

- **Framework:** Next.js 16 App Router
- **Styling:** Tailwind CSS
- **PWA:** `@ducanh2912/next-pwa`
- **UI Components:** Radix UI (Toast, AlertDialog), Lucide React icons
- **Layout mobile:** BottomNav fixed + ModalWrapper (bottom sheet slide-up)
- **Layout desktop:** Sidebar kiri 240px + main content

---

## ✅ Yang Sudah Baik

| Aspek | Detail |
|-------|--------|
| Bottom sheet modal | `ModalWrapper` slide-up dari bawah di mobile, center di desktop ✓ |
| BottomNav positioning | `fixed bottom-0`, z-50, 5 item max, permission-aware ✓ |
| Toast position | `bottom-24 md:bottom-6` — di atas BottomNav di mobile ✓ |
| FAB button | Fixed `bottom-20 right-4` untuk aksi tambah ✓ |
| Responsive layout | Card layout mobile / Table layout desktop ✓ |
| Theme color | Orange `#f97316` konsisten di manifest, meta tags, dan komponen ✓ |
| Active nav indicator | Orange top bar + strokeWidth 2.5 saat aktif ✓ |
| Viewport meta | `maximumScale: 1, userScalable: false` sudah di-set ✓ |
| PWA meta tags | Apple Web App meta tags lengkap ✓ |
| Animasi modal | `translate-y-full` → `translate-y-0` dengan `duration-300` ✓ |

---

## ❌ Masalah Kritis (Harus Diperbaiki)

### 1. Safe Area iPhone Tidak Ditangani di BottomNav
**File:** `src/components/layout/BottomNav.tsx`  
**Masalah:** `BottomNav` tidak punya `padding-bottom: env(safe-area-inset-bottom)`. Di iPhone X ke atas (dengan home indicator), area navigasi akan tertutup sebagian oleh gesture bar sistem.

**Fix yang diperlukan:**
```tsx
// BottomNav nav element — tambahkan pb-safe
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
     style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
```
Atau gunakan Tailwind plugin `tailwindcss-safe-area`:
```tsx
<nav className="md:hidden fixed bottom-0 ... pb-safe">
```

---

### 2. Main Content Padding Bawah Tidak Safe
**File:** `src/app/(app)/layout.tsx`  
**Masalah:** `pb-16` (4rem = 64px) mungkin tidak cukup di iPhone dengan home indicator (~34px). Konten bawah bisa tertutup BottomNav.

**Kode saat ini:**
```tsx
<main className="flex-1 min-w-0 pb-16 md:pb-0">
```
**Fix yang diperlukan:**
```tsx
<main className="flex-1 min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
```

---

### 3. Tidak Ada Logout di Mobile
**File:** `src/components/layout/BottomNav.tsx`  
**Masalah:** Tombol logout hanya ada di Sidebar (desktop). Pengguna mobile tidak bisa logout sama sekali kecuali hapus cache atau akses dari desktop.

**Fix yang diperlukan:** Tambahkan user menu di mobile — bisa berupa:
- Avatar/icon di pojok kanan header halaman dashboard, atau
- Tambah item "Akun" di BottomNav yang membuka bottom sheet dengan info user + tombol logout

---

### 4. Tidak Ada Akses Settings di Mobile
**File:** `src/components/layout/BottomNav.tsx`  
**Masalah:** Halaman `/settings` hanya bisa diakses dari Sidebar (desktop). BottomNav tidak memiliki link ke Settings, sehingga pengguna mobile tidak bisa mengubah kategori, metode pembayaran, atau info bisnis.

**Fix yang diperlukan:** Salah satu opsi:
- Ganti salah satu item BottomNav (misal Laporan) dengan icon Settings, pindah Laporan ke dalam halaman Sesi
- Atau tambahkan icon Settings di header mobile (pojok kanan)
- Atau tambahkan menu "..." (more) di BottomNav yang membuka sheet berisi Settings + Logout

---

### 5. Input Field Auto-Zoom di iOS Safari
**File:** `src/app/globals.css` dan semua form  
**Masalah:** Semua input menggunakan `text-sm` = 14px. iOS Safari **auto-zoom** halaman ketika user tap input dengan font-size < 16px. Ini sangat mengganggu pengalaman PWA karena layar tiba-tiba zoom in dan tidak kembali otomatis.

**Fix yang diperlukan — global CSS:**
```css
/* src/app/globals.css */
@layer base {
  input, select, textarea {
    font-size: 16px; /* Prevent iOS auto-zoom */
  }
}
```
Atau per-komponen tambahkan `text-base` (`16px`) pada semua elemen form.

---

### 6. Manifest Tidak Punya Maskable Icon
**File:** `public/manifest.json`  
**Masalah:** Ikon di Android tanpa `"purpose": "maskable"` akan tampil dengan padding putih besar di dalam lingkaran/kotak — terlihat tidak profesional.

**Kode saat ini:**
```json
{ "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" }
```
**Fix yang diperlukan:**
```json
{ "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
{ "src": "/icons/icon-192x192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" }
```
Maskable icon perlu dibuat dengan safe zone 40% padding di tepi (gunakan maskable.app untuk generate).

---

## ⚠️ Masalah Sedang (Sebaiknya Diperbaiki)

### 7. Tidak Ada Drag Handle di Bottom Sheet Modal
**File:** `src/components/ui/ModalWrapper.tsx`  
**Masalah:** Bottom sheet modal tidak memiliki drag handle bar di bagian atas. Pengguna mobile tidak mendapat visual affordance bahwa modal bisa di-swipe ke bawah untuk tutup. Ini adalah konvensi standar mobile (iOS dan Android).

**Fix yang diperlukan:** Tambahkan handle di dalam ModalWrapper:
```tsx
{/* Drag handle — mobile only */}
<div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
  <div className="w-10 h-1 bg-gray-300 rounded-full" />
</div>
```

---

### 8. Touch Target Terlalu Kecil
**Masalah:** Beberapa tombol aksi memiliki touch target di bawah standar minimum 44×44px (Apple HIG) / 48×48px (Material Design):
- Tombol X hapus di Settings: icon 14px + `p-1` = ~22px
- Action buttons di tabel desktop (icon 14-15px + `p-1.5`)

**Standar minimum yang diperlukan:** Semua tombol interaktif minimal `min-w-[44px] min-h-[44px]` atau `p-2.5` dengan icon 20px.

---

### 9. Tidak Ada Skeleton Loading State
**Masalah:** Navigasi antar halaman tidak ada loading skeleton. Ketika koneksi lambat, halaman terlihat kosong sebelum data muncul. Ini merusak persepsi performa PWA.

**Fix yang diperlukan:** Buat `loading.tsx` di setiap route folder dengan skeleton placeholder:
```
src/app/(app)/orders/loading.tsx
src/app/(app)/products/loading.tsx
src/app/(app)/dashboard/loading.tsx
```

---

### 10. BottomNav Tidak Ada Swipe Gesture untuk Tutup Modal
**File:** `src/components/ui/ModalWrapper.tsx`  
**Masalah:** Bottom sheet tidak bisa di-swipe ke bawah untuk tutup — hanya bisa via tap backdrop atau tombol X. Native apps selalu support swipe-down-to-dismiss.

---

## 🟡 Polish / Nice-to-Have

### 11. Tidak Ada Haptic Feedback
Aksi penting (simpan, hapus, bayar) tidak ada haptic feedback. Di PWA bisa menggunakan `navigator.vibrate()` secara ringan (1-10ms) untuk konfirmasi aksi.

### 12. Tidak Ada Pull-to-Refresh
`overscroll-behavior-y: none` sudah di-set di globals.css (mencegah browser pull-to-refresh). Namun tidak ada pengganti berupa custom pull-to-refresh. Pengguna tidak bisa refresh data tanpa navigate away.

### 13. Offline Fallback Page
Perlu dipastikan service worker menyajikan halaman fallback yang informatif (bukan error default browser) saat offline dan user navigasi ke halaman yang belum di-cache.

### 14. Status Bar Style iOS
`apple-mobile-web-app-status-bar-style: default` membuat status bar putih. Untuk PWA dengan header gelap/orange, `black-translucent` lebih immersive (tapi perlu handle safe-area-inset-top di header).

---

## Prioritas Implementasi

| Prioritas | Item | File yang Diubah | Estimasi |
|-----------|------|-----------------|---------|
| 🔴 P1 | Safe area BottomNav | `BottomNav.tsx` | 5 menit |
| 🔴 P1 | Safe area main padding | `(app)/layout.tsx` | 2 menit |
| 🔴 P1 | Logout + Settings mobile | `BottomNav.tsx` | 30 menit |
| 🔴 P1 | Input font-size 16px (iOS zoom) | `globals.css` | 5 menit |
| 🟠 P2 | Maskable icon manifest | `manifest.json` + assets | 20 menit |
| 🟠 P2 | Drag handle bottom sheet | `ModalWrapper.tsx` | 5 menit |
| 🟠 P2 | Touch target minimum 44px | Beberapa komponen | 20 menit |
| 🟡 P3 | Skeleton loading state | `loading.tsx` per route | 45 menit |
| 🟡 P3 | Swipe-to-dismiss modal | `ModalWrapper.tsx` | 30 menit |
| 🟡 P3 | Pull-to-refresh | Custom hook | 30 menit |

---

## Catatan Teknis untuk Implementasi

### Safe Area Tailwind
Install plugin: `npm install tailwindcss-safe-area`  
Tambahkan di `tailwind.config.ts`:
```ts
plugins: [require('tailwindcss-safe-area')]
```
Lalu gunakan class: `pb-safe`, `pt-safe`, `px-safe`

### iOS Input Zoom Fix — Global
```css
/* globals.css — dalam @layer base */
input:not([type='checkbox']):not([type='radio']),
select,
textarea {
  font-size: max(16px, 1em);
}
```

### Maskable Icon Generator
Gunakan: https://maskable.app/editor  
Upload icon asli → export dengan safe zone → simpan sebagai `icon-192x192-maskable.png`

---

## File Kunci yang Perlu Diubah (Mobile)

```
src/
  app/
    (app)/
      layout.tsx              ← Safe area padding main
    globals.css               ← Input font-size fix
  components/
    layout/
      BottomNav.tsx           ← Safe area + logout + settings
    ui/
      ModalWrapper.tsx        ← Drag handle + swipe gesture
public/
  manifest.json              ← Maskable icon purpose
```

---

---

# Review Desktop UI/UX

**Scope:** Tampilan layar ≥768px (md breakpoint ke atas)

---

## ✅ Yang Sudah Baik (Desktop)

| Aspek | Detail |
|-------|--------|
| Sidebar sticky | `sticky top-0 h-screen` — tidak ikut scroll ✓ |
| Nav active state | `bg-orange-50 text-orange-600` highlight ✓ |
| User info di bawah sidebar | Role badge + username + tombol logout ✓ |
| Responsive table | Tabel muncul di md+, card di mobile ✓ |
| Modal dialog | Centered di desktop dengan scale animation ✓ |
| Content max-width | Mencegah konten terlalu lebar di layar besar ✓ |
| Export buttons | PDF + Excel di halaman laporan ✓ |
| Pagination | Ada di tabel pesanan ✓ |
| Hover state tabel | `hover:bg-gray-50/50` per baris ✓ |
| Print CSS | `print:hidden` untuk elemen non-print ✓ |

---

## ❌ Masalah Kritis (Desktop)

### 1. Emoji 💳 di Tabel Pesanan — Inkonsisten
**File:** `src/app/(app)/orders/OrdersClient.tsx` baris 271  
**Masalah:** Tombol aksi pembayaran di kolom action tabel menggunakan emoji `💳` sementara semua tombol lain menggunakan Lucide icon. Emoji tidak konsisten lintas platform (berbeda di Windows, Mac, Android) dan tidak bisa di-styling dengan CSS.

**Kode saat ini:**
```tsx
<button onClick={() => setPaymentOrder(order)} ...>💳</button>
```
**Fix yang diperlukan:**
```tsx
import { CreditCard } from 'lucide-react'
// ...
<button onClick={() => setPaymentOrder(order)} title="Pembayaran" ...>
  <CreditCard size={14} />
</button>
```

---

### 2. Settings Bisa Diakses Semua Role — Termasuk Kasir
**File:** `src/components/layout/Sidebar.tsx` baris 26  
**Masalah:** Item Settings di Sidebar tidak punya permission check (`permission: null`), sehingga kasir bisa mengakses dan mengubah kategori produk, metode pembayaran, dan info bisnis. Ini bukan bug UI tapi security/UX gap serius.

**Kode saat ini:**
```ts
{ href: '/settings', label: 'Pengaturan', icon: Settings, permission: null },
```
**Fix yang diperlukan:**
```ts
{ href: '/settings', label: 'Pengaturan', icon: Settings, permission: 'canManageProducts' },
// atau buat permission khusus 'canAccessSettings'
```

---

### 3. Tidak Ada Breadcrumb di Halaman Detail
**File:** `src/app/(app)/reports/session/[id]/SessionReportClient.tsx`  
**Masalah:** Halaman detail laporan sesi hanya punya link "← Kembali" tanpa breadcrumb. User tidak tahu posisi mereka dalam hierarki navigasi. Untuk multi-level page (Laporan → Nama Sesi), breadcrumb adalah standar UX desktop.

**Fix yang diperlukan:**
```tsx
{/* Breadcrumb */}
<nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
  <Link href="/reports" className="hover:text-gray-900">Laporan</Link>
  <ChevronRight size={14} />
  <span className="text-gray-900 font-medium">{session.name}</span>
</nav>
```

---

### 4. Sidebar Terlalu Lebar di Layar Medium (768px–1024px)
**File:** `src/components/layout/Sidebar.tsx`  
**Masalah:** Sidebar fixed `w-60` (240px). Di layar 768px, sidebar mengambil 31% lebar layar, menyisakan hanya 528px untuk konten. Tabel pesanan dengan 7 kolom akan sangat sempit dan bisa overflow.

**Fix yang diperlukan:** Perkecil sidebar di breakpoint md:
```tsx
// Sidebar: w-52 di md, w-60 di lg
<aside className="hidden md:flex flex-col md:w-52 lg:w-60 ...">
```
Atau implementasi collapsible sidebar dengan icon-only mode di breakpoint md.

---

## ⚠️ Masalah Sedang (Desktop)

### 5. Tidak Ada Page Header / Topbar yang Konsisten
**Masalah:** Setiap halaman hanya punya `<h1>` dengan padding `p-4 md:p-6` langsung di konten. Tidak ada header bar konsisten yang menampilkan nama halaman, breadcrumb, atau kontrol global (search, user avatar). Aplikasi business-grade biasanya punya topbar.

**Dampak:** User tidak ada reference point visual yang konsisten saat berpindah halaman.

---

### 6. Qty Stepper Button Terlalu Kecil di OrderForm
**File:** `src/app/(app)/orders/OrderForm.tsx` baris 263–270  
**Masalah:** Tombol `+` dan `-` di cart menggunakan `w-6 h-6` (24px). Bahkan di desktop, ukuran ini terlalu kecil untuk diklik dengan nyaman. Standar minimal desktop adalah 32px.

**Fix yang diperlukan:**
```tsx
<button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg">
  <Minus size={14} />
</button>
```

---

### 7. Inkonsistensi Content Max-Width Antar Halaman
**Masalah:** Setiap halaman punya `max-w-*` berbeda tanpa pola yang jelas:

| Halaman | Max Width |
|---------|-----------|
| Dashboard | `max-w-5xl` (1024px) |
| Pesanan | `max-w-6xl` (1152px) |
| Produk | `max-w-5xl` (1024px) |
| Sesi PO | `max-w-3xl` (768px) |
| Laporan | `max-w-3xl` (768px) |
| Detail Laporan | `max-w-4xl` (896px) |
| Settings | `max-w-2xl` (672px) |

**Fix yang diperlukan:** Standardisasi ke 2-3 ukuran saja:
- `max-w-2xl` / `max-w-3xl` untuk halaman form/list sederhana
- `max-w-5xl` untuk halaman dengan tabel banyak kolom
- `max-w-6xl` khusus untuk pesanan (banyak kolom)

---

### 8. Kolom Aksi Tabel Terlalu Padat
**File:** `src/app/(app)/orders/OrdersClient.tsx`  
**Masalah:** Kolom terakhir tabel pesanan berisi 4 tombol icon kecil berderet (`p-1.5`, icon 14px). Di layar kecil ini susah dibedakan dan di-klik. Tidak ada label atau tooltip yang muncul saat hover (kecuali title attribute yang lambat).

**Rekomendasi:** Gunakan tooltip yang muncul lebih cepat, atau ganti dengan dropdown "..." menu untuk aksi sekunder (Edit, Hapus), sisakan aksi primer (Bayar, Struk) sebagai tombol terlihat.

---

### 9. Tidak Ada Empty State yang Informatif
**Masalah:** Saat data kosong, semua halaman hanya menampilkan teks plain:
- `"Tidak ada pesanan"` — teks abu-abu kecil di tengah
- `"Belum ada sesi PO"` — sama
- `"Tidak ada produk"` — sama

**Standar UX:** Empty state yang baik harus punya: ilustrasi/icon besar, teks penjelasan, dan **call-to-action button** (misal: tombol "Buat Pesanan Pertama").

---

### 10. Sidebar Logo Menggunakan Emoji
**File:** `src/components/layout/Sidebar.tsx` baris 47  
**Masalah:** Logo menggunakan emoji `🥙` yang rendernya berbeda di setiap platform (Windows, macOS, Android, iOS). Di lingkungan bisnis/enterprise, logo harus SVG atau PNG yang konsisten.

**Fix yang diperlukan:** Ganti dengan SVG icon atau file `logo.svg` di `/public`.

---

### 11. Export Button di Laporan Sesi Bermasalah di Mobile
**File:** `src/app/(app)/reports/session/[id]/SessionReportClient.tsx` baris 173-201  
**Masalah:** Header section berisi `flex items-center justify-between` dengan 4 tombol (PDF, Excel, Print, Kembali). Di layar <640px, tombol-tombol ini saling bertumpuk atau overflow.

**Fix yang diperlukan:**
```tsx
<div className="flex flex-wrap gap-2 mb-6 print:hidden">
  <Link href="/reports" ...>← Kembali</Link>
  <div className="ml-auto flex flex-wrap gap-2">
    {/* export buttons */}
  </div>
</div>
```

---

## 🟡 Polish / Nice-to-Have (Desktop)

### 12. Sidebar Active Item Tidak Punya Left Border Accent
Banyak admin dashboard modern menambahkan border kiri berwarna pada item aktif untuk indikator visual yang lebih kuat:
```tsx
isActive ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500 pl-[10px]' : '...'
```

### 13. Tidak Ada Keyboard Shortcut
Untuk operator yang intensif menggunakan keyboard, shortcut seperti `N` untuk pesanan baru, `/` untuk search, `Esc` untuk tutup modal akan meningkatkan produktivitas signifikan.

### 14. Tidak Ada Focus Visible Style pada Tombol
Semua `<button>` tidak punya `:focus-visible` ring yang jelas. Ini masalah aksesibilitas (WCAG AA). Input sudah ada `focus:ring-2 focus:ring-orange-400` tapi tombol belum.

**Fix global di `globals.css`:**
```css
@layer base {
  button:focus-visible {
    outline: 2px solid #f97316;
    outline-offset: 2px;
  }
}
```

### 15. Tabel Tidak Bisa Di-sort
Kolom tabel pesanan dan produk tidak bisa di-klik untuk sorting. Untuk data banyak, ini mengurangi efisiensi operator desktop.

---

## Prioritas Implementasi Desktop

| Prioritas | Item | File yang Diubah | Estimasi |
|-----------|------|-----------------|---------|
| 🔴 P1 | Ganti emoji 💳 dengan CreditCard icon | `OrdersClient.tsx` | 5 menit |
| 🔴 P1 | Permission check Settings di Sidebar | `Sidebar.tsx` | 5 menit |
| 🟠 P2 | Tambah breadcrumb halaman detail laporan | `SessionReportClient.tsx` | 15 menit |
| 🟠 P2 | Fix export buttons di mobile (laporan) | `SessionReportClient.tsx` | 10 menit |
| 🟠 P2 | Perbesar qty stepper button di OrderForm | `OrderForm.tsx` | 5 menit |
| 🟠 P2 | Standardisasi max-width antar halaman | Semua page clients | 20 menit |
| 🟡 P3 | Sidebar left border accent saat aktif | `Sidebar.tsx` | 5 menit |
| 🟡 P3 | Empty state dengan CTA button | Semua halaman | 30 menit |
| 🟡 P3 | Focus visible style global | `globals.css` | 5 menit |
| 🟡 P3 | Perkecil sidebar di breakpoint md | `Sidebar.tsx` | 15 menit |
| 🟡 P3 | Ganti emoji logo dengan SVG | `Sidebar.tsx` | 20 menit |

---

## File Kunci yang Perlu Diubah (Desktop)

```
src/
  app/
    (app)/
      orders/
        OrdersClient.tsx        ← Ganti emoji 💳 dengan CreditCard icon
      reports/session/[id]/
        SessionReportClient.tsx ← Breadcrumb + fix export buttons
    globals.css                 ← Focus visible style global
  components/
    layout/
      Sidebar.tsx               ← Permission Settings + border accent + responsive width
```

---

## Ringkasan Keseluruhan (Mobile + Desktop)

| Kategori | Jumlah Isu | Kritis | Sedang | Polish |
|----------|-----------|--------|--------|--------|
| Mobile / PWA | 14 isu | 6 | 4 | 4 |
| Desktop | 15 isu | 2 | 7 | 6 |
| **Total** | **29 isu** | **8** | **11** | **10** |

**Skor UI/UX saat ini:** 6.5/10  
**Target setelah perbaikan:** 8.5/10

**Perbaikan yang paling berdampak besar (quick wins):**
1. Safe area iPhone (5 menit, dampak besar di mobile)
2. Input font-size 16px iOS (5 menit, hilangkan auto-zoom)
3. Ganti emoji 💳 dengan icon (5 menit)
4. Permission Settings untuk kasir (5 menit)
5. Logout mobile (30 menit, fungsi kritis hilang)
