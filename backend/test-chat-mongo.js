process.env.PORT = 5077;

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_carebot_token_key_123!@#';

// Generate a valid MongoDB ObjectId for the test user
const testUserId = new mongoose.Types.ObjectId().toString();
const token = jwt.sign({ id: testUserId, email: 'mongo-test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

console.log('Generating test token with valid user ObjectId:', testUserId);

// Start server
require('./server.js');

// Give server and MongoDB connection a moment to start
setTimeout(async () => {
  console.log('\n=== RUNNING MONGO CHAT API TESTS ===');
  
  const baseUrl = 'http://localhost:5077/api/chat';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    let chatId = null;

    // 1. Create a new chat in MongoDB
    console.log('\n1. Testing POST /api/chat (Create New Chat in MongoDB)...');
    const resCreate = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'I have diabetes and need diet tips' })
    });
    const dataCreate = await resCreate.json();
    console.log('Response Status:', resCreate.status);
    console.log('Response Data:', JSON.stringify(dataCreate, null, 2));

    if (!dataCreate.success || !dataCreate.chat) {
      throw new Error('Create Chat in MongoDB failed');
    }
    chatId = dataCreate.chat.id || dataCreate.chat._id;
    console.log('Created Chat ID:', chatId);

    // 2. Continue the chat in MongoDB
    console.log('\n2. Testing POST /api/chat (Continue Chat in MongoDB)...');
    const resContinue = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chatId, message: 'What about sugar-free products?' })
    });
    const dataContinue = await resContinue.json();
    console.log('Response Status:', resContinue.status);
    console.log('Response Data:', JSON.stringify(dataContinue, null, 2));

    if (!dataContinue.success || dataContinue.chat.messages.length !== 4) {
      throw new Error('Continue Chat in MongoDB failed');
    }

    // 3. Get Chat History from MongoDB (Latest First check)
    console.log('\n3. Testing GET /api/chat/history from MongoDB...');
    const resHistory = await fetch(`${baseUrl}/history`, {
      method: 'GET',
      headers
    });
    const dataHistory = await resHistory.json();
    console.log('Response Status:', resHistory.status);
    console.log('Response Data:', JSON.stringify(dataHistory, null, 2));

    if (!dataHistory.success || dataHistory.history.length === 0) {
      throw new Error('Get History from MongoDB failed');
    }

    // 4. Update Chat Title in MongoDB (Rename)
    console.log(`\n4. Testing PATCH /api/chat/${chatId} (Rename Chat in MongoDB)...`);
    const resRename = await fetch(`${baseUrl}/${chatId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title: 'Diabetes Diet Consultation' })
    });
    const dataRename = await resRename.json();
    console.log('Response Status:', resRename.status);
    console.log('Response Data:', JSON.stringify(dataRename, null, 2));

    if (!dataRename.success || dataRename.chat.title !== 'Diabetes Diet Consultation') {
      throw new Error('Rename Chat in MongoDB failed');
    }

    // 5. Get Chat By ID from MongoDB
    console.log(`\n5. Testing GET /api/chat/${chatId} from MongoDB...`);
    const resGet = await fetch(`${baseUrl}/${chatId}`, {
      method: 'GET',
      headers
    });
    const dataGet = await resGet.json();
    console.log('Response Status:', resGet.status);
    console.log('Response Data:', JSON.stringify(dataGet, null, 2));

    if (!dataGet.success || dataGet.chat.title !== 'Diabetes Diet Consultation') {
      throw new Error('Get Chat By ID from MongoDB failed');
    }

    // 6. Delete Chat from MongoDB
    console.log(`\n6. Testing DELETE /api/chat/${chatId} from MongoDB...`);
    const resDelete = await fetch(`${baseUrl}/${chatId}`, {
      method: 'DELETE',
      headers
    });
    const dataDelete = await resDelete.json();
    console.log('Response Status:', resDelete.status);
    console.log('Response Data:', JSON.stringify(dataDelete, null, 2));

    if (!dataDelete.success) {
      throw new Error('Delete Chat from MongoDB failed');
    }

    // 7. Verify Delete in History
    console.log('\n7. Verifying delete in MongoDB history...');
    const resHistory2 = await fetch(`${baseUrl}/history`, {
      method: 'GET',
      headers
    });
    const dataHistory2 = await resHistory2.json();
    const chatExists = dataHistory2.history.some(c => (c.id || c._id) === chatId);
    console.log('Chat exists in history after delete:', chatExists);

    if (chatExists) {
      throw new Error('Chat was not deleted from MongoDB');
    }

    console.log('\n✅ ALL MONGO CHAT MODULE TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}, 6000); // 6 seconds timeout for MongoDB Atlas connection and server initialization
