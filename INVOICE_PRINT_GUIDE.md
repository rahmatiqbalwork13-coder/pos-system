# Fitur Cetak Struk / Invoice

## 📄 Ringkasan Fitur

Sistem sekarang dilengkapi dengan fitur cetak struk/invoice yang lengkap dengan 2 format:

### 1. **Format Thermal (58mm / 80mm)** 🖨️
- Khusus untuk printer thermal (printer struk)
- Ukuran kertas: 58mm atau 80mm
- Font monospace (Courier)
- Desain compact dengan border dashed
- Cocok untuk cetak langsung ke printer thermal

### 2. **Format A4 Letter** 📄
- Format standar surat A4
- Desain profesional dengan header
- Tabel detail yang rapi
- Cocok untuk invoice resmi
- Bisa di-download sebagai PDF

---

## 🎯 Cara Menggunakan

### Dari Halaman Pesanan

1. **Buka halaman Pesanan** (`/orders`)
2. **Klik icon Receipt (🧾)** pada pesanan yang ingin dicetak
3. **Pilih Format:**
   - **Thermal**: Untuk printer struk 58/80mm
   - **A4**: Untuk invoice format surat
4. **Pilih Aksi:**
   - **Cetak**: Print langsung ke printer
   - **Download PDF**: Simpan sebagai file PDF
   - **Kirim WA**: Kirim invoice via WhatsApp
   - **Copy Text**: Copy teks invoice ke clipboard

### Tombol Aksi

| Tombol | Fungsi |
|--------|--------|
| 🖨️ **Cetak** | Print ke printer default |
| 📥 **PDF** | Download file PDF |
| 💬 **Kirim WA** | Buka WhatsApp dengan pesan invoice |
| 📋 **Copy Text** | Copy teks invoice |

---

## 📋 Format Invoice

### Thermal Receipt (58/80mm)

```
╔════════════════════════════════╗
║     NAMA BISNIS ANDA           ║
║       STRUK PEMBAYARAN          ║
╠════════════════════════════════╣
║ No: #ABC12345                  ║
║ Tgl: 15/05/25 14:30            ║
╠════════════════════════════════╣
║ Pelanggan: Budi Santoso        ║
║ HP: 08123456789                ║
║ Kirim: GoSend                  ║
╠════════════════════════════════╣
║ ITEM:                          ║
║ Kebab Daging                   ║
║   2 × Rp15.000 = Rp30.000      ║
║ Roti Maryam                    ║
║   3 × Rp10.000 = Rp30.000      ║
╠════════════════════════════════╣
║ Subtotal      Rp60.000         ║
║ Ongkir        Rp15.000         ║
╠════════════════════════════════╣
║ TOTAL         Rp75.000         ║
╠════════════════════════════════╣
║ Metode: Transfer BCA           ║
║ Bayar:    Rp75.000             ║
╠════════════════════════════════╣
║ Status: LUNAS ✅               ║
╚════════════════════════════════╝
       Terima kasih!
```

### A4 Invoice

```
┌────────────────────────────────────────────────────────────┐
│  NAMA BISNIS                    INVOICE                    │
│  Invoice / Struk Pembayaran       #ABC12345                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  DARI:                         KEPADA:                     │
│  NAMA BISNIS                   Nama Pelanggan              │
│  Alamat Bisnis                 08123456789                 │
│  Telp: 0812345678              GoSend                      │
│                                                            │
│  TANGGAL: 15 Mei 2025, 14:30                               │
│  STATUS: LUNAS                                             │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ PRODUK          │ QTY │ HARGA      │ TOTAL         │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Kebab Daging    │  2  │ Rp15.000   │ Rp30.000      │  │
│  │ Roti Maryam     │  3  │ Rp10.000   │ Rp30.000      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Subtotal                        Rp60.000                  │
│  Ongkir (GoSend)                 Rp15.000                  │
│  ─────────────────────────────────────────                 │
│  TOTAL                           Rp75.000                  │
│                                                            │
│  Metode Pembayaran: Transfer BCA                           │
│                                                            │
│  ╔════════════════════════════════════════════════════╗   │
│  ║  Informasi Pembayaran:                             ║   │
│  ║  BCA: 1234567890 a.n. Nama Pemilik                 ║   │
│  ╚════════════════════════════════════════════════════╝   │
│                                                            │
│              Terima kasih atas kepercayaan Anda!           │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Setting Printer Thermal

### Printer yang Direkomendasikan
- Epson TM-T82III
- Xprinter XP-58IIH
- Zjiang ZJ-58
- Any thermal printer 58mm/80mm

### Setup Windows
1. Install driver printer thermal
2. Setting default paper size ke 58mm atau 80mm
3. Setting margins ke 0
4. Enable "Print background graphics"

### Setup Browser
```javascript
// Saat print, browser akan otomatis detect
// format thermal dari CSS @page rule
```

---

## 📱 Share via WhatsApp

Tombol **"Kirim WA"** akan:
1. Format pesan dengan emoji
2. Buka WhatsApp Web/App
3. Isi pesan otomatis dengan detail invoice
4. Jika HP pelanggan tersimpan, akan langsung ke chat

**Contoh pesan WA:**
```
🧾 INVOICE - Nama Bisnis

━━━━━━━━━━━━━━━━━━━
📄 No. Invoice: #ABC12345
📅 Tanggal: 15 Mei 2025, 14:30
━━━━━━━━━━━━━━━━━━━

👤 Pelanggan:
Nama: Budi Santoso
HP: 08123456789

🛒 Item Pesanan:
• Kebab Daging
  2 × Rp15.000 = Rp30.000
• Roti Maryam
  3 × Rp10.000 = Rp30.000

━━━━━━━━━━━━━━━━━━━
Subtotal: Rp60.000
Ongkir: Rp15.000
TOTAL: Rp75.000
━━━━━━━━━━━━━━━━━━━

💳 Metode: Transfer BCA
Status: LUNAS ✅

_Terima kasih sudah memesan! 🙏_
```

---

## 🎨 Kustomisasi

### Menambah Logo Bisnis

Edit `ReceiptModal.tsx`:
```tsx
<div className="text-center mb-4">
  {businessInfo?.logo ? (
    <img src={businessInfo.logo} alt="Logo" className="h-16 mx-auto mb-2" />
  ) : (
    <p className="font-bold text-base">{businessName}</p>
  )}
</div>
```

### Menambah QR Code Pembayaran

1. Install library qrcode:
```bash
npm install qrcode.react
```

2. Import dan tambah ke invoice:
```tsx
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG 
  value={`https://payment.link/${order.id}`}
  size={128}
/>
```

### Custom Footer

Edit bagian footer di komponen ReceiptModal:
```tsx
<div className="text-center mt-4 pt-3 border-t border-dashed">
  <p className="text-xs">{businessInfo?.customFooter || 'Terima kasih!'}</p>
  <p className="text-10 text-gray-400">Follow IG: @yourbusiness</p>
</div>
```

---

## 📁 File Terkait

```
src/
├── app/(app)/orders/
│   └── ReceiptModal.tsx          # Modal struk dengan 2 format
├── components/invoice/
│   └── InvoicePrint.tsx          # Standalone invoice component
└── lib/
    └── utils.ts                  # Helper functions
```

---

## 💡 Tips

### 1. Cetak Otomatis Setelah Pembayaran
```tsx
// Di PaymentModal.tsx, setelah sukses:
if (data.payment_status === 'paid') {
  window.open(`/invoice/${order.id}/print`, '_blank')
}
```

### 2. Email Invoice
```tsx
// Kirim invoice via email
const handleEmailInvoice = async () => {
  await fetch('/api/send-invoice', {
    method: 'POST',
    body: JSON.stringify({ orderId: order.id })
  })
}
```

### 3. Simpan History Cetak
```sql
-- Tambah tabel print history
CREATE TABLE print_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  printed_by UUID REFERENCES auth.users(id),
  print_format TEXT,
  printed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🐛 Troubleshooting

### Printer tidak print
- Cek koneksi printer
- Pastikan driver terinstall
- Setting paper size di printer properties
- Coba print test page dari Windows

### Format tidak rapi
- Pastikan printer setting: Paper Size = 58mm/80mm
- Margins = 0
- Scaling = None / Actual Size

### PDF tidak terdownload
- Cek pop-up blocker browser
- Pastikan jsPDF library terinstall
- Check browser console untuk error

### WhatsApp tidak terbuka
- Pastikan nomor HP valid
- Cek apakah WhatsApp Web sudah login
- Coba refresh halaman

---

## 📦 Dependencies

```json
{
  "jspdf": "^4.2.1",
  "date-fns": "^4.1.0",
  "lucide-react": "^1.14.0"
}
```

---

**Update Date:** 2025-05-09  
**Version:** 0.3.0
