process.env.PORT = 5050;
process.env.MONGODB_URI = ''; // force local JSON DB mode for testing

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_carebot_token_key_123!@#';
const token = jwt.sign({ id: 'test_user_id_123', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

// Start server
require('./server.js');

// Give server a moment to start
setTimeout(async () => {
  console.log('\n=== RUNNING CHAT API TESTS ===');
  
  const baseUrl = 'http://localhost:5050/api/chat';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    let chatId = null;

    // 1. Create a new chat
    console.log('\n1. Testing POST /api/chat (Create New Chat)...');
    const resCreate = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'I have a high fever and headache' })
    });
    const dataCreate = await resCreate.json();
    console.log('Response Status:', resCreate.status);
    console.log('Response Data:', JSON.stringify(dataCreate, null, 2));

    if (!dataCreate.success || !dataCreate.chat) {
      throw new Error('Create Chat failed');
    }
    chatId = dataCreate.chat.id || dataCreate.chat._id;
    console.log('Created Chat ID:', chatId);

    // 2. Continue the chat
    console.log('\n2. Testing POST /api/chat (Continue Chat)...');
    const resContinue = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chatId, message: 'What should I do to reduce the headache?' })
    });
    const dataContinue = await resContinue.json();
    console.log('Response Status:', resContinue.status);
    console.log('Response Data:', JSON.stringify(dataContinue, null, 2));

    if (!dataContinue.success || dataContinue.chat.messages.length !== 4) {
      throw new Error('Continue Chat failed');
    }

    // 3. Get Chat History
    console.log('\n3. Testing GET /api/chat/history...');
    const resHistory = await fetch(`${baseUrl}/history`, {
      method: 'GET',
      headers
    });
    const dataHistory = await resHistory.json();
    console.log('Response Status:', resHistory.status);
    console.log('Response Data:', JSON.stringify(dataHistory, null, 2));

    if (!dataHistory.success || dataHistory.history.length === 0) {
      throw new Error('Get History failed');
    }

    // 4. Get Chat By ID
    console.log(`\n4. Testing GET /api/chat/${chatId}...`);
    const resGet = await fetch(`${baseUrl}/${chatId}`, {
      method: 'GET',
      headers
    });
    const dataGet = await resGet.json();
    console.log('Response Status:', resGet.status);
    console.log('Response Data:', JSON.stringify(dataGet, null, 2));

    if (!dataGet.success) {
      throw new Error('Get Chat By ID failed');
    }

    // 5. Delete Chat
    console.log(`\n5. Testing DELETE /api/chat/${chatId}...`);
    const resDelete = await fetch(`${baseUrl}/${chatId}`, {
      method: 'DELETE',
      headers
    });
    const dataDelete = await resDelete.json();
    console.log('Response Status:', resDelete.status);
    console.log('Response Data:', JSON.stringify(dataDelete, null, 2));

    if (!dataDelete.success) {
      throw new Error('Delete Chat failed');
    }

    // 6. Verify Delete in History
    console.log('\n6. Verifying delete in history...');
    const resHistory2 = await fetch(`${baseUrl}/history`, {
      method: 'GET',
      headers
    });
    const dataHistory2 = await resHistory2.json();
    const chatExists = dataHistory2.history.some(c => c.id === chatId);
    console.log('Chat exists in history after delete:', chatExists);

    if (chatExists) {
      throw new Error('Chat was not deleted from history');
    }

    console.log('\n✅ ALL CHAT MODULE TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}, 500);
