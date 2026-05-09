# Update Sistem Open PO - Fitur Baru

## 📋 Ringkasan Update

Sistem telah diupdate dengan fitur-fitur berikut:

### 1. ✅ Export PDF/Excel
**Lokasi:** Halaman Pesanan & Laporan

**Fitur:**
- Export daftar pesanan ke PDF dengan format profesional
- Export ke Excel (.xlsx) untuk analisis lebih lanjut
- Tersedia di halaman daftar pesanan dan detail laporan sesi
- Permission-based (hanya Admin dan Owner)

**File yang dibuat:**
- `src/components/export/ExportButtons.tsx`

---

### 2. ✅ Multi-User & Role-Based Access Control (RBAC)
**Tiga Level User:**
- **Owner**: Full access, bisa lihat laba/rugi, export data, manage users
- **Admin**: Bisa manage produk, sesi, pesanan, export data (tidak lihat laba)
- **Kasir**: Hanya input dan edit pesanan (tidak bisa hapus)

**Permission Matrix:**

| Fitur | Owner | Admin | Kasir |
|-------|-------|-------|-------|
| View Reports | ✅ | ✅ | ❌ |
| View Profit/Loss | ✅ | ❌ | ❌ |
| Manage Products | ✅ | ✅ | ❌ |
| Manage Sessions | ✅ | ✅ | ❌ |
| Manage Orders | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ |
| Delete Orders | ✅ | ✅ | ❌ |

**File yang dibuat/modifikasi:**
- `src/lib/supabase/database.types.ts` - Tambah tipe UserRole
- `supabase/schema.sql` - Tambah tabel user_roles
- `supabase/seed_roles.sql` - Script assign roles
- `src/hooks/useAuth.tsx` - Auth Provider & permission hooks
- `src/components/auth/RoleBadge.tsx` - Badge role di sidebar
- `src/components/layout/Sidebar.tsx` - Update dengan permission check

---

### 3. ✅ React Query (TanStack Query)
**Fitur:**
- Caching data otomatis
- Refetching yang efisien
- State management yang lebih baik
- Loading states built-in

**File yang dibuat:**
- `src/components/providers/Providers.tsx` - QueryClient provider
- `src/hooks/useQueries.ts` - Custom hooks untuk data fetching

**Hooks tersedia:**
- `useOrders()` - Fetch orders
- `useOrder(id)` - Fetch single order
- `useCreateOrder()` - Mutation create order
- `useSessions()` - Fetch sessions
- `useActiveSession()` - Fetch active session
- `useProducts()` - Fetch products
- `useDashboardStats()` - Fetch dashboard stats

---

### 4. ✅ Pagination
**Lokasi:** Halaman Pesanan

**Fitur:**
- Pagination dengan 10 item per halaman
- Navigation dengan nomor halaman
- Info "Menampilkan X-Y dari Z data"
- Responsive design

**File yang dibuat:**
- `src/components/pagination/Pagination.tsx`

---

### 5. ✅ Image Optimization
**Fitur:**
- Menggunakan Next.js Image component
- Lazy loading otomatis
- Format WebP/AVIF
- Skeleton loading saat gambar dimuat
- Responsive sizes

**File yang dibuat:**
- `src/components/image/OptimizedImage.tsx`
- `next.config.mjs` - Update image config

---

## 🗄️ Database Schema Update

### Tabel Baru: user_roles
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'kasir')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Setup Role untuk User
1. Jalankan schema update di Supabase SQL Editor
2. Jalankan query untuk assign role ke user:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('<USER_ID>', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

---

## 📦 Dependencies Baru

```json
{
  "@tanstack/react-query": "^5.100.9",
  "jspdf": "^4.2.1",
  "xlsx": "^0.18.5",
  "html2canvas": "^1.4.1"
}
```

---

## 🔧 Konfigurasi

### Next.js Config Update
File: `next.config.mjs`
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
  formats: ['image/webp', 'image/avif'],
}
```

---

## 🚀 Cara Menggunakan

### Export Data
1. Buka halaman Pesanan atau Laporan
2. Klik tombol "Export PDF" atau "Export Excel"
3. File akan otomatis terdownload

### Manage User Roles
1. Query user ID dari Supabase Auth
2. Jalankan SQL untuk assign role di `seed_roles.sql`
3. User akan melihat menu sesuai permission-nya

### Pagination
- Pagination otomatis muncul jika data > 10 item
- Gunakan tombol navigasi atau klik nomor halaman

---

## 📱 Fitur Baru: PWA (Progressive Web App)

### 7. ✅ PWA (Progressive Web App)
**Install aplikasi seperti native di HP Anda!**

**Fitur:**
- ✅ Install di Home Screen (Android/iOS/Desktop)
- ✅ Offline Mode - Bisa akses tanpa internet
- ✅ Background Sync - Auto-sync saat online
- ✅ Push Notifications (siap integrasi)
- ✅ Responsive & Fast

**Cara Install:**
- **Android**: Chrome Menu → "Tambahkan ke layar utama"
- **iOS**: Share → "Tambahkan ke Layar Utama"
- **Desktop**: Icon install di address bar

**File yang dibuat:**
- `public/manifest.json` - PWA manifest
- `public/offline.html` - Offline fallback page
- `public/sw-custom.js` - Service worker
- `src/components/pwa/PWAComponents.tsx` - PWA UI components
- `src/hooks/usePWA.ts` - PWA hooks

**Dokumentasi lengkap:** `PWA_GUIDE.md`

---

## 📊 Quick Stats Update

| Fitur | Status | File |
|-------|--------|------|
| Export PDF/Excel | ✅ | `src/components/export/` |
| RBAC (3 Roles) | ✅ | `src/hooks/useAuth.tsx` |
| React Query | ✅ | `src/hooks/useQueries.ts` |
| Pagination | ✅ | `src/components/pagination/` |
| Image Optimization | ✅ | `src/components/image/` |
| Invoice Print | ✅ | `src/app/(app)/orders/ReceiptModal.tsx` |
| **PWA** | ✅ | `public/manifest.json` |

---

## 📁 File Struktur Update

```
src/
├── components/
│   ├── auth/
│   │   └── RoleBadge.tsx
│   ├── export/
│   │   └── ExportButtons.tsx
│   ├── image/
│   │   └── OptimizedImage.tsx
│   ├── pagination/
│   │   └── Pagination.tsx
│   └── providers/
│       └── Providers.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── useQueries.ts
└── app/
    └── (app)/
        └── orders/
            └── OrdersClient.tsx (updated)

supabase/
├── schema.sql (updated)
└── seed_roles.sql (new)
```

---

---

### 6. ✅ Cetak Struk / Invoice
**Lokasi:** Halaman Pesanan (klik icon Receipt)

**Dua Format Tersedia:**

#### 🖨️ Format Thermal (58mm/80mm)
- Khusus untuk printer thermal
- Font monospace (Courier)
- Border dashed style
- Compact design untuk kertas kecil
- Auto-detect thermal printer settings

#### 📄 Format A4 Letter
- Desain profesional dengan header
- Detail tabel lengkap
- Summary box dengan background
- Cocok untuk invoice resmi
- Bisa download sebagai PDF

**Fitur Tambahan:**
- ✅ Copy text invoice ke clipboard
- ✅ Share via WhatsApp langsung
- ✅ Download PDF dengan jsPDF
- ✅ Print preview sebelum cetak
- ✅ Toggle format Thermal/A4

**File yang dibuat/modifikasi:**
- `src/app/(app)/orders/ReceiptModal.tsx` - Modal struk lengkap (updated)
- `src/components/invoice/InvoicePrint.tsx` - Standalone invoice component
- `INVOICE_PRINT_GUIDE.md` - Dokumentasi lengkap

---

## 📱 Share via WhatsApp

Invoice bisa langsung dikirim ke WhatsApp pelanggan dengan format:
```
🧾 INVOICE - Nama Bisnis
📄 No. Invoice: #ABC12345
📅 Tanggal: 15 Mei 2025

👤 Pelanggan: Budi Santoso
🛒 Item:
• Kebab ×2 = Rp30.000
• Roti Maryam ×3 = Rp30.000

TOTAL: Rp75.000
Status: LUNAS ✅
```

---

## ⚠️ Catatan Penting

1. **Jalankan schema update** di Supabase SQL Editor sebelum deploy
2. **Assign role** ke user yang sudah ada
3. **Test permission** dengan login sebagai different roles
4. **Backup database** sebelum update schema
5. **Setup printer thermal** (jika menggunakan format thermal):
   - Install driver printer
   - Setting paper size ke 58mm/80mm
   - Enable "Print background graphics"

---

## 🐛 Troubleshooting

**Error: Role tidak terdeteksi**
- Pastikan tabel user_roles sudah dibuat
- Pastikan user sudah diassign role
- Clear browser cache dan login ulang

**Error: Export PDF/Excel tidak berfungsi**
- Pastikan dependencies sudah terinstall: `npm install`
- Check browser console untuk error detail

**Error: Image tidak load**
- Pastikan domain Supabase sudah diwhitelist di next.config.mjs
- Check URL image valid

---

**Update Date:** 2025-05-09  
**Version:** 0.2.0
