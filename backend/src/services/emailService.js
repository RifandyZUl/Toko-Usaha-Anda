import nodemailer from 'nodemailer'
import { logInfo, logError } from '../utils/logger.js'

/**
 * Buat transporter nodemailer jika kredensial SMTP tersedia
 */
const getTransporter = () => {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null

  if (!user || !pass) return null

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    auth: { user, pass },
  })
}

/**
 * Template HTML email kode verifikasi OTP
 */
const buildOtpEmailHtml = (otp) => {
  return `
    <div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #111827; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 2px; font-weight: 700;">TOKO USAHA ANDA</h1>
        <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Verifikasi Pendaftaran Akun</p>
      </div>
      <div style="padding: 32px 28px; text-align: center;">
        <p style="font-size: 15px; color: #374151; margin-bottom: 20px; line-height: 1.5;">
          Gunakan kode verifikasi berikut untuk menyelesaikan pendaftaran akun Anda:
        </p>
        <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 18px 24px; display: inline-block; margin: 12px 0 24px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #111827; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #4b5563; margin: 0 0 8px 0;">
          Kode ini berlaku selama <strong>1 menit</strong>.
        </p>
        <p style="font-size: 12px; color: #ef4444; margin: 0; font-weight: 500;">
          Penting: Jangan pernah membagikan kode OTP ini kepada siapa pun, termasuk pihak toko.
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">
          Jika Anda tidak merasa mendaftar di Toko Usaha Anda, abaikan email ini dengan aman.
        </p>
      </div>
    </div>
  `
}

/**
 * Kirim kode OTP ke email tujuan
 */
export const sendEmailOtp = async (email, otp) => {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || `"Toko Usaha Anda" <${process.env.SMTP_USER || 'noreply@tokousahaanda.com'}>`

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: `${otp} adalah Kode Verifikasi Pendaftaran Toko Usaha Anda`,
        html: buildOtpEmailHtml(otp),
        text: `Kode verifikasi Toko Usaha Anda: ${otp}. Berlaku selama 1 menit. Jangan bagikan kode ini kepada siapa pun.`,
      })

      logInfo(`Email OTP successfully sent to: ${email}`)
      return {
        success: true,
        message: 'Kode OTP telah berhasil dikirim ke email Anda.',
        simulated: false,
      }
    } catch (err) {
      logError('Gagal mengirim email OTP via SMTP Gmail:', err)
      throw new Error('Gagal mengirim email verifikasi. Pastikan konfigurasi SMTP benar.')
    }
  }

  // Fallback mode simulasi jika belum di-setting kredensial SMTP
  console.log(`\n======================================================`)
  console.log(`[SIMULASI EMAIL OTP GMAIL]`)
  console.log(`Email Tujuan : ${email}`)
  console.log(`Kode OTP     : ${otp}`)
  console.log(`Masa Berlaku : 1 Menit`)
  console.log(`Perhatian    : Pasang SMTP_USER dan SMTP_PASS di .env untuk kirim nyata`)
  console.log(`======================================================\n`)

  return {
    success: true,
    message: 'Kode OTP telah dikirim (Mode Simulasi). Cek konsol backend atau gunakan kode tertera.',
    simulated: true,
    devOtp: otp,
  }
}
