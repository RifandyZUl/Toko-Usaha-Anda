-- Script untuk cek locks yang masih aktif
-- Jalankan di pgAdmin setelah clear lock

-- Cek semua advisory locks
SELECT 
    locktype,
    database,
    relation,
    pid,
    mode,
    granted
FROM pg_locks 
WHERE locktype = 'advisory';

-- Cek active connections
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE datname = 'toko_usaha_anda';

-- Kill stuck connections (HATI-HATI: hanya jika perlu!)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'toko_usaha_anda' AND pid <> pg_backend_pid();

