# Checklist Production-Readiness Website E-Commerce

> Dibuat sebagai panduan audit untuk sistem yang sudah dibangun secara "vibe coding" agar siap dinaikkan ke production dengan standar industri.

---

## 0. Kenapa Ini Penting Dulu

Vibe coding (menulis kode langsung berdasarkan insting tanpa desain sistem di depan) itu wajar untuk prototipe. Tapi untuk e-commerce production, tiga hal jadi taruhannya: **uang pelanggan**, **data pribadi pelanggan**, dan **reputasi**. Kalau salah satu bocor/rusak, dampaknya bukan cuma bug biasa — bisa jadi masalah hukum (UU PDP) dan kepercayaan yang hilang permanen.

Langkah pertama yang paling penting: **audit ulang arsitektur yang sudah ada**, bukan langsung nulis fitur baru.

---

## 1. System Design & Arsitektur

- [ ] **Pisahkan layer dengan jelas**: presentation (frontend) → business logic (backend/API) → data (database). Jangan campur query database langsung di controller/route handler tanpa lapisan service/repository.
- [ ] **Definisikan API contract** — gunakan OpenAPI/Swagger spec, bukan endpoint yang tumbuh organik tanpa dokumentasi.
- [ ] **Pisahkan environment**: development, staging, production — masing-masing dengan database & config terpisah. Jangan pernah testing fitur baru langsung di database production.
- [ ] **Idempotency untuk operasi kritikal** — terutama pembayaran & pembuatan order. Kalau user klik "bayar" dua kali (misal jaringan lambat), sistem tidak boleh membuat dua transaksi/tagihan.
- [ ] **State machine yang jelas untuk order** — misal: `pending → paid → processing → shipped → delivered → completed` (+ `cancelled`, `refunded`). Jangan biarkan status order berupa string bebas yang bisa salah ketik di kode.
- [ ] **Rencanakan untuk gagal (design for failure)** — apa yang terjadi kalau payment gateway down saat checkout? Apa yang terjadi kalau webhook dari payment gateway terlambat/dobel diterima?

## 2. Keamanan (paling kritikal untuk e-commerce)

- [ ] **Autentikasi & otorisasi yang benar**
  - Password di-hash dengan bcrypt/argon2 (JANGAN MD5/SHA1 polos).
  - Gunakan JWT dengan expiry pendek + refresh token, atau session yang di-invalidate dengan benar saat logout.
  - Cek otorisasi di **setiap** endpoint — pastikan user A tidak bisa akses/edit order milik user B hanya dengan mengubah ID di URL (ini disebut **IDOR — Insecure Direct Object Reference**, sangat umum di e-commerce buatan sendiri).
- [ ] **Input validation & sanitization** di semua endpoint — jangan percaya data dari client, termasuk harga produk. **Harga dan total transaksi HARUS dihitung ulang di server**, jangan pernah terima angka harga dari frontend/request body. Ini celah paling umum di e-commerce amatir (user bisa ubah harga di request jadi Rp1).
- [ ] **Proteksi terhadap serangan umum**:
  - SQL Injection → gunakan parameterized query / ORM, jangan concatenate string SQL.
  - XSS → escape semua output yang berasal dari input user.
  - CSRF → gunakan token CSRF untuk form/state-changing request.
  - Rate limiting → cegah brute-force login & spam checkout.
- [ ] **HTTPS wajib di semua endpoint**, bukan cuma halaman login/checkout. Gunakan HSTS.
- [ ] **Jangan pernah simpan data kartu pembayaran sendiri** — serahkan ke payment gateway (PCI DSS compliant). Simpan hanya token/reference transaksi.
- [ ] **Verifikasi webhook payment gateway** — cek signature/HMAC dari payload webhook, jangan percaya begitu saja bahwa request itu benar dari payment gateway (bisa dipalsukan orang lain kalau URL webhook ketahuan).
- [ ] **Secrets management** — API key, database credential, JWT secret disimpan di environment variable / secret manager, JANGAN hardcoded di kode atau ikut ter-commit ke Git.
- [ ] **Dependency scanning** — cek library yang dipakai (`npm audit`, `pip-audit`, dsb) untuk vulnerability yang diketahui.

## 3. Database

- [ ] **Migrasi database terstruktur** (Alembic/Prisma Migrate/Flyway) — jangan ubah skema manual langsung ke production DB.
- [ ] **Index yang tepat** pada kolom yang sering di-query (misal `user_id`, `order_status`, `created_at`) — cek query lambat dengan `EXPLAIN ANALYZE`.
- [ ] **Transaction/atomicity** untuk operasi multi-step, misal: kurangi stok + buat order harus terjadi bersamaan (semua sukses atau semua rollback) — pakai database transaction, jangan operasi terpisah yang bisa gagal di tengah.
- [ ] **Backup otomatis & terjadwal**, dan **coba proses restore-nya** minimal sekali (backup yang tidak pernah dites bukan backup).
- [ ] **Constraint di level database**, bukan cuma validasi di aplikasi (misal `NOT NULL`, `UNIQUE`, foreign key) — mencegah data korup kalau ada bug di kode aplikasi.

## 4. Performa

- [ ] **Caching** — untuk data yang jarang berubah (katalog produk, kategori) pakai Redis/cache layer, jangan query database di setiap request.
- [ ] **Pagination** untuk semua list data (produk, order, review) — jangan pernah `SELECT *` tanpa limit.
- [ ] **Optimasi gambar** — kompresi, lazy loading, gunakan CDN untuk asset statis.
- [ ] **N+1 query problem** — cek apakah ada query yang berulang di loop (umum terjadi kalau pakai ORM tanpa hati-hati).
- [ ] **Load testing** sebelum launch — simulasikan banyak user checkout bersamaan (pakai k6, Locust, atau JMeter) untuk tahu batas kapasitas server.

## 5. Testing & Quality Assurance

- [ ] **Unit test** untuk logic bisnis kritikal — terutama perhitungan harga, diskon, ongkir, dan stok.
- [ ] **Integration test** untuk alur checkout end-to-end (termasuk mock payment gateway).
- [ ] **Manual test alur pembayaran gagal/dibatalkan** — jangan cuma test skenario sukses.
- [ ] **Code review** — kalau kerja sendiri, minimal re-review kode sendiri dengan jeda waktu, atau minta orang lain review bagian kritikal (auth, payment, order).

## 6. Deployment & DevOps

- [ ] **CI/CD pipeline** — otomatis test & deploy saat push ke branch tertentu, bukan upload file manual ke server.
- [ ] **Containerization (Docker)** — memastikan environment development = production, menghindari "works on my machine".
- [ ] **Zero-downtime deployment** kalau memungkinkan, atau minimal maintenance page yang jelas saat deploy.
- [ ] **Environment variable terpisah per environment**, jangan hardcode config.
- [ ] **Rollback plan** — kalau deploy baru bikin error, harus bisa rollback cepat ke versi sebelumnya.

## 7. Monitoring & Observability

- [ ] **Error tracking** (Sentry, atau sejenisnya) — supaya tahu ada bug di production sebelum user komplain.
- [ ] **Logging terstruktur** — terutama untuk transaksi pembayaran (siapa, kapan, status apa) untuk audit trail. Jangan log data sensitif (password, nomor kartu).
- [ ] **Uptime monitoring** (UptimeRobot, dsb) + alert kalau server down.
- [ ] **Health check endpoint** — supaya load balancer/monitoring tahu server hidup atau tidak.

## 8. Legal & Compliance (Indonesia)

- [ ] **Kepatuhan UU PDP (Perlindungan Data Pribadi)** — kebijakan privasi jelas, consent pengumpulan data, hak user untuk hapus data.
- [ ] **Syarat & Ketentuan + Kebijakan Pengembalian** yang jelas untuk pelanggan.
- [ ] Kalau pakai payment gateway resmi (poin sebelumnya), sebagian besar syarat keamanan pembayaran (PCI DSS) otomatis terpenuhi karena ditangani mereka.

---

## 9. Mengarahkan AI Coding Assistant Agar Tidak Overconfident & Kodenya Clean

Kalau proses development masih banyak dibantu AI (Claude Code, Cursor, Copilot, dll), masalah paling umum adalah AI cenderung menulis kode yang terlihat "selesai dan rapi" padahal:
- Tidak menangani edge case (error handling minim/tidak ada)
- Terlalu panjang/bertele-tele untuk 1 fungsi, padahal bisa lebih ringkas
- Mengasumsikan hal-hal yang belum tentu benar tanpa bilang "saya asumsikan X"
- Tidak menyebutkan trade-off atau bagian yang perlu direview manual

Berikut cara mengarahkannya lewat prompt/instruksi (bisa ditaruh di system prompt, `CLAUDE.md`, atau diucapkan tiap sesi):

- [ ] **Minta AI eksplisit menyebutkan asumsi & keterbatasan** — instruksikan: *"Setiap kali membuat fungsi/fitur, sebutkan asumsi yang kamu ambil, edge case yang belum ditangani, dan bagian yang perlu saya cek manual sebelum production."* Jangan biarkan AI diam soal ini.
- [ ] **Minta AI mengevaluasi kodenya sendiri secara kritis**, bukan hanya menyampaikan bahwa kode "sudah selesai" — misal: *"Setelah menulis kode, review ulang: apakah ada kemungkinan bug, race condition, atau kasus input yang belum ditangani? Sebutkan secara eksplisit, jangan disembunyikan hanya karena kode terlihat rapi."*
- [ ] **Minta bukti, bukan klaim** — kalau AI bilang "sudah aman" atau "sudah dites", minta ditunjukkan test case-nya atau cara verifikasinya, jangan terima klaim begitu saja.
- [ ] **Tetapkan batas kompleksitas per fungsi** — instruksikan: *"Satu fungsi idealnya di bawah ~30–40 baris dan melakukan satu tanggung jawab (single responsibility). Kalau lebih panjang dari itu, pecah jadi fungsi-fungsi kecil yang masing-masing punya nama jelas."*
- [ ] **Minta AI menghindari over-engineering** — kadang AI menambahkan abstraksi/pattern yang tidak perlu untuk kasus sederhana. Instruksikan: *"Jangan tambahkan abstraksi, design pattern, atau library baru kecuali benar-benar dibutuhkan untuk kasus ini — solusi paling sederhana yang tetap benar dan readable lebih diutamakan daripada solusi yang 'canggih' tapi rumit."*
- [ ] **Minta AI menghindari duplikasi & kode mati** — instruksikan untuk selalu cek apakah logic serupa sudah ada di tempat lain sebelum menulis ulang, dan menghapus kode/import yang tidak lagi dipakai, bukan membiarkannya menumpuk.
- [ ] **Minta penjelasan trade-off, bukan cuma satu solusi** — untuk keputusan yang cukup penting (misal caching, struktur database, alur pembayaran), minta AI menyebutkan minimal 1 alternatif pendekatan dan kenapa memilih yang satu ini, supaya kamu bisa menilai bukan cuma menerima.
- [ ] **Jangan biarkan AI "menebak" spesifikasi yang ambigu** — instruksikan AI untuk bertanya atau menyatakan asumsi secara eksplisit ketika requirement tidak jelas, daripada langsung membuat keputusan diam-diam yang mungkin salah arah.
- [ ] **Minta linter & formatter otomatis** (ESLint/Prettier, Black/Ruff, dsb.) dijalankan sebagai bagian dari alur kerja AI — supaya konsistensi gaya kode terjaga tanpa AI perlu "berkreasi" sendiri soal formatting.
- [ ] **Review manual tetap wajib** untuk bagian kritikal (auth, pembayaran, perhitungan harga) — jangan jadikan AI sebagai satu-satunya lapisan verifikasi. AI bisa jadi terlalu percaya diri terhadap kodenya sendiri karena secara sintaks kode terlihat benar, padahal logikanya keliru.

**Contoh instruksi ringkas yang bisa langsung dipakai** (taruh di awal sesi atau file konfigurasi AI):

> "Tulis kode sesederhana dan seringkas mungkin tanpa mengurangi kualitas atau keamanan. Pecah fungsi yang terlalu panjang. Setelah menulis kode, sebutkan secara eksplisit: asumsi yang diambil, edge case yang belum ditangani, dan bagian yang berisiko/perlu saya review manual sebelum production. Jangan klaim kode 'sudah aman' atau 'sudah optimal' tanpa alasan konkret."

---

## Prioritas Kalau Waktu Terbatas

Kalau tidak bisa audit semuanya sekaligus, urutkan begini:

1. **Keamanan poin harga/total dihitung server-side + otorisasi per-endpoint (IDOR)** — ini yang paling sering jadi celah eksploitasi nyata di e-commerce buatan sendiri.
2. **Verifikasi webhook payment gateway** — kalau tidak diverifikasi, orang bisa memalsukan status "sudah bayar".
3. **Transaction/atomicity di database** untuk stok & order.
4. **Backup & restore database** yang sudah dites.
5. Sisanya (performa, monitoring, CI/CD) bisa menyusul setelah 4 poin di atas aman.
