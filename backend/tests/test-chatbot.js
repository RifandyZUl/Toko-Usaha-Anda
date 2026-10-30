import { processCustomerMessage } from '../src/services/chatbotService.js'

async function testChatbot() {
  console.log('🤖 Testing WhatsApp Chatbot Service Responses...\n')

  const testPhone = '081234567890'
  const customerName = 'Budi'

  // Test 1: Greeting / Menu
  console.log('1️⃣ Test: Greeting "halo"')
  const res1 = await processCustomerMessage(testPhone, 'halo', customerName)
  console.log('--- Respon ---')
  console.log(res1)
  if (!res1.includes('Kak Budi') || !res1.includes('Katalog')) throw new Error('Menu response invalid')

  // Test 2: Opsi 1 (Katalog)
  console.log('\n2️⃣ Test: Opsi 1 "katalog"')
  const res2 = await processCustomerMessage(testPhone, '1', customerName)
  console.log('--- Respon ---')
  console.log(res2)
  if (!res2.includes('/shop')) throw new Error('Catalog response invalid')

  // Test 3: Opsi 2 (Cek Pesanan)
  console.log('\n3️⃣ Test: Opsi 2 "cek pesanan"')
  const res3 = await processCustomerMessage(testPhone, '2', customerName)
  console.log('--- Respon ---')
  console.log(res3)
  if (!res3.includes('pesanan') && !res3.includes('belum ada')) throw new Error('Order check response invalid')

  // Test 4: Opsi 3 (Cara Bayar & COD)
  console.log('\n4️⃣ Test: Opsi 3 "bayar"')
  const res4 = await processCustomerMessage(testPhone, '3', customerName)
  console.log('--- Respon ---')
  console.log(res4)
  if (!res4.includes('COD') || !res4.includes('QRIS')) throw new Error('Payment response invalid')

  // Test 5: Opsi 4 (CS / Admin)
  console.log('\n5️⃣ Test: Opsi 4 "cs"')
  const res5 = await processCustomerMessage(testPhone, '4', customerName)
  console.log('--- Respon ---')
  console.log(res5)
  if (!res5.includes('admin')) throw new Error('CS response invalid')

  // Test 6: Fallback (Random chat)
  console.log('\n6️⃣ Test: Fallback "besok hujan ga"')
  const res6 = await processCustomerMessage(testPhone, 'besok hujan ga', customerName)
  console.log('--- Respon ---')
  console.log(res6)
  if (!res6.includes('Menu')) throw new Error('Fallback response invalid')

  console.log('\n🎉 ALL CHATBOT TESTS PASSED PERFECTLY!')
}

testChatbot().catch(err => {
  console.error('❌ Chatbot test failed:', err)
  process.exit(1)
})
