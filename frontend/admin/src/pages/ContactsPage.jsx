/**
 * Contacts Page
 * View, filter, reply, and manage customer contact form inquiries
 */

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  Trash2,
  ExternalLink,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react'
import {
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
} from '../services/contacts'
import { useAlertStore } from '../stores/alertStore'

export default function ContactsPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getContactMessages({
      page,
      limit: 20,
      status: selectedStatus,
    })

    if (res.success) {
      setMessages(res.messages)
      setPagination(res.pagination)
      setUnreadCount(res.unreadCount)
    } else {
      setError(res.error)
    }
    setLoading(false)
  }, [page, selectedStatus])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const { showAlert, showConfirm, showToast } = useAlertStore()

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id)
    const res = await updateContactStatus(id, newStatus)
    if (res.success) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
      )
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => ({ ...prev, status: newStatus }))
      }
      if (newStatus === 'READ' && unreadCount > 0) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      showToast('Status pesan berhasil diperbarui', 'success')
    } else {
      showAlert({
        title: 'Gagal Memperbarui Status',
        message: res.error || 'Gagal mengubah status pesan',
        type: 'error',
      })
    }
    setActionLoadingId(null)
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Hapus Pesan Kontak?',
      message: 'Apakah Anda yakin ingin menghapus pesan ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      isDestructive: true,
      type: 'warning',
    })

    if (!confirmed) return

    setActionLoadingId(id)
    const res = await deleteContactMessage(id)
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null)
      }
      showToast('Pesan kontak berhasil dihapus', 'success')
    } else {
      showAlert({
        title: 'Gagal Menghapus Pesan',
        message: res.error || 'Gagal menghapus pesan kontak',
        type: 'error',
      })
    }
    setActionLoadingId(null)
  }

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.comment?.toLowerCase().includes(q)
    )
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNREAD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Belum Dibaca
          </span>
        )
      case 'READ':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Dibaca
          </span>
        )
      case 'REPLIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Dibalas
          </span>
        )
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Diarsipkan
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    const clean = phone.replace(/\D/g, '')
    if (clean.startsWith('0')) return '62' + clean.slice(1)
    if (clean.startsWith('62')) return clean
    return '62' + clean
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-gray-900">Pesan Masuk (Contact Us)</h1>
            {unreadCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Daftar pertanyaan dan pesan yang dikirim pelanggan melalui formulir kontak.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'UNREAD', label: 'Belum Dibaca' },
            { id: 'READ', label: 'Sudah Dibaca' },
            { id: 'REPLIED', label: 'Sudah Dibalas' },
            { id: 'ARCHIVED', label: 'Diarsipkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, pesan..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Message List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm">Memuat data pesan kontak...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-base font-medium text-gray-900">Belum ada pesan kontak</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Tidak ada pesan yang sesuai dengan pencarian Anda.'
                : 'Ketika pengunjung mengirim pesan via form kontak di landing page, pesan akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-5 transition-colors hover:bg-gray-50 ${
                  msg.status === 'UNREAD' ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Customer Details & Message */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900 text-base">{msg.name}</span>
                      {getStatusBadge(msg.status)}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(msg.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:underline hover:text-gray-900"
                        >
                          {msg.email}
                        </a>
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <a
                            href={`https://wa.me/${formatPhoneNumber(msg.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
                          >
                            {msg.phone} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </span>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 font-sans leading-relaxed line-clamp-3">
                      {msg.comment}
                    </p>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedMessage(msg)
                          if (msg.status === 'UNREAD') {
                            handleStatusChange(msg.id, 'READ')
                          }
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center gap-1"
                        title="Lihat Detail Pesan"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>

                      {msg.phone && (
                        <a
                          href={`https://wa.me/${formatPhoneNumber(msg.phone)}?text=Halo%20${encodeURIComponent(
                            msg.name
                          )}%2C%20terima%20kasih%20telah%20menghubungi%20Toko%20Usaha%20Anda.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (msg.status !== 'REPLIED') {
                              handleStatusChange(msg.id, 'REPLIED')
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Balas WA
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={actionLoadingId === msg.id}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pesan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Status Dropdown */}
                    <select
                      value={msg.status}
                      disabled={actionLoadingId === msg.id}
                      onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="UNREAD">Tandai Belum Dibaca</option>
                      <option value="READ">Tandai Sudah Dibaca</option>
                      <option value="REPLIED">Tandai Sudah Dibalas</option>
                      <option value="ARCHIVED">Arsipkan</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>
              Menampilkan halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} pesan)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-900" />
                <h3 className="font-bold text-gray-900">Rincian Pesan Kontak</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Pengirim
                </label>
                <p className="text-base font-bold text-gray-900">{selectedMessage.name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </label>
                  <p className="text-sm text-gray-800 break-all">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nomor WhatsApp / HP
                  </label>
                  <p className="text-sm text-gray-800">{selectedMessage.phone || '-'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Waktu Masuk
                </label>
                <p className="text-xs text-gray-600">
                  {new Date(selectedMessage.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Isi Pesan
                </label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedMessage.comment}
                </div>
              </div>

              {/* Status Selector in Modal */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <span className="text-xs font-medium text-gray-600">Status Pesan:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleStatusChange(selectedMessage.id, 'READ')}
                    className={`px-3 py-1 text-xs rounded font-medium border ${
                      selectedMessage.status === 'READ'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Dibaca
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedMessage.id, 'REPLIED')}
                    className={`px-3 py-1 text-xs rounded font-medium border ${
                      selectedMessage.status === 'REPLIED'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Dibalas
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedMessage.id, 'ARCHIVED')}
                    className={`px-3 py-1 text-xs rounded font-medium border ${
                      selectedMessage.status === 'ARCHIVED'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Arsipkan
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Tanggapan%20Toko%20Usaha%20Anda`}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Kirim Email
                </a>
                {selectedMessage.phone && (
                  <a
                    href={`https://wa.me/${formatPhoneNumber(
                      selectedMessage.phone
                    )}?text=Halo%20${encodeURIComponent(
                      selectedMessage.name
                    )}%2C%20terima%20kasih%20telah%20menghubungi%20Toko%20Usaha%20Anda.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleStatusChange(selectedMessage.id, 'REPLIED')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Balas via WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
