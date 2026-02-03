# 🏫 MANAJEMEN SD DRAWATI v1.0.0

**Sistem Otomasi Stock Opname & Laporan Aset Sekolah**

Aplikasi web modern untuk mengotomatisasi konversi **Laporan Beban Persediaan (Excel)** menjadi dokumen administrasi sekolah yang siap cetak.

![App Screenshot](https://via.placeholder.com/800x400?text=Manajemen+SD+Drawati+Dashboard)

## 🚀 Fitur Utama
- **⚡ Super Cepat**: Proses transformasi data < 5 detik
- **📊 4 Output Otomatis**:
  1. **FORM STOCK OPNAME** (.xlsx) - Agregasi per jenis barang
  2. **LAPORAN PERSEDIAAN** (.xlsx) - Filter barang sisa
  3. **BA STOCK OPNAME** (.docx) - Berita acara dengan template
  4. **BAST** (.docx) - Berita acara serah terima
- **🔄 Smart Parsing**: Mendeteksi header Excel otomatis
- **📝 Template Driven**: Gunakan file .docx sekolah sendiri sebagai template
- **☁️ Serverless DB**: Konfigurasi sekolah tersimpan aman

## 🛠️ Cara Install & Jalan

### Prasyarat
- Node.js (v18+) installed
- Browser (Chrome/Edge/Firefox)

### 1. Jalankan Aplikasi (Dev Mode)
Buka terminal di folder project utama:

```bash
# Install dependencies (hanya pertama kali)
cd server && npm install
cd ../client && npm install

# Kembali ke root dan jalankan script dev (jika ada) atau manual:
# Terminal 1 (Backend):
cd server && npm run dev

# Terminal 2 (Frontend):
cd client && npm run dev
```

### 2. Akses Aplikasi
Buka browser: **http://localhost:5173**

## 📂 Struktur Folder Output
Semua file yang digenerate tersimpan sementara di:
`server/outputs/`

## ⚙️ Konfigurasi Template (Lanjutan)
Untuk menggunakan format surat sekolah sendiri:
1. Siapkan file `.docx` dengan placeholders
2. Simpan di folder `server/src/templates/`
3. Beri nama: `ba_stock_opname_template.docx` dan `bast_template.docx`

---

Built with ❤️ for Pendidikan Indonesia
**Status**: ✅ Production Ready
