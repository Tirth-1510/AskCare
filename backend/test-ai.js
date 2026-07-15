require('dotenv').config();
const aiService = require('./services/ai.service');

// Hook into fetch to mock SmolLM3-3B behavior if no API Key is configured
const isLocal = process.env.SMOLLM_API_URL && (process.env.SMOLLM_API_URL.includes('localhost') || process.env.SMOLLM_API_URL.includes('127.0.0.1'));
const hasRealKey = isLocal || (process.env.SMOLLM_API_KEY && 
                    process.env.SMOLLM_API_KEY !== 'YOUR_SMOLLM_API_KEY' && 
                    process.env.SMOLLM_API_KEY.trim() !== '');

if (!hasRealKey) {
  console.log('================================================================');
  console.log('⚠️ SMOLLM_API_KEY is not configured with a live credential in .env');
  console.log('💡 Running test verification in Mock Simulation Mode.');
  console.log('================================================================\n');

  // Provide a temp mock key to pass validation check in ai.service
  process.env.SMOLLM_API_KEY = 'temp_smollm_test_key_123';

  // Override global fetch
  global.fetch = async (url, options) => {
    try {
      const requestBody = JSON.parse(options.body);
      const messages = requestBody.messages;
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      
      // Simulate typical network latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test Scenario 1: Refusal on Non-Medical / Off-topic domain
      if (lastMessage.includes('python') || lastMessage.includes('sort') || lastMessage.includes('capital')) {
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: "I'm sorry, as the AskCare AI assistant, I can only assist with healthcare and medical queries. Please feel free to ask any health-related questions."
              }
            }]
          })
        };
      }

      // Test Scenario 2: Timeout trigger simulation
      if (lastMessage.includes('simulate_timeout')) {
        await new Promise((resolve) => setTimeout(resolve, 25000)); // triggers >20000ms Abort signal
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        throw err;
      }

      // Test Scenario 3: Valid medical clinical guidance
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "Common symptoms of Type 2 diabetes include increased thirst, frequent urination, hunger, fatigue, and blurred vision. It is caused by insulin resistance.\n\nDisclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns."
            }
          }]
        })
      };
    } catch (e) {
      throw e;
    }
  };
} else {
  console.log('================================================================');
  console.log('🚀 Live Inference configuration detected.');
  console.log(`🔗 URL: ${process.env.SMOLLM_API_URL}`);
  console.log(`🤖 Model: ${process.env.SMOLLM_MODEL_NAME}`);
  console.log('================================================================\n');
}

// Verification runner
async function runTests() {
  console.log('⌛ Starting SmolLM3-3B integration validation...\n');

  // Test 1: Medical Question
  console.log('Test 1: Querying a medical concern ("What are the symptoms of Type 2 diabetes?")...');
  const response1 = await aiService.generateResponse([
    { sender: 'user', content: 'What are the symptoms of Type 2 diabetes?' }
  ]);
  console.log('\n--- AI RESPONSE ---');
  console.log(response1);
  console.log('-------------------\n');

  if (response1.toLowerCase().includes('disclaimer') && response1.toLowerCase().includes('diabetes')) {
    console.log('✅ Test 1 Passed: Correct clinical info and disclaimer appended.\n');
  } else {
    console.log('❌ Test 1 Failed: Response did not meet formatting/content instructions.\n');
  }

  // Test 2: Off-topic Refusal
  console.log('Test 2: Querying a non-medical concern ("Write a Python function to sort lists")...');
  const response2 = await aiService.generateResponse([
    { sender: 'user', content: 'Write a Python function to sort lists' }
  ]);
  console.log('\n--- AI RESPONSE ---');
  console.log(response2);
  console.log('-------------------\n');

  if (response2.toLowerCase().includes('only assist with healthcare')) {
    console.log('✅ Test 2 Passed: Non-medical query properly refused.\n');
  } else {
    console.log('❌ Test 2 Failed: AI did not refuse off-topic request.\n');
  }

  // Test 3: Timeout Graceful Handling
  console.log('Test 3: Testing timeout/failure handling ("simulate_timeout")...');
  const response3 = await aiService.generateResponse([
    { sender: 'user', content: 'simulate_timeout' }
  ]);
  console.log('\n--- AI RESPONSE ---');
  console.log(response3);
  console.log('-------------------\n');

  if (response3.includes('experiencing connection difficulties')) {
    console.log('✅ Test 3 Passed: Timeout error handled gracefully with user-friendly error message.\n');
  } else {
    console.log('❌ Test 3 Failed: Server failed to handle timeout exception.\n');
  }

  console.log('🏆 All tests completed.');
}

runTests();
