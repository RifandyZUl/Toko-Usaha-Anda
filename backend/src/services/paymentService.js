import { logError, logInfo } from '../utils/logger.js'

/**
 * Midtrans Payment Service
 * Isolates and manages all payment gateway integrations.
 */
class PaymentService {
  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
    
    this.snapEndpoint = this.isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      
    this.chargeEndpoint = this.isProduction
      ? 'https://api.midtrans.com/v2/charge'
      : 'https://api.sandbox.midtrans.com/v2/charge'
  }

  /**
   * Helper to get Authorization header
   * @returns {string} Base64 encoded auth header
   */
  _getAuthHeader() {
    if (!this.serverKey) {
      throw new Error('Midtrans server key is not configured')
    }
    const authString = Buffer.from(`${this.serverKey}:`).toString('base64')
    return `Basic ${authString}`
  }

  /**
   * Standard helper to transform order and user details to Midtrans payload
   */
  _prepareBasePayload(order, items, user, shippingPhone, shippingAddress) {
    const shippingFee = Number(order.shippingFee || 15000)
    const grossAmount = Math.round(Number(order.totalAmount) + shippingFee) // subtotal + dynamic shipping fee

    return {
      transaction_details: {
        order_id: order.id,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user?.name || 'Customer',
        email: user?.email || '',
        phone: shippingPhone,
        shipping_address: {
          first_name: user?.name || 'Customer',
          phone: shippingPhone,
          address: shippingAddress,
        },
      },
      item_details: [
        ...items.map(item => ({
          id: item.productId,
          price: Math.round(Number(item.product.price)),
          quantity: item.quantity,
          name: item.product.name.slice(0, 50),
        })),
        {
          id: 'shipping-fee',
          price: shippingFee,
          quantity: 1,
          name: 'Ongkos Kirim',
        },
      ],
    }
  }

  /**
   * Create Snap transaction token (reusable for general payment flow)
   */
  async createSnapToken(order, items, user, shippingPhone, shippingAddress) {
    try {
      logInfo('Creating Midtrans Snap transaction', { orderId: order.id })
      const payload = this._prepareBasePayload(order, items, user, shippingPhone, shippingAddress)
      
      // Add standard Snap configurations
      payload.credit_card = { secure: true }

      const response = await fetch(this.snapEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this._getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Midtrans Snap returned status ${response.status}: ${errText}`)
      }

      const result = await response.json()
      return {
        success: true,
        snapToken: result.token,
        redirectUrl: result.redirect_url,
      }
    } catch (error) {
      logError('Failed to create Midtrans Snap transaction', error)
      
      // Fallback to mock Snap details in development
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logInfo('Falling back to mock Snap Token for development testing')
        return {
          success: true,
          snapToken: `mock-snap-token-${order.id}`,
          redirectUrl: 'https://simulator.sandbox.midtrans.com',
          isMock: true
        }
      }
      throw error
    }
  }

  /**
   * Charge Virtual Account directly via Midtrans Core API
   * Supports: BCA, BNI, BRI, PERMATA, MANDIRI
   */
  async chargeVirtualAccount(order, items, user, shippingPhone, shippingAddress, bankName) {
    try {
      const bankKey = bankName.toLowerCase()
      logInfo('Charging Midtrans Virtual Account', { orderId: order.id, bank: bankKey })
      
      const basePayload = this._prepareBasePayload(order, items, user, shippingPhone, shippingAddress)
      let payload = {}

      if (bankKey === 'mandiri') {
        payload = {
          ...basePayload,
          payment_type: 'echannel',
          echannel: {
            bill_info1: 'Pembayaran Order',
            bill_info2: order.id.slice(0, 10),
          },
        }
      } else if (bankKey === 'permata') {
        payload = {
          ...basePayload,
          payment_type: 'permata',
        }
      } else {
        payload = {
          ...basePayload,
          payment_type: 'bank_transfer',
          bank_transfer: {
            bank: bankKey,
          },
        }
      }

      const response = await fetch(this.chargeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this._getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Midtrans Core charge returned status ${response.status}: ${errText}`)
      }

      const result = await response.json()
      
      if (result.status_code && !result.status_code.startsWith('2')) {
        throw new Error(`Midtrans API returned error ${result.status_code}: ${result.status_message}`)
      }
      
      let vaNumber = null
      let billerCode = null
      let billKey = null

      if (bankKey === 'mandiri') {
        billerCode = result.biller_code
        billKey = result.bill_key
      } else if (bankKey === 'permata') {
        vaNumber = result.permata_va_number
      } else if (result.va_numbers && result.va_numbers.length > 0) {
        vaNumber = result.va_numbers[0].va_number
      }

      return {
        success: true,
        transactionId: result.transaction_id,
        paymentType: result.payment_type,
        bankName: bankKey.toUpperCase(),
        vaNumber,
        billerCode,
        billKey,
        grossAmount: result.gross_amount,
        expiredAt: result.expiry_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      logError(`Failed to charge Midtrans VA (${bankName})`, error)
      
      // Fallback to mock VA in development mode
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logInfo('Falling back to mock Virtual Account for development testing')
        const bankKey = bankName.toLowerCase()
        const mockVa = bankKey === 'mandiri' ? null : `8910${Math.floor(10000000 + Math.random() * 90000000)}`
        const mockBillerCode = bankKey === 'mandiri' ? '70012' : null
        const mockBillKey = bankKey === 'mandiri' ? `83000${Math.floor(100000 + Math.random() * 900000)}` : null

        return {
          success: true,
          transactionId: `mock-tx-${order.id}`,
          paymentType: 'bank_transfer',
          bankName: bankName.toUpperCase(),
          vaNumber: mockVa,
          billerCode: mockBillerCode,
          billKey: mockBillKey,
          grossAmount: Math.round(Number(order.totalAmount) + Number(order.shippingFee || 15000)),
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isMock: true,
        }
      }
      
      throw error
    }
  }

  /**
   * Charge QRIS payment directly via Midtrans Core API
   */
  async chargeQris(order, items, user, shippingPhone, shippingAddress) {
    try {
      logInfo('Charging Midtrans QRIS', { orderId: order.id })
      const basePayload = this._prepareBasePayload(order, items, user, shippingPhone, shippingAddress)
      
      const payload = {
        ...basePayload,
        payment_type: 'qris',
        qris: {
          acquirer: 'gopay',
        },
      }

      const response = await fetch(this.chargeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this._getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Midtrans Core charge QRIS returned status ${response.status}: ${errText}`)
      }

      const result = await response.json()
      
      if (result.status_code && !result.status_code.startsWith('2')) {
        throw new Error(`Midtrans API returned error ${result.status_code}: ${result.status_message}`)
      }
      
      const qrCodeAction = result.actions?.find(action => action.name === 'generate-qr-code')
      const qrUrl = qrCodeAction?.url
      const qrString = qrCodeAction?.qr_string

      return {
        success: true,
        transactionId: result.transaction_id,
        paymentType: 'qris',
        qrUrl,
        qrString,
        grossAmount: result.gross_amount,
        expiredAt: result.expiry_time || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      logError('Failed to charge Midtrans QRIS', error)
      
      // Fallback to mock QRIS in development
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logInfo('Falling back to mock QRIS for development testing')
        return {
          success: true,
          transactionId: `mock-tx-${order.id}`,
          paymentType: 'qris',
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://simulator.sandbox.midtrans.com/qris/show?trade_type=qris%26transaction_id=mock-tx-${order.id}`,
          qrString: '00020101021226300016ID.CO.MANDIRI.WWW01189360000200123456785204592253033605802ID5915TOKO_USAHA_ANDA6007JAKARTA61051211062070703A016304A35F',
          grossAmount: Math.round(Number(order.totalAmount) + Number(order.shippingFee || 15000)),
          expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          isMock: true,
        }
      }
      throw error
    }
  }

  /**
   * Cancel transaction in Midtrans (used when user cancels their pending order)
   */
  async cancelTransaction(orderId) {
    try {
      if (!orderId || orderId.startsWith('mock-') || orderId.startsWith('test-')) {
        logInfo('Skipping Midtrans cancel API call for mock order', { orderId })
        return { success: true, message: 'Mock cancellation successful' }
      }

      logInfo('Cancelling Midtrans transaction', { orderId })
      const response = await fetch(`${this.chargeEndpoint.replace('/charge', '')}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this._getAuthHeader(),
        },
      })

      const result = await response.json()
      logInfo('Midtrans cancel response', { status: response.status, body: result })
      return result
    } catch (err) {
      logError('Failed to cancel Midtrans transaction', err)
      return { success: false, error: err.message }
    }
  }
}

export default new PaymentService()
