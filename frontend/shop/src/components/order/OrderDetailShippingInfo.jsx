import Icon from '@shared/components/Icon.jsx'

/**
 * OrderDetailShippingInfo - Shipping recipient, courier tracking, and geolocation coordinates
 */
export default function OrderDetailShippingInfo({ order, onOpenTracking }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h2 className="text-sm font-heading font-semibold text-gray-900 uppercase tracking-wider">
          Informasi Pengiriman
        </h2>
        {order.status === 'SHIPPED' && (
          <button
            type="button"
            onClick={onOpenTracking}
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
          >
            <Icon name="Truck" size={13} />
            <span>Lacak Paket</span>
          </button>
        )}
      </div>

      <div className="space-y-4 text-xs text-gray-700">
        <div>
          <span className="text-gray-400 font-medium block mb-1 uppercase tracking-wider text-[10px]">
            Kurir Ekspedisi
          </span>
          <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Icon name="Truck" size={16} className="text-primary-600" />
            <span>{order.shippingCourier || 'JNE'} Express</span>
          </p>
        </div>

        <div>
          <span className="text-gray-400 font-medium block mb-1 uppercase tracking-wider text-[10px]">
            Alamat Pengiriman
          </span>
          <p className="leading-relaxed whitespace-pre-line text-gray-800 font-medium">
            {order.shippingAddress}
          </p>
          {order.shippingPhone && (
            <p className="text-gray-600 mt-1">
              No. Telepon: <strong>{order.shippingPhone}</strong>
            </p>
          )}
        </div>

        {order.latitude && order.longitude && (
          <div className="pt-3 border-t border-gray-100">
            <span className="text-gray-400 font-medium block mb-1 uppercase tracking-wider text-[10px]">
              Koordinat Lokasi (Pinpoint)
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-gray-600 text-[11px]">
                {order.latitude}, {order.longitude}
              </span>
              <a
                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1 rounded transition-colors"
              >
                <Icon name="MapPin" size={12} />
                Buka di Maps
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
