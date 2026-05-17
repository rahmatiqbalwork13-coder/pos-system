# Laporan QA Review — Sistem Open PO
**Tanggal:** 17 Mei 2026  
**Reviewer:** Senior QA + UI/UX/CX Professional  
**Stack:** Next.js 16, Supabase, Tailwind CSS, Radix UI  
**Platform:** Web App (PWA-enabled), Mobile-responsive

---

## Ringkasan Eksekutif

Aplikasi ini adalah sistem manajemen Open PO untuk bisnis makanan (Kebab, Roti Maryam, Donat). Secara keseluruhan, aplikasi **sudah layak pakai** dan memiliki fitur inti yang solid. Namun ditemukan beberapa **bug fungsional**, **celah keamanan/data integrity**, dan sejumlah **peluang peningkatan UX** yang perlu ditangani sebelum scaling ke lebih banyak pengguna.

---

## Bagian 1: QA Testing — Bug & Temuan Teknis

### 🔴 KRITIS (Harus Diperbaiki Segera)

---

#### BUG-001 — PaymentModal: Loading State Tidak Pernah Di-reset
**File:** `src/app/(app)/orders/PaymentModal.tsx:30-45`  
**Deskripsi:** Fungsi `handleSave()` memanggil `setLoading(true)` tapi tidak ada `finally { setLoading(false) }`. Jika database request gagal, tombol "Simpan Pembayaran" menjadi disabled selamanya. User terjebak dan harus close modal.  
**Reproduksi:** Matikan internet → buka Payment Modal → klik Simpan Pembayaran → request gagal → tombol tetap disabled.  
**Dampak:** User tidak dapat menyimpan pembayaran tanpa menutup modal.

**Perbaikan:**
```typescript
async function handleSave() {
  setLoading(true)
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .update({ ... })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single()
    if (error) throw error
    if (data) onUpdated(data as OrderWithItems)
  } catch (err) {
    // tampilkan error ke user
  } finally {
    setLoading(false)
  }
}
```

---

#### BUG-002 — Conditional Hook Call di Sidebar (Pelanggaran React Rules of Hooks)
**File:** `src/components/layout/Sidebar.tsx:105`  
**Deskripsi:** `const hasAccess = permission ? usePermission(permission as any) : true` — hook `usePermission` dipanggil secara kondisional di dalam ternary. Ini melanggar React Rules of Hooks (*don't call hooks inside conditions*). Ini bisa menyebabkan bug runtime yang sulit di-debug.

**Perbaikan:**
```typescript
function NavItem({ href, label, icon: Icon, permission, isActive }) {
  const hasAccess = usePermission((permission as any) ?? 'canManageOrders')
  if (permission && !hasAccess) return null
  // ...
}
```
Atau lebih baik: pisahkan komponen atau gunakan null check di luar hook.

---

#### BUG-003 — OrderForm Edit: Data Loss Risk saat Update
**File:** `src/app/(app)/orders/OrderForm.tsx:101-126`  
**Deskripsi:** Saat edit order, semua `order_items` dihapus dulu (`delete().eq('order_id', order.id)`) lalu di-insert ulang. Jika insert gagal setelah delete berhasil, data order_items **hilang permanen**. Tidak ada transaksi/rollback.  
**Dampak:** Order tersimpan tapi semua item pesanan hilang.

**Perbaikan:** Gunakan Supabase transactions atau upsert, atau minimal periksa error sebelum delete.

---

#### BUG-004 — handleDelete (Orders & Products) Tidak Cek Error DB
**File:** `src/app/(app)/orders/OrdersClient.tsx:83-85` | `src/app/(app)/products/ProductsClient.tsx:33-36`

```typescript
async function handleDelete(id: string) {
  if (!confirm('Hapus pesanan ini?')) return
  await supabase.from('orders').delete().eq('id', id)  // ← error diabaikan
  setOrders(prev => prev.filter(o => o.id !== id))     // ← state berubah meski DB gagal
}
```

**Dampak:** Jika Supabase mengembalikan error (RLS violation, network error), item dihapus dari UI tapi masih ada di database. UI dan DB tidak sinkron.

---

### 🟠 MAJOR (Harus Diperbaiki Sebelum Production)

---

#### BUG-005 — Dashboard: Total Omzet Tidak Berubah Saat Toggle "Semua"
**File:** `src/app/(app)/dashboard/DashboardClient.tsx:36`  
**Deskripsi:** `const totalRevenue = activeOrders.reduce(...)` — selalu menggunakan `activeOrders` meskipun user beralih ke view "Semua". Stat card "Total Omzet" menampilkan data yang salah ketika view = `'all'`.

**Perbaikan:** Ganti menjadi `displayOrders.reduce(...)`.

---

#### BUG-006 — Session Report: Kolom "Laba" di Baris Total Salah
**File:** `src/app/(app)/reports/session/[id]/SessionReportClient.tsx:287-288`  
**Deskripsi:** Baris total pada tabel Product Breakdown menampilkan `formatCurrency(grossProfit + sellerDeliveryCost)` untuk kolom Laba, bukan `formatCurrency(grossProfit)`. Ini menampilkan laba sebelum biaya kirim dikurangi, inkonsisten dengan summary card "Laba Kotor" yang sudah mengurangi biaya kirim.

---

#### BUG-007 — Tidak Ada Validasi Format Nomor Telepon
**File:** `src/app/(app)/orders/OrderForm.tsx:188-195`  
**Deskripsi:** Input `customer_phone` bertipe `tel` tapi tidak ada validasi format. User bisa memasukkan nomor tidak valid (contoh: "abc", "12345", atau format tidak konsisten). Ini juga mempengaruhi fitur "Kirim WA" di ReceiptModal yang langsung menggunakan nilai `customer_phone` untuk membuka `wa.me/` link.

---

#### BUG-008 — SessionForm: Tidak Validasi closeDate > openDate
**File:** `src/app/(app)/sessions/SessionForm.tsx:26-37`  
**Deskripsi:** User bisa membuat sesi dengan tanggal tutup sebelum tanggal buka. Tidak ada validasi perbandingan tanggal.

---

#### BUG-009 — categoryLabel() Hardcoded, Tidak Sinkron dengan Kategori Dinamis
**File:** `src/lib/utils.ts:32-39`  
**Deskripsi:** Fungsi `categoryLabel()` memiliki map hardcoded untuk `kebab`, `roti_maryam`, `donat`. Namun kategori bisa ditambahkan secara dinamis melalui halaman Settings. Kategori baru yang ditambahkan user akan menampilkan slug mentah (`nama_kategori`) bukan nama yang readable di seluruh aplikasi (Products table, Orders table, etc).

---

#### BUG-010 — Tombol "Download PDF" di ReceiptModal Hanya Buka Print Dialog
**File:** `src/app/(app)/orders/ReceiptModal.tsx:115-119`  
**Deskripsi:** `handleDownloadPDF()` langsung memanggil `handlePrint()`. Tombol berlabel "PDF" tapi fungsinya adalah Print. Menyesatkan user; library `jsPDF` dan `html2canvas` sudah ada di project tapi tidak digunakan di sini.

---

### 🟡 MINOR

---

#### BUG-011 — handleToggleActive & handleQuickStatusChange Tanpa Loading State
**File:** `ProductsClient.tsx:39-47` | `OrdersClient.tsx:88-96`  
**Deskripsi:** Tidak ada loading indicator saat toggle aktif/nonaktif atau ubah status pembayaran. User bisa klik berulang kali dan memicu multiple concurrent requests.

---

#### BUG-012 — Sidebar filteredNavItems Selalu Mengembalikan true
**File:** `src/components/layout/Sidebar.tsx:40-44`  
**Deskripsi:** Logic filter di `filteredNavItems` selalu return `true` terlepas dari permission. Permission check sebenarnya dilakukan di dalam `NavItem` component. Kode filter ini tidak berguna dan membingungkan.

---

#### BUG-013 — `proof_url` Field Ada di DB Schema Tapi Tidak Diimplementasikan di UI
**File:** `src/lib/supabase/database.types.ts:136`  
**Deskripsi:** Field `proof_url` (untuk foto bukti transfer) ada di schema database tapi tidak ada UI untuk upload/display. Ini menunjukkan fitur yang belum selesai.

---

#### BUG-014 — Tidak Ada Protection terhadap Double Submission
**File:** `OrderForm.tsx`, `SessionForm.tsx`  
**Deskripsi:** Ada `loading` state tapi button tidak di-disable segera. Jika user klik tombol submit sangat cepat sebelum state update (React batching), bisa terjadi double submission.

---

## Bagian 2: UI/UX Review

### Temuan Positif ✅
- Desain bersih dengan palet warna oranye yang konsisten dan brand-friendly
- Responsive design baik: desktop table + mobile card pattern yang tepat
- FAB (Floating Action Button) untuk mobile — memudahkan aksi primer
- Bottom sheet modal (dari bawah di mobile, center di desktop) — pattern UX mobile yang benar
- Progress bar status pembayaran di Dashboard — informatif
- Quick status change langsung dari tabel — efisiensi tinggi

---

### Area Peningkatan UX

#### UX-001 — Tidak Ada Search di Halaman Produk
**Prioritas: Tinggi**  
Halaman Produk hanya memiliki filter kategori dan status. Saat produk sudah banyak (50+), tidak ada cara untuk mencari produk berdasarkan nama. Bandingkan dengan halaman Pesanan yang sudah memiliki search bar.

**Rekomendasi:** Tambahkan search input di atas filter kategori.

---

#### UX-002 — Tidak Ada Feedback Visual Setelah Aksi Berhasil (Toast Notification)
**Prioritas: Tinggi**  
Saat menyimpan order, produk, session, atau pembayaran — tidak ada notifikasi sukses. User harus "menebak" apakah aksi berhasil (form menutup = berhasil).

**Rekomendasi:** Implementasikan toast/snackbar notification. Radix UI `@radix-ui/react-toast` sudah tersedia di project.

---

#### UX-003 — Konfirmasi Hapus Menggunakan `window.confirm()` Browser Native
**Prioritas: Medium**  
Dialog konfirmasi hapus menggunakan `confirm()` bawaan browser yang tidak bisa dikustomisasi. Di mobile, tampilannya buruk dan tidak bisa di-style.

**Rekomendasi:** Gunakan `@radix-ui/react-alert-dialog` yang sudah terinstall untuk konfirmasi hapus yang lebih baik.

---

#### UX-004 — Filter di Halaman Orders: Inkonsistensi Pola
**Prioritas: Medium**  
Filter "Sesi" menggunakan `<select>` dropdown, sedangkan filter "Status Bayar" menggunakan toggle buttons. Pola yang berbeda untuk fungsi yang serupa membingungkan.

**Rekomendasi:** Unifikasi ke satu pola — semua toggle pills atau semua dropdown (untuk mobile, toggle pills lebih baik).

---

#### UX-005 — Login Page: Tidak Ada Show/Hide Password & Forgot Password
**Prioritas: Medium**  
- Tidak ada toggle show/hide password — umum dan diharapkan di semua form login
- Tidak ada link "Lupa Password" — tapi mungkin by-design karena ini sistem internal

---

#### UX-006 — Quick Links Dashboard Menggunakan Emoji, Inkonsisten dengan Ikon Lucide
**Prioritas: Low**  
Section Quick Links di Dashboard menggunakan emoji (📝🛍️📅📊) sedangkan semua bagian lain menggunakan Lucide icons. Ini menciptakan inkonsistensi visual.

---

#### UX-007 — Workflow Status Sesi Tidak Jelas
**Prioritas: Medium**  
Sesi memiliki status: `draft → active → closed → done` tapi tidak ada visual workflow indicator. User tidak tahu urutan status atau apa yang terjadi saat transisi antar status.

**Rekomendasi:** Tambahkan stepper atau badge dengan tooltip yang menjelaskan masing-masing status.

---

#### UX-008 — Tidak Ada Empty State Illustration
**Prioritas: Low**  
Ketika tidak ada data (pesanan kosong, produk kosong), hanya tampil teks "Tidak ada pesanan". Empty state dengan ilustrasi dan CTA (tombol tambah) jauh lebih baik.

---

#### UX-009 — Pagination Default 10 Item, Tidak Adjustable
**Prioritas: Low**  
ITEMS_PER_PAGE di-hardcode ke 10 tanpa opsi untuk mengubahnya. User dengan banyak pesanan mungkin prefer melihat 25 atau 50 per halaman.

---

#### UX-010 — Tidak Ada Sorting di Tabel Orders & Products
**Prioritas: Medium**  
Tabel tidak bisa di-sort berdasarkan kolom (total, nama, tanggal). Di halaman Orders ini krusial karena user mungkin ingin sort berdasarkan "belum bayar" atau "total terbesar".

---

## Bagian 3: CX (Customer Experience) Review

### Konteks Pengguna
Aplikasi ini digunakan oleh **operator Open PO** (owner, admin, kasir) — bukan konsumen langsung. CX di sini adalah pengalaman operator saat menggunakan aplikasi untuk melayani pembeli.

---

### Temuan Positif ✅

**CX-PLUS-001 — Integrasi WhatsApp Sangat Relevan untuk Pasar Indonesia**  
Fitur kirim struk langsung ke WA customer adalah keunggulan nyata. Sangat relevan dengan ekosistem bisnis Indonesia yang WhatsApp-centric.

**CX-PLUS-002 — Dual Format Struk (Thermal + A4) Profesional**  
Support printer thermal 80mm dan invoice A4 menunjukkan pemahaman kebutuhan bisnis UKM. Implementasinya bagus.

**CX-PLUS-003 — Copy Text Struk (Format WhatsApp-friendly)**  
Fitur copy text dengan format WA (bold, emoji) sangat praktis untuk bisnis yang mengirim konfirmasi manual.

**CX-PLUS-004 — Masking Nomor HP untuk Privasi**  
Nomor HP customer di-mask di list orders. Ini menunjukkan perhatian terhadap privasi data.

**CX-PLUS-005 — Role-Based Access Control**  
Sistem permission owner/admin/kasir yang terstruktur baik. Kasir tidak bisa lihat profit — ini keputusan bisnis yang tepat.

---

### Area Peningkatan CX

#### CX-001 — Nama Bisnis Tidak Bisa Dikustomisasi
**Prioritas: Tinggi**  
Halaman login hardcode subtitle "Kebab · Roti Maryam · Donat" di kode. Jika sistem ini digunakan oleh bisnis lain, branding tidak bisa disesuaikan tanpa edit kode. Nama bisnis juga digunakan di struk/receipt.

**Rekomendasi:** Tambahkan field "Nama Bisnis" dan "Deskripsi Bisnis" di halaman Settings, simpan di tabel `settings`.

---

#### CX-002 — Tidak Ada Fitur Undo Untuk Hapus
**Prioritas: Medium**  
Delete order atau produk bersifat permanen. Tidak ada soft-delete atau undo. Untuk bisnis, penghapusan tidak sengaja bisa berdampak serius.

**Rekomendasi:** Implementasikan soft-delete (field `deleted_at`) atau minimal undo window 5 detik (snackbar dengan tombol "Batalkan").

---

#### CX-003 — Tidak Ada Notifikasi/Alert Saat Sesi Akan Expired
**Prioritas: Medium**  
Dashboard menampilkan tanggal tutup sesi, tapi tidak ada peringatan visual jika sesi hampir expired (misalnya dalam 1 hari). Operator mungkin lupa menutup sesi tepat waktu.

**Rekomendasi:** Badge "Tutup Besok" atau "Tutup Hari Ini" dengan warna merah pada banner sesi aktif.

---

#### CX-004 — Tidak Ada Histori Aktivitas / Audit Log
**Prioritas: Medium**  
Tidak ada log siapa yang mengubah apa dan kapan. Jika ada selisih data atau konflik antara kasir dan admin, tidak ada cara untuk melacak.

---

#### CX-005 — Report Hanya Menghitung Pesanan LUNAS untuk Profit
**Prioritas: Informasi**  
Laporan sesi hanya menghitung profit dari pesanan berstatus `paid`. Ini **keputusan bisnis yang benar** (akrual basis), tapi perlu ditampilkan dengan jelas di UI bahwa angka profit hanya mencerminkan yang sudah lunas. Saat ini label kecil "Berdasarkan pesanan lunas" sudah ada — bagus, tapi bisa lebih prominent.

---

#### CX-006 — Tidak Ada Export dari Halaman Laporan Utama
**Prioritas: Low**  
Export (PDF/Excel) hanya tersedia di halaman detail sesi, bukan di halaman laporan utama yang menampilkan semua sesi. Owner mungkin ingin export rekap semua sesi.

---

#### CX-007 — Info Bisnis di Struk Sangat Minimal
**Prioritas: Medium**  
Struk hanya menampilkan nama bisnis. Tidak ada alamat, nomor WA bisnis, atau rekening bank. Untuk bisnis Open PO, info rekening di struk sangat penting agar customer tahu kemana transfer.

**Rekomendasi:** Tambahkan field di Settings: alamat, nomor WA toko, info rekening, pesan penutup struk.

---

## Bagian 4: Keamanan

#### SEC-001 — Email Authentication yang Tidak Lazim
**File:** `src/app/login/page.tsx:19`  
```typescript
const email = `${username.trim().toLowerCase()}@po-system.local`
```
Login menggunakan username yang di-transform menjadi email palsu (`username@po-system.local`). Ini adalah workaround untuk menggunakan Supabase auth yang berbasis email. Secara teknis berfungsi, tapi:
- Username "john" akan menjadi `john@po-system.local` 
- Jika ada user dengan nama sama (berbeda kapitalisasi), bisa conflict
- Domain `.local` bisa overlap dengan reserved DNS

**Catatan:** Tidak ada risiko keamanan langsung, tapi pattern ini tidak ideal untuk sistem yang akan berkembang.

---

#### SEC-002 — Tidak Ada Rate Limiting di Login
**Deskripsi:** Tidak ada proteksi brute-force di UI. Supabase sendiri memiliki rate limiting bawaan, tapi tidak ada feedback di UI jika user terkena rate limit.

---

## Ringkasan Prioritas

| ID | Kategori | Severity | Effort |
|----|----------|----------|--------|
| BUG-001 | Loading state PaymentModal | 🔴 Kritis | Rendah |
| BUG-002 | Conditional Hook Sidebar | 🔴 Kritis | Rendah |
| BUG-003 | Data loss saat edit order | 🔴 Kritis | Tinggi |
| BUG-004 | Delete tidak cek error | 🟠 Major | Rendah |
| BUG-005 | Dashboard revenue bug | 🟠 Major | Sangat Rendah |
| BUG-006 | Report laba kolom salah | 🟠 Major | Sangat Rendah |
| BUG-007 | Validasi nomor HP | 🟠 Major | Rendah |
| BUG-008 | Validasi tanggal sesi | 🟠 Major | Sangat Rendah |
| BUG-009 | categoryLabel hardcoded | 🟠 Major | Medium |
| BUG-010 | Download PDF menyesatkan | 🟡 Minor | Rendah |
| UX-001 | Search produk | 🟠 Major | Rendah |
| UX-002 | Toast notification | 🟠 Major | Rendah |
| UX-003 | Konfirmasi hapus Radix | 🟡 Minor | Rendah |
| CX-001 | Nama bisnis configurable | 🟠 Major | Medium |
| CX-002 | Soft delete / undo | 🟡 Minor | Tinggi |
| CX-007 | Info bisnis di struk | 🟡 Minor | Rendah |

---

## Rekomendasi Prioritas Sprint

### Sprint 1 (Bug Fixes — 1-2 hari)
1. BUG-001: Fix loading state PaymentModal
2. BUG-002: Fix conditional hook Sidebar
3. BUG-005: Fix dashboard revenue calculation
4. BUG-006: Fix report laba kolom total
5. BUG-004: Add error handling to handleDelete
6. BUG-008: Validasi closeDate > openDate di SessionForm

### Sprint 2 (UX Polish — 2-3 hari)
1. UX-002: Implementasi Toast notification (gunakan Radix Toast yang sudah ada)
2. UX-001: Tambah search di Products page
3. UX-003: Ganti `confirm()` dengan Radix AlertDialog
4. BUG-007: Validasi format nomor HP
5. CX-001: Nama bisnis configurable di Settings

### Sprint 3 (Feature Completion — 3-5 hari)
1. BUG-003: Perbaiki edit order dengan safer update pattern
2. BUG-013: Implementasi upload proof_url (foto bukti transfer)
3. CX-007: Tambah info bisnis lengkap di struk
4. UX-010: Column sorting di tabel Orders
5. BUG-010: Implementasi download PDF yang sebenarnya

---

*Laporan ini dibuat berdasarkan analisis statis kode sumber. Testing dinamis (E2E testing dengan data real) direkomendasikan untuk konfirmasi bug-bug di atas.*
