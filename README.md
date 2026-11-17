# Media Seleksi

PWA untuk memisahkan foto & video ke folder custom (Browse → Select → Move). Lihat `seleksi.md` untuk PRD.

## Menjalankan

```bash
npm install
npm run dev      # development
npm run build    # produksi (menghasilkan service worker + manifest PWA)
npm run preview  # coba hasil build
```

## Cara kerja pemindahan

- **Chrome/Edge desktop (File System Access API):** pilih folder sumber → file dipindah ke
  `<folder sumber>/Media Seleksi/<nama folder>/` (salin → verifikasi ukuran → hapus sumber). Bisa di-undo.
- **Browser lain (fallback):** pilih/seret file → "pindah" = unduh file dengan awalan nama folder.
  File asli harus dihapus manual; undo otomatis tidak tersedia.

File akses `showDirectoryPicker` butuh HTTPS atau `localhost`.
