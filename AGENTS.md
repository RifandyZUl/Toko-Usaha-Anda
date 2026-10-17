# Panduan untuk AI Coding Assistant — Proyek Ini

> Taruh file ini di root folder proyek. Berlaku untuk model AI apa pun yang dipakai (Claude, GPT, Gemini, dsb) — baca dan ikuti sebelum menulis atau mengubah kode apa pun di proyek ini.

---

## Konteks Proyek

Ini adalah website e-commerce yang sedang disiapkan untuk **production sungguhan** (bukan tugas/latihan). Kesalahan di kode ini berdampak langsung ke uang dan data pribadi pelanggan nyata. Perlakukan setiap perubahan kode dengan tingkat kehati-hatian yang sesuai.

---

## Aturan Utama

### 1. Jangan overconfident — selalu laporkan ketidakpastian

Setelah menulis atau mengubah kode, **selalu sertakan** di akhir jawaban:
- **Asumsi** yang kamu ambil karena requirement tidak sepenuhnya jelas
- **Edge case** yang belum ditangani atau sengaja diabaikan
- **Bagian yang berisiko** dan perlu direview manual oleh saya sebelum dipakai production
- Kalau kamu tidak yakin sebuah pendekatan benar, katakan itu secara eksplisit — jangan menyajikan solusi seolah-olah pasti benar padahal kamu ragu.

Jangan pernah klaim kode "sudah aman", "sudah optimal", atau "sudah teruji" tanpa alasan konkret (misal: test case apa yang membuktikannya). Kalau belum ada bukti, katakan belum diverifikasi.

### 2. Kode ringkas, bukan panjang demi terlihat lengkap

- Satu fungsi idealnya **di bawah ~30–40 baris** dan melakukan **satu tanggung jawab saja**. Kalau lebih panjang, pecah jadi fungsi-fungsi kecil dengan nama yang jelas.
- Jangan tambahkan abstraksi, design pattern, layer, atau library baru **kecuali benar-benar dibutuhkan** untuk kasus yang sedang dikerjakan. Solusi paling sederhana yang tetap benar dan mudah dibaca lebih diutamakan daripada solusi yang terlihat "canggih" tapi rumit.
- Sebelum menulis kode baru, cek dulu apakah logic serupa sudah ada di tempat lain di proyek — jangan duplikasi.
- Hapus kode, import, atau variabel yang tidak lagi dipakai — jangan biarkan menumpuk "untuk jaga-jaga".

### 3. Jangan menebak diam-diam saat requirement ambigu

Kalau instruksi saya kurang jelas atau bisa diinterpretasikan lebih dari satu cara:
- Tanyakan dulu **jika** keputusannya berdampak besar (misal menyangkut skema database, alur pembayaran, atau keamanan).
- Kalau harus tetap jalan tanpa bertanya, **nyatakan asumsi yang diambil secara eksplisit** di awal jawaban, jangan langsung eksekusi diam-diam.

### 4. Untuk keputusan penting, tunjukkan trade-off

Untuk hal yang cukup krusial (struktur database, strategi caching, alur checkout/pembayaran, autentikasi), sebutkan minimal satu pendekatan alternatif dan kenapa kamu memilih pendekatan yang diajukan — supaya saya bisa menilai, bukan cuma menerima satu opsi tanpa pembanding.

### 5. Review-kritik kode sendiri sebelum menyerahkan

Setelah menulis kode, lakukan self-review singkat dan jawab (boleh dalam 3-5 poin singkat):
- Apakah ada kemungkinan bug atau race condition?
- Apakah semua input tervalidasi, termasuk kasus input kosong/salah format/nilai ekstrem?
- Apakah ada operasi yang seharusnya atomic (transaction) tapi belum?
- Apakah harga/total transaksi dihitung ulang di server, bukan dipercaya dari client?
- Apakah endpoint ini sudah dicek otorisasinya (user tidak bisa akses data user lain)?

### 6. Konsistensi meskipun model AI berganti-ganti

Karena saya sering berpindah model AI untuk mengerjakan proyek ini:
- Sebelum mengubah kode yang sudah ada, **baca dan ikuti pola/gaya yang sudah dipakai di file tersebut** (naming convention, struktur folder, cara error handling) — jangan perkenalkan gaya baru yang tidak konsisten dengan kode sekitarnya.
- Jangan menulis ulang/refactor bagian yang tidak diminta hanya karena "menurutmu lebih baik" — kalau ada saran refactor, sampaikan sebagai saran terpisah, jangan langsung eksekusi tanpa diminta.
- Jalankan linter/formatter proyek ini (kalau tersedia) sebelum menganggap kode selesai, supaya gaya kode tetap konsisten walau ditulis oleh model AI yang berbeda-beda.

### 7. Area sensitif — perlakukan ekstra hati-hati

Untuk kode yang menyentuh area berikut, WAJIB tandai secara eksplisit sebagai "perlu review manual" dan jelaskan alasannya:
- Autentikasi & otorisasi
- Perhitungan harga, diskon, ongkir, total transaksi
- Integrasi payment gateway & webhook
- Pengurangan/penambahan stok
- Query yang menyentuh data pribadi pelanggan

---

## Format Jawaban yang Diharapkan

Setiap kali menyelesaikan sebuah fitur/perubahan kode, akhiri dengan bagian singkat:

```
**Asumsi:** ...
**Belum ditangani / edge case:** ...
**Perlu direview manual:** ...
```

Kalau semua sudah jelas dan tidak ada risiko berarti, boleh ditulis singkat "Tidak ada asumsi/risiko signifikan" — tapi tetap harus dinyatakan, bukan dihilangkan begitu saja.
