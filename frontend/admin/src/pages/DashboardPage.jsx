/**
 * Dashboard Page
 * Displays overview statistics and quick actions for admin
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react'
import { getProducts } from '../services/products'
import { getAllOrders } from '../services/orders'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { formatCurrency } from '../utils/format'
import { ORDER_STATUS } from '../constants/orderStatus'
import { ROUTES } from '../constants/routes'
import { logError } from '../utils/logger'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    // Sales statistics
    todayRevenue: 0,
    todayOrders: 0,
    weekRevenue: 0,
    weekOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    deliveredOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const [productsResult, ordersResult] = await Promise.all([
          getProducts({ limit: 1 }),
          getAllOrders(),
        ])

        if (!isMounted) return

        // Check for errors
        if (!productsResult.success || !ordersResult.success) {
          const errorMsg =
            productsResult.error || ordersResult.error || 'Gagal mengambil data statistik'
          setError(errorMsg)
          setLoading(false)
          return
        }

        const orders = ordersResult.orders || []

        // Get current date ranges
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Calculate total revenue from delivered orders
        const revenue = orders.reduce((sum, order) => {
          if (order.status === ORDER_STATUS.DELIVERED) {
            return sum + Number(order.totalAmount || 0)
          }
          return sum
        }, 0)

        // Calculate today's revenue and orders
        const todayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= todayStart && order.status === ORDER_STATUS.DELIVERED
        })
        const todayRevenue = todayOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0
        )

        // Calculate week's revenue and orders
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= weekStart && order.status === ORDER_STATUS.DELIVERED
        })
        const weekRevenue = weekOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0
        )

        // Calculate month's revenue and orders
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= monthStart && order.status === ORDER_STATUS.DELIVERED
        })
        const monthRevenue = monthOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0
        )

        // Count orders by status
        const pending = orders.filter(
          order => order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PROCESSING
        ).length

        const delivered = orders.filter(order => order.status === ORDER_STATUS.DELIVERED).length

        const processing = orders.filter(order => order.status === ORDER_STATUS.PROCESSING).length

        const shipped = orders.filter(order => order.status === ORDER_STATUS.SHIPPED).length

        setStats({
          totalProducts: productsResult.pagination?.total || 0,
          totalOrders: orders.length,
          totalRevenue: revenue,
          pendingOrders: pending,
          // Sales statistics
          todayRevenue,
          todayOrders: todayOrders.length,
          weekRevenue,
          weekOrders: weekOrders.length,
          monthRevenue,
          monthOrders: monthOrders.length,
          deliveredOrders: delivered,
          processingOrders: processing,
          shippedOrders: shipped,
        })
      } catch (error) {
        logError('Error fetching stats', error)
        if (isMounted) {
          setError('Terjadi kesalahan saat mengambil data statistik')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [])

  const statCards = [
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Pesanan',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Pendapatan',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Pesanan Pending',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
  ]

  if (loading) {
    return <Loading message="Memuat data statistik..." />
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Ringkasan aktivitas toko</p>
        </div>
        <ErrorMessage message={error} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">Ringkasan aktivitas toko</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sales Statistics */}
      <div className="card mb-8">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">Statistik Penjualan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Sales */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Hari Ini</h3>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(stats.todayRevenue)}
            </p>
            <p className="text-sm text-gray-600">{stats.todayOrders} pesanan selesai</p>
          </div>

          {/* Week's Sales */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">7 Hari Terakhir</h3>
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(stats.weekRevenue)}
            </p>
            <p className="text-sm text-gray-600">{stats.weekOrders} pesanan selesai</p>
          </div>

          {/* Month's Sales */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">30 Hari Terakhir</h3>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600 mb-1">
              {formatCurrency(stats.monthRevenue)}
            </p>
            <p className="text-sm text-gray-600">{stats.monthOrders} pesanan selesai</p>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="card">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">Status Pesanan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Diproses</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processingOrders}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Dikirim</p>
            <p className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={ROUTES.PRODUCTS}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors block group"
          >
            <Package className="h-6 w-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Kelola Produk</h3>
            <p className="text-sm text-gray-600">Tambah, edit, atau hapus produk</p>
          </Link>
          <Link
            to={ROUTES.ORDERS}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors block group"
          >
            <ShoppingCart className="h-6 w-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Kelola Pesanan</h3>
            <p className="text-sm text-gray-600">Lihat dan update status pesanan</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
