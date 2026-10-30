import { useState } from 'react'

/**
 * Collapsible Tab-based payment instructions for various banks
 */
export default function PaymentInstructions({ bank }) {
  const [activeTab, setActiveTab] = useState('atm')

  const instructions = {
    bca: {
      atm: [
        'Masukkan Kartu ATM BCA dan PIN Anda.',
        'Pilih menu "Transaksi Lainnya" > "Transfer" > "Ke Rek BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Masukkan jumlah pembayaran yang sesuai.',
        'Ikuti instruksi selanjutnya untuk menyelesaikan transaksi.',
      ],
      mobile: [
        'Buka aplikasi BCA Mobile dan Login.',
        'Pilih menu "m-Transfer" > "BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Pastikan data transaksi (nama, nominal) sudah benar, lalu klik "OK".',
        'Masukkan PIN m-BCA Anda untuk memproses pembayaran.',
      ],
      ib: [
        'Buka KlikBCA dan login.',
        'Pilih menu "Transfer Dana" > "Transfer ke BCA Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Validasi transaksi menggunakan token KeyBCA Anda.',
      ],
    },
    mandiri: {
      atm: [
        'Masukkan Kartu ATM Mandiri dan PIN Anda.',
        'Pilih menu "Bayar/Beli" > "Multi Payment".',
        'Masukkan Kode Perusahaan (Biller Code) Mandiri.',
        'Masukkan Kode Bayar (Bill Key) transaksi.',
        'Pilih item tagihan yang sesuai, lalu tekan "Ya".',
        'Konfirmasi pembayaran dan simpan struk.',
      ],
      mobile: [
        "Buka aplikasi Livin' by Mandiri dan Login.",
        'Pilih menu "Bayar" > "Multi Payment" (atau cari nama biller).',
        'Pilih penyedia jasa / masukan kode perusahaan.',
        'Masukkan Kode Bayar (Bill Key).',
        "Periksa detail tagihan, lalu masukkan PIN Livin' Anda.",
      ],
      ib: [
        'Login ke Mandiri Internet Banking.',
        'Pilih menu "Bayar" > "Multi Payment".',
        'Pilih penyedia jasa, masukkan Kode Bayar.',
        'Konfirmasi transaksi dengan token Mandiri.',
      ],
    },
    bri: {
      atm: [
        'Masukkan Kartu ATM BRI dan PIN Anda.',
        'Pilih menu "Transaksi Lain" > "Pembayaran" > "Lainnya" > "BRIVA".',
        'Masukkan nomor BRIVA (Virtual Account).',
        'Periksa detail tagihan, pilih "Ya" untuk bayar.',
        'Ambil struk bukti pembayaran.',
      ],
      mobile: [
        'Buka aplikasi BRImo dan Login.',
        'Pilih menu "BRIVA" > "Pembayaran Baru".',
        'Masukkan nomor BRIVA (Virtual Account).',
        'Periksa info nominal pembayaran, lalu klik "Bayar".',
        'Masukkan PIN BRImo Anda untuk memproses pembayaran.',
      ],
      ib: [
        'Login ke Internet Banking BRI.',
        'Pilih menu "Pembayaran" > "BRIVA".',
        'Masukkan nomor Virtual Account BRIVA.',
        'Ikuti langkah verifikasi token untuk menyelesaikan.',
      ],
    },
    bni: {
      atm: [
        'Masukkan Kartu ATM BNI dan PIN Anda.',
        'Pilih menu "Menu Lainnya" > "Transfer" > "Virtual Account Billing".',
        'Masukkan nomor Virtual Account.',
        'Periksa konfirmasi tagihan, pilih "Ya" untuk bayar.',
      ],
      mobile: [
        'Buka aplikasi BNI Mobile Banking dan Login.',
        'Pilih menu "Transfer" > "Virtual Account Billing".',
        'Pilih rekening debit, lalu input nomor Virtual Account.',
        'Konfirmasi pembayaran dengan memasukkan Password Transaksi Anda.',
      ],
      ib: [
        'Login ke BNI Internet Banking.',
        'Pilih menu "Transaksi" > "Virtual Account Billing".',
        'Masukkan nomor Virtual Account.',
        'Otorisasi transaksi menggunakan BNI e-Secure.',
      ],
    },
    permata: {
      atm: [
        'Masukkan Kartu ATM Permata dan PIN Anda.',
        'Pilih menu "Transaksi Lainnya" > "Pembayaran" > "Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Periksa detail tagihan dan konfirmasi pembayaran.',
      ],
      mobile: [
        'Buka aplikasi PermataME / PermataMobile X.',
        'Pilih menu "Bayar Tagihan" > "Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Konfirmasi pembayaran dan masukkan Mobile PIN.',
      ],
      ib: [
        'Login ke PermataNet.',
        'Pilih menu "Pembayaran Tagihan" > "Virtual Account".',
        'Masukkan nomor Virtual Account.',
        'Konfirmasi menggunakan SMS OTP.',
      ],
    },
  }

  const bankInstructions = instructions[bank] || instructions.bca

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('atm')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'atm'
              ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ATM
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mobile')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'mobile'
              ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          M-Banking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ib')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'ib'
              ? 'bg-white text-primary-600 border-b-2 border-primary-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Internet Banking
        </button>
      </div>
      <div className="p-4 bg-white">
        <ol className="list-decimal pl-4 text-[11px] text-gray-600 space-y-2">
          {bankInstructions[activeTab].map((step, idx) => (
            <li key={idx} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
