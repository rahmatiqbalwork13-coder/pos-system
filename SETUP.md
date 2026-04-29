# Setup Sistem Open PO

## Langkah 1: Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Copy URL dan anon key dari Settings → API
3. Buka **SQL Editor** dan jalankan isi file `supabase/schema.sql`
4. Jalankan juga file `supabase/seed_users.sql` di SQL Editor untuk membuat akun admin:
   - **admin1** / `farahiqbal@_123`
   - **admin2** / `iqbalfarah@_123`

## Langkah 2: Konfigurasi Environment

Edit file `.env.local` dan isi dengan kredensial Supabase Anda:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
4. Deploy

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
