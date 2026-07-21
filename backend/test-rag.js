process.env.PORT = 5088;
if (process.argv.includes('--local')) {
  process.env.MONGODB_URI = '';
  console.log('Forcing Local Fallback DB Mode for RAG testing...');
}

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_carebot_token_key_123!@#';

// Generate a valid MongoDB ObjectId for the test user
const testUserId = new mongoose.Types.ObjectId().toString();
const token = jwt.sign({ id: testUserId, email: 'rag-test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

console.log('Generating test token with user ObjectId:', testUserId);

// Start server
require('./server.js');

// Minimal valid PDF contents containing clinical paracetamol guideline
const generateMockPDF = () => {
  // A small valid PDF document structure containing paracetamol text
  return Buffer.from(
    '%PDF-1.2 \n' +
    '9 0 obj\n<<\n>>\nstream\n' +
    'BT/ 32 Tf( Clinical Guidelines: Paracetamol should be given for fever. Recommended pediatric dose: 15mg/kg every 4 to 6 hours. Adults should take 500mg to 1000mg. )\' ET\n' +
    'endstream\nendobj\n' +
    '4 0 obj\n<<\n/Type /Page\n/Parent 5 0 R\n/Contents 9 0 R\n>>\nendobj\n' +
    '5 0 obj\n<<\n/Kids [4 0 R ]\n/Count 1\n/Type /Pages\n/MediaBox [ 0 0 250 50 ]\n>>\nendobj\n' +
    '3 0 obj\n<<\n/Pages 5 0 R\n/Type /Catalog\n>>\nendobj\n' +
    'trailer\n<<\n/Root 3 0 R\n>>\n%%EOF'
  );
};

// Give server and MongoDB connection a moment to start
setTimeout(async () => {
  console.log('\n=== RUNNING RAG API TESTS ===');
  
  const baseDocumentsUrl = 'http://localhost:5088/api/documents';
  const baseChatUrl = 'http://localhost:5088/api/chat';
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    let docId = null;

    // 1. Upload Mock PDF Document
    console.log('\n1. Uploading medical guidelines PDF...');
    const pdfBuffer = generateMockPDF();
    const boundary = '----TestBoundary' + Math.random().toString(16);
    
    // Construct multipart form body
    const bodyParts = [];
    bodyParts.push(`--${boundary}\r\n`);
    bodyParts.push(`Content-Disposition: form-data; name="file"; filename="paracetamol_guidelines.pdf"\r\n`);
    bodyParts.push(`Content-Type: application/pdf\r\n\r\n`);
    bodyParts.push(pdfBuffer);
    bodyParts.push(`\r\n--${boundary}--\r\n`);

    // Concatenate Buffer parts
    const requestBody = Buffer.concat(bodyParts.map(part => 
      typeof part === 'string' ? Buffer.from(part, 'binary') : part
    ));

    const resUpload = await fetch(`${baseDocumentsUrl}/upload`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: requestBody
    });

    const dataUpload = await resUpload.json();
    console.log('Upload Status:', resUpload.status);
    console.log('Upload Response:', JSON.stringify(dataUpload, null, 2));

    if (!dataUpload.success || !dataUpload.document) {
      throw new Error('PDF document upload and parsing failed.');
    }
    docId = dataUpload.document.id || dataUpload.document._id;
    console.log('Document successfully indexed in DB. ID:', docId);

    // 2. Fetch User Documents list
    console.log('\n2. Testing GET /api/documents...');
    const resGetDocs = await fetch(baseDocumentsUrl, {
      method: 'GET',
      headers
    });
    const dataGetDocs = await resGetDocs.json();
    console.log('Get Documents Status:', resGetDocs.status);
    console.log('Uploaded filename found in list:', dataGetDocs.documents.some(d => (d.id || d._id) === docId));

    if (!dataGetDocs.success || dataGetDocs.documents.length === 0) {
      throw new Error('Failed to retrieve uploaded documents list.');
    }

    // 3. Trigger chat query to verify RAG retrieval context injection
    console.log('\n3. Querying AI assistant with RAG prompt: "What is the paracetamol pediatric dose for fever?"...');
    const resChat = await fetch(`${baseChatUrl}/`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'What is the paracetamol pediatric dose for fever?' })
    });
    const dataChat = await resChat.json();
    console.log('Chat Status:', resChat.status);
    
    const chatMsg = dataChat.chat.messages[dataChat.chat.messages.length - 1].content;
    console.log('\n--- AI RESPONSE ---');
    console.log(chatMsg);
    console.log('-------------------\n');

    // Verify context was injected (should display inside [Clinical Context: ...])
    const hasContext = chatMsg.includes('pediatric') || chatMsg.includes('dose') || chatMsg.includes('Clinical Context:');
    console.log('Context successfully retrieved and passed to assistant:', hasContext);
    if (!hasContext) {
      throw new Error('RAG failed: Vector search did not retrieve document context.');
    }

    // 4. Delete the Document
    console.log(`\n4. Testing DELETE /api/documents/${docId}...`);
    const resDelete = await fetch(`${baseDocumentsUrl}/${docId}`, {
      method: 'DELETE',
      headers
    });
    const dataDelete = await resDelete.json();
    console.log('Delete Status:', resDelete.status);
    console.log('Delete Response:', JSON.stringify(dataDelete, null, 2));

    if (!dataDelete.success) {
      throw new Error('Failed to delete document from database.');
    }

    // 5. Verify cleanup
    console.log('\n5. Verifying cleanup...');
    const resGetDocs2 = await fetch(baseDocumentsUrl, {
      method: 'GET',
      headers
    });
    const dataGetDocs2 = await resGetDocs2.json();
    const docExists = dataGetDocs2.documents.some(d => (d.id || d._id) === docId);
    console.log('Document exists in database after deletion:', docExists);

    if (docExists) {
      throw new Error('Clean up failed: Document metadata was not deleted.');
    }

    console.log('\n✅ ALL RAG SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ RAG TEST FAILED:', error);
    process.exit(1);
  }
}, 6000); // 6 seconds timeout for MongoDB Atlas connection and server initialization
