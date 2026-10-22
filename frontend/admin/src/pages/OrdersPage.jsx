/**
 * Orders Page
 * Displays and manages all orders with status updates
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Eye,
  CheckCircle,
  Package,
  Truck,
  X,
  Loader2,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { getAllOrders, updateOrderStatus } from '../services/orders'
import ErrorMessage from '../components/common/ErrorMessage'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { OrderCardSkeleton, Skeleton } from '../components/common/Skeleton'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_OPTIONS,
} from '../constants/orderStatus'
import { formatCurrency, formatDateTime, formatDate, formatOrderId, getMediaUrl } from '../utils/format'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../hooks/useToast'
import Pagination from '../components/common/Pagination'
import SearchBar from '../components/common/SearchBar'
import FilterSelect from '../components/common/FilterSelect'
import { usePagination, useSearchFilter, useConfirmDialog, useOrders } from '../hooks'
import { createErrorHandler } from '../utils/apiHelpers'
import { logError } from '../utils/logger'

export default function OrdersPage() {
  const { orders, loading, error, refresh, updateStatus } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [itemsPerPage] = useState(10)

  const { toasts, removeToast } = useToast()

  // Search and filter hooks
  const { searchTerm, filters, setSearch, setFilter, clearFilters } = useSearchFilter({
    onFilterChange: () => pagination.resetPage(),
  })
  const statusFilter = filters.status || ''

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter && order.status !== statusFilter) return false
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const orderId = formatOrderId(order.id).toLowerCase()
        const address = (order.shippingAddress || '').toLowerCase()
        const phone = (order.shippingPhone || '').toLowerCase()
        
        return orderId.includes(searchLower) || address.includes(searchLower) || phone.includes(searchLower)
      }
      return true
    })
  }, [orders, statusFilter, searchTerm])

  const pagination = usePagination(itemsPerPage, filteredOrders.length)
  const statusDialog = useConfirmDialog()

  /**
   * Handle status update
   */
  const handleStatusUpdateClick = useCallback((orderId, newStatus, orderNumber) => {
    statusDialog.openDialog({
      title: 'Update Status Pesanan',
      message: `Ubah status pesanan ${orderNumber} menjadi "${ORDER_STATUS_LABELS[newStatus]}"?`,
      onConfirm: async () => {
        setUpdatingStatus(orderId)
        const updated = await updateStatus(orderId, newStatus)
        if (updated) {
          if (selectedOrder?.id === orderId) setSelectedOrder(updated)
          statusDialog.closeDialog()
        }
        setUpdatingStatus(null)
      },
    })
  }, [statusDialog, updateStatus, selectedOrder])

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    processing: orders.filter(o => o.status === ORDER_STATUS.PROCESSING).length,
    shipped: orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
    delivered: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length,
    totalRevenue: orders
      .filter(o => o.status === ORDER_STATUS.DELIVERED)
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
  }



  // Update pagination total items
  useEffect(() => {
    pagination.resetPage()
  }, [searchTerm, statusFilter, pagination])

  // Paginate filtered orders
  const paginatedOrders = useMemo(() => {
    const start = pagination.startIndex
    const end = pagination.endIndex
    return filteredOrders.slice(start, end)
  }, [filteredOrders, pagination.startIndex, pagination.endIndex])

  // Status filter options
  const statusOptions = useMemo(() => {
    return ORDER_STATUS_OPTIONS.map(status => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    }))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Kelola Pesanan</h1>
        <p className="text-gray-600">Lihat dan update status pesanan</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Pesanan</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Processing</p>
              <p className="text-xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <Loader2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Shipped</p>
              <p className="text-xl font-bold text-indigo-600">{stats.shipped}</p>
            </div>
            <Truck className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Delivered</p>
              <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
              <p className="text-base font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <SearchBar
            value={searchTerm}
            onChange={setSearch}
            placeholder="Cari pesanan (ID, alamat, telepon)..."
          />
          <FilterSelect
            value={statusFilter}
            onChange={value => setFilter('status', value)}
            options={statusOptions}
            placeholder="Semua Status"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('status', '')}
            className={`px-3 py-1.5 text-sm rounded-sm font-medium transition-colors ${
              !statusFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua ({stats.total})
          </button>
          {ORDER_STATUS_OPTIONS.map(status => {
            const count = orders.filter(o => o.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilter('status', status)}
                className={`px-3 py-1.5 text-sm rounded-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ORDER_STATUS_LABELS[status]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm || statusFilter
                ? 'Tidak ada pesanan ditemukan dengan filter yang dipilih'
                : 'Tidak ada pesanan ditemukan'}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          paginatedOrders.map(order => (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Pesanan {formatOrderId(order.id)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ORDER_STATUS_COLORS[order.status] ||
                            ORDER_STATUS_COLORS[ORDER_STATUS.PENDING]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(Number(order.totalAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Items</p>
                      <p className="font-medium text-gray-700">{order.items?.length || 0} produk</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pembayaran</p>
                      <p className="font-medium text-gray-700">{order.paymentMethod || '-'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                    <p className="mb-1">
                      <strong>Alamat:</strong> {order.shippingAddress}
                    </p>
                    <p>
                      <strong>Telepon:</strong> {order.shippingPhone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detail</span>
                  </button>
                  {order.status === ORDER_STATUS.PENDING && (
                    <button
                      onClick={() =>
                        handleStatusUpdateClick(
                          order.id,
                          ORDER_STATUS.PROCESSING,
                          formatOrderId(order.id)
                        )
                      }
                      disabled={updatingStatus === order.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                    >
                      {updatingStatus === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Proses Pesanan</span>
                        </>
                      )}
                    </button>
                  )}
                  {order.status === ORDER_STATUS.PROCESSING && (
                    <button
                      onClick={() =>
                        handleStatusUpdateClick(
                          order.id,
                          ORDER_STATUS.SHIPPED,
                          formatOrderId(order.id)
                        )
                      }
                      disabled={updatingStatus === order.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                    >
                      {updatingStatus === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4" />
                          <span>Kirim Pesanan</span>
                        </>
                      )}
                    </button>
                  )}
                  {order.status === ORDER_STATUS.SHIPPED && (
                    <button
                      onClick={() =>
                        handleStatusUpdateClick(
                          order.id,
                          ORDER_STATUS.DELIVERED,
                          formatOrderId(order.id)
                        )
                      }
                      disabled={updatingStatus === order.id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                    >
                      {updatingStatus === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Tandai Selesai</span>
                        </>
                      )}
                    </button>
                  )}
                  {order.status === ORDER_STATUS.DELIVERED && (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-sm font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Pesanan Selesai</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
            onPageChange={page => {
              pagination.goToPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* Status Update Confirmation Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.dialog.isOpen}
        onClose={statusDialog.closeDialog}
        onConfirm={statusDialog.handleConfirm}
        title={statusDialog.dialog.title}
        message={statusDialog.dialog.message}
        confirmText={statusDialog.dialog.confirmText}
        cancelText={statusDialog.dialog.cancelText}
        variant="primary"
        isLoading={statusDialog.dialog.isLoading}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={(orderId, newStatus) => {
            const orderNumber = formatOrderId(orderId)
            handleStatusUpdateClick(orderId, newStatus, orderNumber)
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

/**
 * Order Detail Modal Component
 * Displays detailed order information and allows status updates
 */
function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  // Keyboard shortcuts: ESC to close
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-gray-900">
            Detail Pesanan {formatOrderId(order.id)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS[ORDER_STATUS.PENDING]
                }`}
              >
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tanggal</p>
              <p className="text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Metode Pembayaran</p>
              <p className="text-gray-900">{order.paymentMethod || '-'}</p>
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Informasi Pengiriman</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Alamat:</strong> {order.shippingAddress}
              </p>
              <p className="text-sm">
                <strong>Telepon:</strong> {order.shippingPhone}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Items Pesanan</h3>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                >
                  {item.product?.image && (
                    <img
                      src={getMediaUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product?.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {formatCurrency(Number(item.price))}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusUpdate(order.id, status)
                    onClose()
                  }}
                  disabled={order.status === status}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    order.status === status
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
