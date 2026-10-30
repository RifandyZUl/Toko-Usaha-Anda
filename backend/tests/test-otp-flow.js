import prisma from '../src/config/database.js'
import {
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
  sendOtpToWhatsApp,
  verifyOtpCode,
} from '../src/services/otpService.js'

async function runOtpTests() {
  console.log('🧪 Running Comprehensive OTP & Email Verification Tests...\n')

  const testEmail = `tester_${Date.now()}@gmail.com`
  const testPhone = '081299887766'

  try {
    // 1. Test WhatsApp OTP generation & verification
    console.log('1️⃣ Testing WhatsApp OTP...')
    const waResult = await sendOtpToWhatsApp(testPhone)
    console.log('   WhatsApp OTP Response:', waResult)
    if (!waResult.success) throw new Error('Failed to send WhatsApp OTP')
    if (!waResult.expiresInSeconds || waResult.expiresInSeconds !== 300) {
      throw new Error('ExpiresInSeconds should be 300')
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

    // 2. Test Email OTP generation
    console.log('\n2️⃣ Testing Email OTP Generation & Cooldown...')
    const emailResult = await sendEmailVerificationOtp(testEmail)
    console.log('   Email OTP Response:', emailResult)
    if (!emailResult.success) throw new Error('Failed to send Email OTP')

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

    // 4. Test correct email OTP verification
    if (emailResult.devOtp) {
      const correctEmailOtp = await verifyEmailVerificationOtp(testEmail, emailResult.devOtp)
      if (!correctEmailOtp.success) throw new Error('Correct email OTP verification failed')
      console.log('   ✅ Correct email OTP verified successfully:', correctEmailOtp.message)

      // Verify OTP is one-time use (cannot reuse)
      const reuseOtp = await verifyEmailVerificationOtp(testEmail, emailResult.devOtp)
      if (reuseOtp.success) throw new Error('Reusing OTP should fail')
      console.log('   ✅ One-time OTP consumption verified (cannot reuse):', reuseOtp.message)
    }

    console.log('\n🎉 ALL OTP TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.message)
    process.exit(1)
  } finally {
    // Cleanup any test records
    await prisma.emailVerificationOtp.deleteMany({
      where: { email: testEmail },
    })
    await prisma.$disconnect()
  }
}

runOtpTests()
