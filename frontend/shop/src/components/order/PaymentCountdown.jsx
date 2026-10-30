import { useState, useEffect } from 'react'
import Icon from '@shared/components/Icon.jsx'

/**
 * Countdown Timer Component for Payments
 */
export default function PaymentCountdown({ expiredAt, createdAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = expiredAt
        ? new Date(expiredAt).getTime()
        : new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
      const difference = targetTime - Date.now()
      if (difference <= 0) {
        return 'Batas waktu pembayaran telah habis'
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      return `${hours} jam ${minutes} menit ${seconds} detik`
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [expiredAt, createdAt])

  return (
    <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg text-center font-medium my-4 text-xs flex items-center justify-center gap-2">
      <Icon name="Clock" size={14} className="animate-pulse" />
      <span>
        Sisa Waktu Pembayaran: <strong className="font-mono">{timeLeft}</strong>
      </span>
    </div>
  )
}
