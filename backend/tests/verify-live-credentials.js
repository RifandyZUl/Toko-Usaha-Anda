import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

async function testCredentials() {
  console.log('🔍 Checking Live Credentials (Gmail SMTP & Fonnte WhatsApp)...\n')

  // 1. Check Gmail SMTP
  console.log('📧 1. Testing Gmail SMTP Connection...')
  const user = process.env.SMTP_USER?.trim()
  const rawPass = process.env.SMTP_PASS || ''
  const pass = rawPass.replace(/\s+/g, '')

  console.log(`   User: ${user}`)
  console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 465}`)

  if (!user || !pass) {
    console.error('   ❌ SMTP_USER or SMTP_PASS is missing!')
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: { user, pass },
      })

      await transporter.verify()
      console.log('   ✅ Gmail SMTP Authentication SUCCESSFUL! Ready to send real OTP emails.')
    } catch (err) {
      console.error('   ❌ Gmail SMTP Authentication FAILED:', err.message)
    }
  }

  // 2. Check Fonnte WhatsApp Gateway
  console.log('\n📱 2. Testing Fonnte WhatsApp Token...')
  const fonnteToken = process.env.FONNTE_TOKEN?.trim()

  if (!fonnteToken) {
    console.error('   ❌ FONNTE_TOKEN is missing!')
  } else {
    try {
      // Check device status via Fonnte API
      const res = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
        },
      })

      const data = await res.json()
      console.log('   Fonnte API Response:', data)

      if (data.status === true) {
        console.log(`   ✅ Fonnte Token is VALID! Device: ${data.device || 'OK'}, Status: ${data.device_status || 'Ready'}`)
      } else {
        console.log(`   ⚠️ Fonnte responded: ${data.reason || data.message || JSON.stringify(data)}`)
      }
    } catch (err) {
      console.error('   ❌ Fonnte API check failed:', err.message)
    }
  }

  console.log('\n======================================================')
}

testCredentials().catch(console.error)
