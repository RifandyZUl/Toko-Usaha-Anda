import { formatCurrency } from '../../utils/format'

/**
 * OrderDetailItemsCard - Order items list and pricing summary
 */
export default function OrderDetailItemsCard({ order, shippingFee = 0 }) {
  const totalAmountNum = Number(order.totalAmount || 0) + Number(shippingFee || 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
      <h2 className="text-sm font-heading font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
        Rincian Barang Belanjaan
      </h2>

      <div className="divide-y divide-gray-100">
        {order.items?.map((item, index) => {
          const productName = item.product?.name || item.name || 'Produk'
          const productImage =
            item.product?.images?.[0] ||
            item.product?.image ||
            item.image ||
            '/placeholder-product.png'

          return (
            <div key={index} className="py-3 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = '/placeholder-product.png'
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
                {item.variantName && (
                  <span className="inline-block text-[11px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded mt-0.5 font-semibold">
                    Varian: {item.variantName}
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {item.quantity} barang x {formatCurrency(item.price)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(item.price) * item.quantity)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal Produk:</span>
          <span className="font-medium text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
        </div>
        <div className="flex justify-between">
          <span>Biaya Pengiriman ({order.shippingCourier || 'JNE'}):</span>
          <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
        </div>
        <div className="flex justify-between text-sm font-heading font-semibold text-gray-900 pt-3 border-t border-dashed border-gray-200">
          <span>Total Pembayaran:</span>
          <span className="text-primary-600 font-bold">{formatCurrency(totalAmountNum)}</span>
        </div>
      </div>
    </div>
  )
}
