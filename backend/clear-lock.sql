-- Script untuk clear advisory lock di PostgreSQL
-- Jalankan ini di pgAdmin atau psql jika migration stuck

-- Connect ke database toko_usaha_anda
\c toko_usaha_anda;

-- Hapus semua advisory locks
SELECT pg_advisory_unlock_all();

-- Cek apakah ada locks yang masih aktif
SELECT * FROM pg_locks WHERE locktype = 'advisory';

