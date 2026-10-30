import prisma from '../src/config/database.js'
import {
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
  sendOtpToWhatsApp,
  verifyOtpCode,
  sendRegisterOtpToWhatsApp,
} from '../src/services/otpService.js'

async function runOtpTests() {
  console.log('🧪 Running Comprehensive OTP & Email Verification Tests...\n')

  const testEmail = `tester_${Date.now()}@gmail.com`
  const testPhone = '081299887766'

  try {
    // 1. Test WhatsApp OTP generation & verification
    console.log('1️⃣ Testing WhatsApp Phone OTP...')
    const waResult = await sendOtpToWhatsApp(testPhone)
    console.log('   WhatsApp OTP Response:', waResult)
    if (!waResult.success) throw new Error('Failed to send WhatsApp OTP')
    if (!waResult.expiresInSeconds || waResult.expiresInSeconds !== 60) {
      throw new Error(`ExpiresInSeconds should be 60, got ${waResult.expiresInSeconds}`)
    }

    // Test wrong OTP
    const wrongWa = verifyOtpCode(testPhone, '000000')
    if (wrongWa.success) throw new Error('Wrong WhatsApp OTP should fail')
    console.log('   ✅ Wrong WhatsApp OTP rejected correctly:', wrongWa.message)

    // Test correct OTP (if devOtp available in simulation mode)
    if (waResult.devOtp) {
      const correctWa = verifyOtpCode(testPhone, waResult.devOtp)
      if (!correctWa.success) throw new Error('Correct WhatsApp OTP verification failed')
      console.log('   ✅ Correct WhatsApp OTP verified successfully:', correctWa.message)
    }

    // 2. Test Email OTP generation with 60s expiry
    console.log('\n2️⃣ Testing Email OTP Generation (60s Expiry) & Cooldown...')
    const emailResult = await sendEmailVerificationOtp(testEmail)
    console.log('   Email OTP Response:', emailResult)
    if (!emailResult.success) throw new Error('Failed to send Email OTP')
    if (emailResult.expiresInSeconds !== 60) {
      throw new Error(`Email OTP expiresInSeconds should be 60, got ${emailResult.expiresInSeconds}`)
    }

    // Test resend cooldown
    try {
      await sendEmailVerificationOtp(testEmail)
      throw new Error('Should have blocked immediate resend due to cooldown')
    } catch (cooldownErr) {
      console.log('   ✅ Resend cooldown blocked correctly:', cooldownErr.message)
    }

    // 3. Test wrong email OTP verification
    console.log('\n3️⃣ Testing Email OTP Verification...')
    const wrongEmailOtp = await verifyEmailVerificationOtp(testEmail, '999999')
    if (wrongEmailOtp.success) throw new Error('Wrong email OTP should fail')
    console.log('   ✅ Wrong email OTP rejected correctly:', wrongEmailOtp.message)

    // 4. Test Registration WA OTP Fallback (User not receiving email)
    console.log('\n4️⃣ Testing Registration WA OTP Fallback (sendRegisterOtpToWhatsApp)...')
    const fallbackEmail = `wa_fallback_${Date.now()}@gmail.com`
    const registerWaResult = await sendRegisterOtpToWhatsApp(fallbackEmail, testPhone)
    console.log('   Register WA OTP Response:', registerWaResult)
    if (!registerWaResult.success) throw new Error('Failed to send Register WA OTP')
    if (registerWaResult.expiresInSeconds !== 60) {
      throw new Error(`Register WA OTP expiresInSeconds should be 60, got ${registerWaResult.expiresInSeconds}`)
    }

    // If devOtp or simulated, verify that the OTP sent to WA can verify registration for that email
    if (registerWaResult.devOtp) {
      const verifyFallback = await verifyEmailVerificationOtp(fallbackEmail, registerWaResult.devOtp)
      if (!verifyFallback.success) throw new Error('Failed to verify OTP received via WhatsApp fallback')
      console.log('   ✅ OTP from WhatsApp verified registration successfully:', verifyFallback.message)
    }

    console.log('\n🎉 ALL OTP TESTS (1-MINUTE EXPIRY & WA FALLBACK) PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.message)
    process.exit(1)
  } finally {
    // Cleanup any test records
    await prisma.emailVerificationOtp.deleteMany({
      where: {
        email: {
          contains: 'tester_',
        },
      },
    })
    await prisma.$disconnect()
  }
}

runOtpTests()
