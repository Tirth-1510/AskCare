const MEDICAL_SYSTEM_PROMPT = `You are a clinical query resolution assistant for AskCare. You must strictly adhere to the following rules:
1. ONLY answer questions related to healthcare, medicine, symptoms, clinical guidelines, pharmacology, diagnostics, or wellness.
2. If the user asks a question that is outside the healthcare domain (e.g., general knowledge, coding, writing, mathematics, politics, history, etc.), you must politely refuse to answer. Use this exact refusal message: "I'm sorry, as the AskCare AI assistant, I can only assist with healthcare and medical queries. Please feel free to ask any health-related questions."
3. Provide evidence-based, concise, clear, and professional explanations.
4. Do NOT generate speculative, unproven, or unsupported medical claims. If you do not have enough evidence to support a claim, say so clearly.
5. ALWAYS conclude your response with the following exact medical disclaimer on a new line:
"Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns."`;

/**
 * Connect to SmolLM3-3B model using configurable credentials via fetch API.
 * @param {Array<{role: string, content: string}>} messages 
 * @returns {Promise<string>} AI response text
 */
const fetchSmolLMCompletion = async (messages) => {
  const apiKey = process.env.SMOLLM_API_KEY;
  const apiUrl = process.env.SMOLLM_API_URL || 'https://api.together.xyz/v1/chat/completions';
  const modelName = process.env.SMOLLM_MODEL_NAME || 'SmolLM3-3B';

  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isKeyInvalid = !apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_');

  if (!isLocal && isKeyInvalid) {
    throw new Error('SMOLLM_API_KEY is not configured. Please supply a valid key in your environment variables.');
  }

  // Prepend the strict medical prompt instructions
  const formattedMessages = [
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    ...messages
  ];

  const controller = new AbortController();
  // 20 second timeout to handle serverless API cold starts
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  const headers = {
    'Content-Type': 'application/json'
  };

  if (!isKeyInvalid) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature: 0.2, // low temperature for high reliability and clinical focus
        max_tokens: 512
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Inference API status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Inference API returned an empty or unexpected payload structure.');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Inference API connection timed out.');
    }
    throw error;
  }
};

// Local medical simulation client (runs when GEMMA_API_KEY is not configured or when API queries fail)
const getMockMedicalAnswer = (message, context = '') => {
  const msg = message.toLowerCase().trim();

  // Check if query is off-topic
  const isOffTopic = !(
    msg.includes('fever') || msg.includes('temp') || msg.includes('headache') ||
    msg.includes('migraine') || msg.includes('cough') || msg.includes('cold') ||
    msg.includes('flu') || msg.includes('throat') || msg.includes('stomach') ||
    msg.includes('nausea') || msg.includes('pain') || msg.includes('symptom') ||
    msg.includes('medicine') || msg.includes('pill') || msg.includes('dose') ||
    msg.includes('diabetes') || msg.includes('sugar') || msg.includes('pressure') ||
    msg.includes('hypertension') || msg.includes('heart') || msg.includes('cardio') ||
    msg.includes('health') || msg.includes('medical') || msg.includes('doctor') ||
    msg.includes('treat') || msg.includes('cure') || msg.includes('help')
  );

  if (isOffTopic) {
    return "I'm sorry, as the AskCare AI assistant, I can only assist with healthcare and medical queries. Please feel free to ask any health-related questions.";
  }

  let clinicalGuidance = "";

  if (msg.includes('fever') || msg.includes('temperature') || msg.includes('feverish')) {
    clinicalGuidance = "A fever is a temporary increase in body temperature, typically indicating your body is fighting off an infection. Rest and hydration are essential. Common medications to reduce fever include paracetamol (acetaminophen) or ibuprofen. Please consult a doctor or pharmacist for the correct dosage. Seek immediate medical attention if the fever exceeds 103°F (39.4°C) or persists for more than 3 days.";
  } else if (msg.includes('headache') || msg.includes('migraine')) {
    clinicalGuidance = "For headaches or migraines, resting in a quiet, dark room, staying hydrated, and applying a cool compress can provide relief. Pain relievers like paracetamol or ibuprofen are commonly used. Seek immediate medical evaluation if the headache is sudden and extremely severe or is accompanied by a stiff neck, fever, or confusion.";
  } else if (msg.includes('cough') || msg.includes('cold') || msg.includes('throat')) {
    clinicalGuidance = "For colds, coughs, and sore throats, rest and hydration are primary. Warm liquids, throat lozenges, or gargling with warm salt water can soothe irritation. If symptoms persist beyond 10 days, or if you experience shortness of breath, please seek medical evaluation.";
  } else if (msg.includes('diabetes') || msg.includes('sugar')) {
    clinicalGuidance = "Diabetes mellitus involves chronic blood glucose elevation due to insulin resistance or insufficiency. Common early symptoms include frequent urination, extreme thirst, fatigue, and blurred vision. Custom blood sugar monitoring and medical follow-up are necessary.";
  } else if (msg.includes('medicine') || msg.includes('pill') || msg.includes('dose')) {
    clinicalGuidance = "For medical conditions like fever, pain, or infections, standard over-the-counter medications like paracetamol or ibuprofen are commonly used. However, specific dosages depend on age, weight, and clinical status. Please consult a physician or a pharmacist to get safe, personalized medication instructions.";
  } else {
    clinicalGuidance = `Thank you for sharing your concern: "${message}". We recommend monitoring your physical symptoms closely, staying well-hydrated, and consulting a healthcare professional for an accurate diagnosis and treatment plan.`;
  }

  if (context) {
    clinicalGuidance += `\n\n[Clinical Context: ${context}]`;
  }

  return `${clinicalGuidance}\n\nDisclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns.`;
};

/**
 * Generate AI clinical guidance for a user query.
 * @param {Array<{sender: string, content: string}>} chatHistory 
 * @param {string} [context] Optional retrieved clinical document context
 * @returns {Promise<string>} response string
 */
exports.generateResponse = async (chatHistory, context = '') => {
  const apiKey = process.env.SMOLLM_API_KEY;
  const apiUrl = process.env.SMOLLM_API_URL || '';
  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isKeyPlaceholder = !apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_');

  // Load the last user query to determine domain refusal / mock fallback
  const lastUserMsgObj = [...chatHistory].reverse().find(msg => msg.sender === 'user');
  const userPrompt = lastUserMsgObj ? lastUserMsgObj.content : '';

  if (!isLocal && isKeyPlaceholder) {
    return getMockMedicalAnswer(userPrompt, context);
  }

  try {
    // Map internal db message format to LLM standard format (user / assistant roles)
    const messages = chatHistory.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

    const initialMessages = [];
    if (context) {
      initialMessages.push({
        role: 'system',
        content: `Relevant clinical context from patient's uploaded documents:\n${context}\nUse this information if helpful to answer the user's query.`
      });
    }

    const finalMessages = [...initialMessages, ...messages];

    return await fetchSmolLMCompletion(finalMessages);
  } catch (error) {
    console.error('SmolLM3-3B Integration Error:', error.message);
    // Fallback to local clinical mock simulation instead of a connection error message
    return getMockMedicalAnswer(userPrompt, context);
  }
};
