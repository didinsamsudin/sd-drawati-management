# 🚀 Panduan Deployment: Manajemen SD Drawati

Panduan ini akan membantu Anda mengonlinekan aplikasi ini menggunakan layanan gratis & populer.

## 🏗️ Arsitektur
Karena aplikasi ini terdiri dari Frontend (React) dan Backend (Node.js), kita akan menggunakan strategi "Hybrid Deployment":
1.  **Backend (API)** → Di-deploy ke **Render.com** (Mendukung server Node.js yang hidup terus menerus).
2.  **Frontend (UI)** → Di-deploy ke **Vercel** (Terbaik untuk React/Vite, tapi serverless).

---

## ✅ Tahap 1: Persiapan GitHub (Wajib)

Sebelum dideploy, kode harus ada di GitHub.

1.  Buat Repository baru di GitHub (misal: `manajemen-sd-web`).
2.  Buka terminal di folder proyek ini (`d:\01. JOB\mang-asep\manajemen-sd-drawati`).
3.  Jalankan perintah berikut:
    ```bash
    git init
    git add .
    git commit -m "Initial commit - Siap Deploy"
    git branch -M main
    git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO.git
    git push -u origin main
    ```
    *(Ganti URL dengan URL repository GitHub Anda)*

---

## 🛠️ Tahap 2: Deploy Backend ke Render.com

1.  Buka [dashboard.render.com](https://dashboard.render.com/) dan login.
2.  Klik **New +** → Pilih **Web Service**.
3.  Pilih **Build and deploy from a Git repository**.
4.  Connect akun GitHub Anda dan pilih repo `manajemen-sd-web` yang baru dibuat.
5.  Konfigurasi settings:
    *   **Name:** `manajemen-sd-api` (bebas)
    *   **Region:** Singapore (terdekat)
    *   **Branch:** `main`
    *   **Root Directory:** `server` (PENTING! Ketik `server`)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Instance Type:** Free
6.  Klik **Create Web Service**.
7.  Tunggu proses build selesai (sekitar 3-5 menit).
8.  Setelah sukses, copy URL backend Anda (misal: `https://manajemen-sd-api.onrender.com`). Simpan URL ini!

---

## 🌐 Tahap 3: Deploy Frontend ke Vercel

1.  Buka [vercel.com](https://vercel.com/) dan login.
2.  Klik **Add New...** → **Project**.
3.  Import repository GitHub Anda (`manajemen-sd-web`).
4.  Konfigurasi Project:
    *   **Framework Preset:** Vite (biasanya otomatis terdeteksi).
    *   **Root Directory:** Klik Edit, lalu pilih folder `client`. (PENTING!)
    *   **Environment Variables:**
        *   Klik section Environment Variables.
        *   Isi **Key:** `VITE_API_URL`
        *   Isi **Value:** [URL Backend dari Render tadi] (misal: `https://manajemen-sd-api.onrender.com`)
        *   *Jangan gunakan trailing slash (/) di akhir URL.*
5.  Klik **Deploy**.
6.  Tunggu sebentar. Aplikasi Anda sekarang sudah online! 🎉

---

## 📝 Catatan Penting
*   **Cold Start:** Karena menggunakan layanan gratis (Render), backend akan "tertidur" jika tidak diakses selama 15 menit. Saat diakses pertama kali, mungkin butuh loading 30-50 detik. Ini normal untuk paket gratis.
*   **Database:** Data sesi disimpan sementara di memori server. Jika server restart (Render sering me-restart server gratis), sesi yang sedang berjalan mungkin hilang. Namun untuk penggunaan "Upload -> Generate -> Download" dalam satu sesi, ini aman.
