# PWA (Progressive Web App) Guide

## 📱 Fitur PWA

Sistem Open PO sekarang bisa di-install sebagai aplikasi native di HP Anda!

### Fitur PWA

✅ **Install di Home Screen** - Seperti app native  
✅ **Offline Mode** - Bisa akses meski offline  
✅ **Background Sync** - Auto-sync saat online kembali  
✅ **Push Notifications** - Siap untuk notifikasi realtime  
✅ **Responsive** - Works on all devices  

---

## 🚀 Cara Install PWA

### Android (Chrome)
1. Buka website di Chrome
2. Tap menu (⋮) → "Tambahkan ke layar utama"
3. Atau tunggu prompt install otomatis muncul
4. Icon akan muncul di home screen

### iOS (Safari)
1. Buka website di Safari
2. Tap tombol share (⬆️)
3. Pilih "Tambahkan ke Layar Utama"
4. Icon akan muncul di home screen

### Desktop (Chrome/Edge)
1. Buka website
2. Klik icon install di address bar
3. Atau tunggu prompt install otomatis

---

## 📁 Struktur File PWA

```
public/
├── manifest.json          # PWA manifest
├── browserconfig.xml      # Windows tile config
├── offline.html          # Offline fallback page
├── sw-custom.js          # Custom service worker
└── icons/
    └── icon.svg          # SVG source

src/
├── components/pwa/
│   └── PWAComponents.tsx  # PWA components
├── hooks/
│   └── usePWA.ts         # PWA hooks
└── app/
    ├── layout.tsx        # PWA meta tags
    └── globals.css       # PWA styles
```

---

## 🎨 Generate Icon PWA

### Opsi 1: Online Generator
1. Buka [PWA Asset Generator](https://pwa-asset-generator.nicepkg.cn/)
2. Upload logo (SVG/PNG 512x512)
3. Download semua size
4. Extract ke `public/icons/`

### Opsi 2: Manual (Figma/Photoshop)
1. Buat icon 512x512 px
2. Export ke berbagai size:
   - 72x72, 96x96, 128x128
   - 144x144, 152x152, 192x192
   - 384x384, 512x512
3. Simpan di `public/icons/`

---

## 🧪 Testing PWA

### Chrome DevTools
1. Buka DevTools (F12)
2. Tab **Lighthouse**
3. Kategori: PWA
4. Click **Generate Report**

### Chrome DevTools - Application Tab
- **Manifest**: Cek icon, theme color, display mode
- **Service Workers**: Test offline mode
- **Storage**: Lihat cache storage

### Test Offline
1. Buka aplikasi
2. DevTools → Network → Offline
3. Refresh page
4. Harus muncul offline fallback

### Test Install
1. Clear browser data
2. Buka aplikasi
3. Tunggu prompt install muncul (3 detik delay)
4. Atau klik icon install di address bar

---

## 🐛 Troubleshooting

### PWA tidak bisa install
- Cek HTTPS (wajib untuk PWA)
- Cek manifest.json valid
- Cek service worker ter-register
- Cek icon tersedia

### Offline mode tidak bekerja
- Cek service worker ter-install
- Cek cache storage di DevTools
- Clear cache dan reload

### Push notification tidak muncul
- Cek permission notifikasi (Allow)
- Cek service worker aktif
- Test di mobile (desktop sering bermasalah)

---

## 💡 Tips & Tricks

### 1. Update Service Worker
```javascript
// Force update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.update()
  })
}
```

### 2. Detect Install Status
```javascript
// Cek apakah sudah di-install
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
if (isStandalone) {
  console.log('Running as installed PWA')
}
```

### 3. Prompt Install Manual
```javascript
// Tampilkan install button
const [installPrompt, setInstallPrompt] = useState(null)

useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    setInstallPrompt(e)
  })
}, [])

const handleInstall = () => {
  if (installPrompt) {
    installPrompt.prompt()
  }
}
```

---

## 📊 Performance Checklist

- [ ] Lighthouse PWA score > 90
- [ ] Service worker terpasang
- [ ] Manifest valid
- [ ] Icon semua size tersedia
- [ ] HTTPS enabled
- [ ] Offline fallback berfungsi
- [ ] Responsive di semua device
- [ ] Load time < 3 detik
- [ ] Install prompt muncul

---

## 🔗 Resources

- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Update Date:** 2025-05-09  
**Version:** 0.4.0
