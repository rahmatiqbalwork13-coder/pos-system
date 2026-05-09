# Setup Sistem Open PO

## Langkah 1: Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Copy URL dan anon key dari Settings → API
3. Buka **SQL Editor** dan jalankan isi file `supabase/schema.sql`
4. Jalankan juga file `supabase/seed_users.sql` di SQL Editor untuk membuat akun admin:
   - **admin1** / `farahiqbal@_123`
   - **admin2** / `iqbalfarah@_123`

## Langkah 2: Konfigurasi Environment

Copy file `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit file `.env.local` dan isi dengan kredensial Anda:

```env
# WAJIB - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OPSIONAL - Google Maps (untuk fitur maps & ongkir otomatis)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Langkah 3: Jalankan Aplikasi

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → login dengan username `admin1` atau `admin2`.

## Langkah 4: Deploy ke Vercel

1. Push ke GitHub
2. Connect repo di [vercel.com](https://vercel.com)
3. Set Environment Variables di Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (opsional)
4. Deploy

---

## Setup PWA (Progressive Web App)

Setelah deploy, aplikasi bisa di-install di HP:

### Android (Chrome)
1. Buka website di Chrome
2. Tap menu (⋮) → "Tambahkan ke layar utama"
3. Icon akan muncul di home screen

### iOS (Safari)
1. Buka website di Safari
2. Tap share (⬆️) → "Tambahkan ke Layar Utama"

### Fitur PWA:
- ✅ Install di home screen
- ✅ Offline mode
- ✅ Background sync
- ✅ Push notifications (siap integrasi)

Dokumentasi lengkap: `PWA_GUIDE.md`

---



## Setup User Roles (RBAC)

Assign role ke user setelah login pertama kali:

```sql
-- Assign sebagai Owner
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_DARI_SUPABASE_AUTH', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Assign sebagai Admin
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_DARI_SUPABASE_AUTH', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Assign sebagai Kasir
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_DARI_SUPABASE_AUTH', 'kasir')
ON CONFLICT (user_id) DO UPDATE SET role = 'kasir';
```

Role tersedia:
- **Owner**: Full access, lihat laba/rugi, manage users
- **Admin**: Manage produk/sesi/pesanan, export (tidak lihat laba)
- **Kasir**: Input/edit pesanan saja

---

## Alur Penggunaan

1. **Buat Produk** → `/products` → Tambah produk dengan harga beli & jual
2. **Buat Sesi PO** → `/sessions` → Buat sesi baru → Aktifkan
3. **Input Pesanan** → `/orders` → Tambah pesanan dengan item & jenis pengiriman
4. **Update Pembayaran** → Di halaman pesanan, klik "Pembayaran" per order
5. **Lihat Laporan** → `/reports` → Pilih sesi → Lihat laba rugi

## Struktur Fitur

| Halaman | URL | Fungsi |
|---|---|---|
| Dashboard | `/dashboard` | Ringkasan sesi aktif & statistik |
| Produk | `/products` | CRUD produk, harga beli/jual, margin, riwayat harga |
| Sesi PO | `/sessions` | Buat & kelola sesi open PO |
| Pesanan | `/orders` | Input & kelola semua pesanan |
| Laporan | `/reports` | Laporan laba rugi per sesi |
| Pengaturan | `/settings` | Setting aplikasi & user |

---

## Troubleshooting

### PWA tidak bisa install
- Pastikan deploy ke HTTPS (Vercel otomatis HTTPS)
- Cek manifest.json valid
- Clear browser cache

### Maps tidak muncul
- Cek API key valid
- Cek billing enabled di Google Cloud
- Cek APIs sudah di-enable

### Error build
- Hapus folder `.next`
- Hapus `node_modules`
- Jalankan `npm install` ulang

---

**Lihat dokumentasi lengkap:**
- `UPDATE_NOTES.md` - Daftar semua fitur
- `PWA_GUIDE.md` - Panduan PWA & Maps
- `INVOICE_PRINT_GUIDE.md` - Panduan cetak invoice
