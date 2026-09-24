/**
 * ai.service.js — Medical AI Response Generation
 *
 * This service is the central AI integration layer for AskCare.
 * It is responsible for generating clinical AI responses to user queries.
 *
 * FOUR operating modes (evaluated in priority order):
 *
 *   1. MISTRAL AI MODE (Mistral Small 4):
 *      - Activated when mistral_api (or MISTRAL_API_KEY) is set in .env
 *      - Calls Mistral API chat completions endpoint (https://api.mistral.ai/v1/chat/completions)
 *      - Primary model: mistral-small-2603 (Mistral Small 4)
 *      - Includes graceful fallback for free-tier rate limits
 *
 *   2. CUSTOM MODEL MODE (Render-hosted Ollama or any remote OpenAI-compatible API):
 *      - Activated when USE_CUSTOM_MODEL=true in .env
 *      - Calls CUSTOM_MODEL_URL (e.g. Render-hosted Ollama endpoint)
 *      - Uses the CUSTOM_MODEL_NAME identifier (defaults to 'askcare-medical')
 *      - Enables 24/7 availability even when the developer's laptop is off
 *
 *   3. SMOLLM / EXTERNAL API MODE (Together.xyz, local Ollama, etc.):
 *      - Activated when USE_CUSTOM_MODEL is false/absent AND SMOLLM_API_KEY is set
 *      - Sends the conversation history + RAG context to the LLM API
 *      - Uses a strict medical system prompt to constrain the model
 *      - Temperature: 0.2 (low, for reliable factual medical responses)
 *
 *   4. MOCK/FALLBACK MODE (local pattern matching):
 *      - Activated when no API is configured or when all upstream APIs fail
 *      - Uses keyword-based pattern matching to return canned clinical guidance
 *      - Ensures the app is always functional even without an API key
 *
 * Environment variables:
 *   mistral_api         — Mistral API key (from console.mistral.ai)
 *   MISTRAL_MODEL_NAME  — Model name on Mistral (defaults to 'mistral-small-2603' / Mistral Small 4)
 *   USE_CUSTOM_MODEL    — Set to 'true' to use the Render-hosted custom model
 *   CUSTOM_MODEL_URL    — Full URL to the custom model's /v1/chat/completions endpoint
 *   CUSTOM_MODEL_NAME   — Model name on the custom server (defaults to 'askcare-medical')
 *   SMOLLM_API_KEY      — API key for the Together.xyz inference endpoint (Mode 3)
 *   SMOLLM_API_URL      — Inference API base URL (defaults to Together.xyz) (Mode 3)
 *   SMOLLM_MODEL_NAME   — Model identifier on the API (defaults to 'SmolLM3-3B') (Mode 3)
 */

/**
 * MEDICAL_SYSTEM_PROMPT — Strict behavioral constraints for the clinical AI.
 * Injected as the first system message in every LLM request.
 * Ensures the AI:
 *   - Only answers healthcare/medical questions
 *   - Refuses off-topic queries with a specific message
 *   - Always appends the medical disclaimer
 */
const MEDICAL_BASE_SYSTEM_PROMPT = `You are an expert clinical query resolution assistant for AskCare. You provide evidence-based, empathetic, structured, and easy-to-read medical information.

You must strictly adhere to the following rules:
1. CLINICAL DOMAIN FOCUS:
   - Provide guidance on healthcare, symptoms, clinical guidelines, pharmacology, diagnostics, triage, and wellness.
   - Refuse purely non-medical requests (such as coding, general trivia, politics, entertainment, writing essays) with this exact message:
     "I'm sorry, as the AskCare AI assistant, I can only assist with healthcare and medical queries. Please feel free to ask any health-related questions."
2. MULTI-TURN CONVERSATION MEMORY:
   - You have complete access to the chronological conversation history of this consultation thread.
   - You MUST remember and reference all details provided earlier in this conversation (the patient's name, age, symptoms, timeline, allergy information, and medications discussed).
   - Conversational follow-ups, memory checks (e.g., "What is my name?", "What did I ask earlier?", "Can you summarize what we discussed?", "Can I take that if my fever is gone?") are 100% legitimate consultation queries. NEVER refuse follow-up or memory questions as off-topic.
3. EVIDENCE-BASED & SAFE:
   - Provide accurate, evidence-based, professional medical explanations.
   - Clearly highlight drug allergies, contraindications, and emergency warning signs.
4. PRODUCTION-GRADE FORMATTING RULES:
   - Begin with a warm, empathetic 1-sentence clinical summary or reassurance.
   - Organize your response using clean Markdown headings (e.g. ### Immediate Care, ### Medications & Hydration, ### When to Seek Medical Attention). NEVER put asterisks inside heading hashes (write '### Immediate Measures', NEVER '### **Immediate Measures:**').
   - Use numbered lists (1., 2., 3.) for priority actions or steps.
   - Use bullet points (- ) for symptoms, options, and food/lifestyle recommendations. Always write clean natural words (never do awkward letter-by-letter bolding like '- **B**ananas').
   - Bold key medical terms, drug names, and critical warnings (**like this**) so they stand out clearly for the patient.
   - Keep paragraphs concise (2-3 sentences max) with comfortable line spacing.
5. ALWAYS conclude your response with the following exact medical disclaimer on a new line:
"Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns."`;

/**
 * buildSystemPrompt — Constructs the complete system prompt injecting
 * the patient's persistent clinical memory and RAG document context.
 *
 * @param {Object|null} clinicalMemory — User's persistent clinical facts
 * @param {string} ragContext — Retrieved document chunks
 * @returns {string} The unified system prompt
 */
const buildSystemPrompt = (clinicalMemory = null, ragContext = '') => {
  let prompt = MEDICAL_BASE_SYSTEM_PROMPT;

  if (clinicalMemory) {
    const memoryItems = [];
    if (clinicalMemory.patientName) {
      memoryItems.push(`- Patient Name: ${clinicalMemory.patientName}`);
    }
    if (clinicalMemory.allergies && clinicalMemory.allergies.length > 0) {
      memoryItems.push(`- Known Allergies: ${clinicalMemory.allergies.join(', ')} (SAFETY WARNING: Avoid recommending these medications)`);
    }
    if (clinicalMemory.chronicConditions && clinicalMemory.chronicConditions.length > 0) {
      memoryItems.push(`- Chronic Conditions: ${clinicalMemory.chronicConditions.join(', ')}`);
    }
    if (clinicalMemory.medications && clinicalMemory.medications.length > 0) {
      memoryItems.push(`- Ongoing Medications: ${clinicalMemory.medications.join(', ')}`);
    }
    if (clinicalMemory.memories && clinicalMemory.memories.length > 0) {
      memoryItems.push(`- Patient Notes:\n  * ${clinicalMemory.memories.join('\n  * ')}`);
    }

    if (memoryItems.length > 0) {
      prompt += `\n\n[CONFIDENTIAL PATIENT CLINICAL PROFILE & USER MEMORY]\n${memoryItems.join('\n')}\n(Use this patient background knowledge to personalize your advice, enforce safety constraints, and address the patient respectfully.)`;
    }
  }

  if (ragContext) {
    prompt += `\n\n[CLINICAL CONTEXT FROM PATIENT'S UPLOADED DOCUMENTS]\n${ragContext}\n(Incorporate this reference context if relevant to the query.)`;
  }

  return prompt;
};

/**
 * Clinical entity reference dictionaries for robust, zero-latency extraction
 */
const CONDITIONS_MAP = [
  { match: /\b(?:chest\s+pain|pain\s+in\s+(?:my\s+)?chest|heavy\s+(?:and\s+.*)?pain\s+in\s+(?:my\s+)?chest|tightness\s+in\s+chest|heavy\s+chest|chest\s+discomfort)\b/i, name: 'Chest Pain / Discomfort' },
  { match: /\b(?:dyriaa|diarrhea|diarrhoea|diarhea|watery\s+stool|loose\s+motion|loose\s+stools)\b/i, name: 'Diarrhea' },
  { match: /\b(?:hypertension|high\s+bp|high\s+blood\s+pressure|mild\s+hypertension|essential\s+hypertension|elevated\s+blood\s+pressure)\b/i, name: 'Hypertension' },
  { match: /\b(?:type\s+2\s+diabetes|type\s+1\s+diabetes|diabetes|diabetic|high\s+sugar|high\s+blood\s+sugar|hyperglycemia)\b/i, name: 'Diabetes' },
  { match: /\b(?:asthma|asthmatic|wheezing|respiratory\s+issues|shortness\s+of\s+breath|breathlessness|copd)\b/i, name: 'Asthma / Respiratory' },
  { match: /\b(?:gerd|acid\s+reflux|heartburn|gastritis|stomach\s+ulcer|hyperacidity)\b/i, name: 'Acid Reflux / GERD' },
  { match: /\b(?:migraine|migraines|chronic\s+headache|cluster\s+headache)\b/i, name: 'Migraines' },
  { match: /\b(?:arthritis|joint\s+pain|osteoarthritis|rheumatoid\s+arthritis)\b/i, name: 'Arthritis' },
  { match: /\b(?:hypothyroid|hyperthyroid|thyroid\s+disorder|hypothyroidism|hyperthyroidism)\b/i, name: 'Thyroid Disorder' },
  { match: /\b(?:high\s+cholesterol|hyperlipidemia|high\s+lipids|elevated\s+cholesterol)\b/i, name: 'High Cholesterol' },
  { match: /\b(?:kidney\s+disease|kidney\s+stones|chronic\s+kidney|renal\s+disease)\b/i, name: 'Kidney Disease' },
  { match: /\b(?:heart\s+disease|coronary\s+artery|angina|arrhythmia|heart\s+condition)\b/i, name: 'Heart Disease' },
  { match: /\b(?:anxiety|panic\s+attacks|chronic\s+anxiety)\b/i, name: 'Anxiety' },
  { match: /\b(?:depression|depressive\s+disorder)\b/i, name: 'Depression' },
  { match: /\b(?:eczema|psoriasis|chronic\s+urticaria|dermatitis)\b/i, name: 'Eczema / Skin Condition' },
  { match: /\b(?:insomnia|sleep\s+apnea)\b/i, name: 'Insomnia' }
];

const MEDICATIONS_MAP = [
  { match: /\b(?:paracetamol|acetaminophen|tylenol|panadol|calpol)\b/i, name: 'Paracetamol' },
  { match: /\b(?:metformin|glucophage)\b/i, name: 'Metformin' },
  { match: /\b(?:amlodipine|norvasc)\b/i, name: 'Amlodipine' },
  { match: /\b(?:lisinopril|zestril|prinivil)\b/i, name: 'Lisinopril' },
  { match: /\b(?:aspirin|ecotrin|disprin)\b/i, name: 'Aspirin' },
  { match: /\b(?:ibuprofen|advil|motrin|nurofen)\b/i, name: 'Ibuprofen' },
  { match: /\b(?:atorvastatin|lipitor)\b/i, name: 'Atorvastatin' },
  { match: /\b(?:omeprazole|prilosec)\b/i, name: 'Omeprazole' },
  { match: /\b(?:pantoprazole|protonix)\b/i, name: 'Pantoprazole' },
  { match: /\b(?:insulin|glargine|humalog|novolog)\b/i, name: 'Insulin' },
  { match: /\b(?:albuterol|ventolin|salbutamol|inhaler)\b/i, name: 'Albuterol Inhaler' },
  { match: /\b(?:losartan|cozaar)\b/i, name: 'Losartan' },
  { match: /\b(?:metoprolol|lopressor|toprol)\b/i, name: 'Metoprolol' },
  { match: /\b(?:amoxicillin|augmentin)\b/i, name: 'Amoxicillin' },
  { match: /\b(?:azithromycin|zithromax)\b/i, name: 'Azithromycin' },
  { match: /\b(?:cetirizine|zyrtec)\b/i, name: 'Cetirizine' },
  { match: /\b(?:levothyroxine|synthroid)\b/i, name: 'Levothyroxine' },
  { match: /\b(?:gabapentin|neurontin)\b/i, name: 'Gabapentin' },
  { match: /\b(?:sertraline|zoloft)\b/i, name: 'Sertraline' }
];

const ALLERGIES_MAP = [
  { match: /\b(?:penicillin|amoxicillin)\s+allergy|allergic\s+to\s+(?:penicillin|amoxicillin)\b/i, name: 'Penicillin' },
  { match: /\b(?:peanut|peanuts)\s+allergy|allergic\s+to\s+peanuts?\b/i, name: 'Peanuts' },
  { match: /\b(?:sulfa|sulfonamide)\s+allergy|allergic\s+to\s+sulfa\b/i, name: 'Sulfa drugs' },
  { match: /\b(?:aspirin|nsaids?)\s+allergy|allergic\s+to\s+(?:aspirin|nsaids?)\b/i, name: 'Aspirin / NSAIDs' },
  { match: /\b(?:shellfish|seafood)\s+allergy|allergic\s+to\s+(?:shellfish|seafood)\b/i, name: 'Shellfish' },
  { match: /\b(?:dairy|milk|lactose\s+intoleran)/i, name: 'Dairy / Lactose' },
  { match: /\b(?:gluten|celiac)\b/i, name: 'Gluten' },
  { match: /\b(?:egg|eggs)\s+allergy|allergic\s+to\s+eggs?\b/i, name: 'Eggs' },
  { match: /\b(?:dust|pollen|pollen\s+allergy|hay\s+fever)\b/i, name: 'Pollen / Dust' }
];

/**
 * extractUserClinicalFacts — Automatically extracts persistent patient facts
 * (name, allergies, chronic conditions, medications) from user messages.
 *
 * @param {string} text — The user's input text
 * @returns {Object|null} Extracted facts with array properties
 */
const extractUserClinicalFacts = (text) => {
  if (!text) return null;
  const t = text.trim();
  const allergies = [];
  const chronicConditions = [];
  const medications = [];
  let patientName = null;

  // 1. Name extraction
  const nameMatch = t.match(/\b(?:my name is|call me|name's)\s+([A-Z][a-zA-Z]+)/i);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    const excluded = ['here', 'feeling', 'having', 'taking', 'suffering', 'sorry', 'sick', 'allergic', 'asking', 'wondering', 'today', 'doctor'];
    if (!excluded.includes(candidate.toLowerCase()) && candidate.length > 1) {
      patientName = candidate;
    }
  }

  // 2. Conditions & active symptoms from dictionary
  for (const item of CONDITIONS_MAP) {
    if (item.match.test(t)) {
      if (!chronicConditions.includes(item.name)) {
        chronicConditions.push(item.name);
      }
    }
  }

  // Flexible condition pattern: "I have / diagnosed with / suffer from ..." (if not already matched)
  if (chronicConditions.length === 0) {
    const flexCond = t.match(/\b(?:i have|i suffer from|diagnosed with|i am diagnosed with|i was diagnosed with|history of|struggling with|dealing with)\s+([a-zA-Z\s]{3,35}?)(?:\.|$|,|\band\b)/i);
    if (flexCond && flexCond[1]) {
      const rawCond = flexCond[1].trim();
      const cleanCond = rawCond.replace(/^(a|an|the|severe|mild|chronic)\s+/i, '').trim();
      const excluded = ['a question', 'questions', 'doubt', 'concerns', 'idea', 'doctor', 'appointment', 'allergy', 'allergies'];
      const hasAllergyWord = /\ballerg(?:ic|y)\b/i.test(cleanCond);
      if (cleanCond.length >= 3 && cleanCond.length <= 35 && !excluded.includes(cleanCond.toLowerCase()) && !hasAllergyWord) {
        const formatted = cleanCond.charAt(0).toUpperCase() + cleanCond.slice(1);
        if (!chronicConditions.some(c => c.toLowerCase() === formatted.toLowerCase())) {
          chronicConditions.push(formatted);
        }
      }
    }
  }

  // 3. Medications from dictionary
  for (const item of MEDICATIONS_MAP) {
    if (item.match.test(t)) {
      if (!medications.includes(item.name)) {
        medications.push(item.name);
      }
    }
  }

  // Flexible medication pattern: "I take / taking / on medication / prescribed ..." (if not already matched)
  if (medications.length === 0) {
    const flexMed = t.match(/\b(?:i take|i am taking|i'm taking|currently taking|prescribed|prescribed with|on medication|taking|using)\s+([A-Za-z0-9\s]{3,30}?)(?:\s+(?:daily|every day|twice|once|mg|tablet|pills|syrup)|$|,|\.|\band\b)/i);
    if (flexMed && flexMed[1]) {
      const rawMed = flexMed[1].trim();
      const cleanMed = rawMed.replace(/^(a|an|some|my)\s+/i, '').trim();
      const excluded = ['medicine', 'medication', 'pills', 'rest', 'care', 'water', 'sleep', 'food', 'tablets'];
      if (cleanMed.length >= 3 && cleanMed.length <= 30 && !excluded.includes(cleanMed.toLowerCase())) {
        const formatted = cleanMed.charAt(0).toUpperCase() + cleanMed.slice(1);
        if (!medications.some(m => m.toLowerCase() === formatted.toLowerCase())) {
          medications.push(formatted);
        }
      }
    }
  }


  // 4. Allergies from dictionary & patterns
  for (const item of ALLERGIES_MAP) {
    if (item.match.test(t)) {
      if (!allergies.includes(item.name)) {
        allergies.push(item.name);
      }
    }
  }

  // Flexible allergy pattern: "allergic to ...", "... allergy"
  const flexAllergy = t.match(/\ballerg(?:ic|y)\s+(?:to|with)?\s+([a-zA-Z0-9\s,-]+?)(?:\.|$|,|\band\b)/i);
  if (flexAllergy && flexAllergy[1]) {
    const rawAllergy = flexAllergy[1].trim().replace(/^(a|an|the)\s+/i, '').trim();
    if (rawAllergy.length >= 3 && rawAllergy.length <= 30) {
      const formatted = rawAllergy.charAt(0).toUpperCase() + rawAllergy.slice(1);
      if (!allergies.some(a => a.toLowerCase() === formatted.toLowerCase())) {
        allergies.push(formatted);
      }
    }
  }

  const hasData = patientName || allergies.length > 0 || chronicConditions.length > 0 || medications.length > 0;
  if (!hasData) return null;

  return {
    patientName,
    allergies,
    chronicConditions,
    medications,
    // Backward compatibility for singular access
    allergy: allergies[0] || null,
    condition: chronicConditions[0] || null,
    medication: medications[0] || null
  };
};

/**
 * mergeClinicalFacts — Safely merges new clinical facts into an existing user profile.
 * Prevents duplicates (case-insensitive) and updates patientName if newly provided.
 *
 * @param {Object} existingProfile
 * @param {Object} newFacts
 * @returns {{ updatedProfile: Object, changed: boolean }}
 */
const mergeClinicalFacts = (existingProfile, newFacts) => {
  if (!newFacts) return { updatedProfile: existingProfile, changed: false };

  const updated = {
    patientName: existingProfile?.patientName || '',
    allergies: Array.isArray(existingProfile?.allergies) ? [...existingProfile.allergies] : [],
    chronicConditions: Array.isArray(existingProfile?.chronicConditions) ? [...existingProfile.chronicConditions] : [],
    medications: Array.isArray(existingProfile?.medications) ? [...existingProfile.medications] : [],
    memories: Array.isArray(existingProfile?.memories) ? [...existingProfile.memories] : []
  };

  let changed = false;

  // Patient Name
  if (newFacts.patientName && typeof newFacts.patientName === 'string' && newFacts.patientName.trim()) {
    const cleanName = newFacts.patientName.trim();
    if (updated.patientName !== cleanName) {
      updated.patientName = cleanName;
      changed = true;
    }
  }

  // Allergies
  const newAllergies = Array.isArray(newFacts.allergies)
    ? newFacts.allergies
    : (newFacts.allergy ? [newFacts.allergy] : []);

  for (const item of newAllergies) {
    if (typeof item === 'string' && item.trim()) {
      const clean = item.trim();
      if (!updated.allergies.some(a => a.toLowerCase() === clean.toLowerCase())) {
        updated.allergies.push(clean);
        changed = true;
      }
    }
  }

  // Chronic Conditions
  const newConditions = Array.isArray(newFacts.chronicConditions)
    ? newFacts.chronicConditions
    : (newFacts.condition ? [newFacts.condition] : []);

  for (const item of newConditions) {
    if (typeof item === 'string' && item.trim()) {
      const clean = item.trim();
      if (!updated.chronicConditions.some(c => c.toLowerCase() === clean.toLowerCase())) {
        updated.chronicConditions.push(clean);
        changed = true;
      }
    }
  }

  // Medications
  const newMeds = Array.isArray(newFacts.medications)
    ? newFacts.medications
    : (newFacts.medication ? [newFacts.medication] : []);

  for (const item of newMeds) {
    if (typeof item === 'string' && item.trim()) {
      const clean = item.trim();
      if (!updated.medications.some(m => m.toLowerCase() === clean.toLowerCase())) {
        updated.medications.push(clean);
        changed = true;
      }
    }
  }

  // General Memories/Notes
  if (Array.isArray(newFacts.memories)) {
    for (const item of newFacts.memories) {
      if (typeof item === 'string' && item.trim()) {
        const clean = item.trim();
        if (!updated.memories.some(m => m.toLowerCase() === clean.toLowerCase())) {
          updated.memories.push(clean);
          changed = true;
        }
      }
    }
  }

  return { updatedProfile: updated, changed };
};

/**
 * extractClinicalFactsWithAI — High-accuracy LLM extractor using Mistral 7B.
 * Runs in parallel or asynchronously to extract nuanced clinical background facts.
 *
 * @param {string} text — The user's input message
 * @returns {Promise<Object|null>}
 */
const extractClinicalFactsWithAI = async (text) => {
  if (!text || text.trim().length < 5) return null;
  const apiKey = process.env.mistral_api || process.env.MISTRAL_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s fast timeout

    const response = await fetch(process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [
          {
            role: 'system',
            content: 'You are a clinical memory entity extractor. From the user text, identify personal patient background facts (patient name, drug/food allergies, chronic/active health conditions or symptoms, and ongoing medications). Return ONLY a JSON object: {"patientName": string|null, "allergies": string[], "chronicConditions": string[], "medications": string[]}. If none mentioned, return empty arrays. Return NO markdown code blocks or extra text.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) return null;

    // Clean JSON markdown if wrapped in ```json ... ```
    const cleanJson = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      patientName: parsed.patientName || null,
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      chronicConditions: Array.isArray(parsed.chronicConditions) ? parsed.chronicConditions : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : []
    };
  } catch (err) {
    // Fail silently so LLM extraction never interferes with regular conversation flow
    return null;
  }
};

/**
 * fetchMistralCompletion — Calls the Mistral AI API for Mistral models.
 *
 * Supports Mistral 7B (open-mistral-7b), Ministral 8B (ministral-8b-latest),
 * and Mistral Small 4 (mistral-small-2603).
 *
 * Uses the API key configured in `mistral_api` (from .env).
 * Default model: open-mistral-7b (Mistral 7B Instruct - high performance, low latency).
 * If rate-limited on free tier (tier 0 quota on 119B MoE), automatically attempts
 * open-mistral-7b or ministral-8b-latest so user requests are never blocked.
 *
 * @param {Array<{role: string, content: string}>} messages — Formatted LLM messages
 * @param {string} systemPrompt — Unified system prompt with instructions and memory
 * @param {string} [targetModel] — The model identifier to use (e.g. 'open-mistral-7b')
 * @returns {Promise<{content: string, modelUsed: string}>} The clinical response and actual model used
 */
const fetchMistralCompletion = async (messages, systemPrompt = MEDICAL_BASE_SYSTEM_PROMPT, targetModel = null) => {
  const apiKey = process.env.mistral_api || process.env.MISTRAL_API_KEY;
  const configuredModel = targetModel || process.env.MISTRAL_MODEL_NAME || 'open-mistral-7b';
  const apiUrl = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    throw new Error('mistral_api is not configured in .env. Please check your environment variables.');
  }

  // Single unified system message at index 0 followed by dialogue turns
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const callMistral = async (modelToCall) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: modelToCall,
          messages: formattedMessages,
          temperature: 0.2,
          max_tokens: 1024
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
        const err = new Error(`Mistral API status ${response.status}: ${errorMsg}`);
        err.status = response.status;
        err.code = data.code;
        throw err;
      }

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content.trim(),
          modelUsed: modelToCall
        };
      } else {
        throw new Error('Mistral API returned an empty or unexpected payload structure.');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Mistral API connection timed out (25s).');
      }
      throw error;
    }
  };

  try {
    return await callMistral(configuredModel);
  } catch (primaryError) {
    // If the requested model returns 429 Rate Limit (common on tier 0 quota with mistral-small-2603),
    // automatically try open-mistral-7b or ministral-8b-latest so user questions don't fail
    if ((primaryError.status === 429 || primaryError.code === '1300') && configuredModel !== 'open-mistral-7b') {
      console.warn(`[AI Service] Model (${configuredModel}) reached rate limit / tier constraint. Seamlessly falling back to Mistral 7B (open-mistral-7b)...`);
      try {
        return await callMistral('open-mistral-7b');
      } catch (fallbackError) {
        console.warn(`[AI Service] Mistral 7B fallback error: ${fallbackError.message}. Trying ministral-8b-latest...`);
        try {
          return await callMistral('ministral-8b-latest');
        } catch (subFallbackError) {
          console.error('[AI Service] Mistral fallback models exhausted:', subFallbackError.message);
        }
      }
    }
    throw primaryError;
  }
};

/**
 * fetchCustomModelCompletion — Calls the Render-hosted (or any remote) custom model.
 *
 * This is the primary inference path when USE_CUSTOM_MODEL=true.
 * The remote server must expose an OpenAI-compatible /v1/chat/completions endpoint,
 * which Ollama does natively.
 *
 * Uses a 30-second timeout to accommodate Render free-tier cold starts.
 *
 * @param {Array<{role: string, content: string}>} messages — Formatted LLM messages
 * @returns {Promise<string>} The AI-generated response text
 * @throws {Error} On API failure, timeout, or unexpected response format
 */
const fetchCustomModelCompletion = async (messages, systemPrompt = MEDICAL_BASE_SYSTEM_PROMPT) => {
  const customUrl = process.env.CUSTOM_MODEL_URL;
  const modelName = process.env.CUSTOM_MODEL_NAME || 'askcare-medical';

  if (!customUrl || customUrl.trim() === '') {
    throw new Error('CUSTOM_MODEL_URL is not configured. Please set it in your environment variables.');
  }

  // Prepend unified system prompt instructions as the first system message
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  // 30-second timeout (Render free tier can have ~10s cold starts)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const headers = {
    'Content-Type': 'application/json'
  };

  // Attach Authorization header only if CUSTOM_MODEL_API_KEY is provided
  const apiKey = process.env.CUSTOM_MODEL_API_KEY;
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(customUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature: 0.2,
        max_tokens: 512
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom Model API status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Custom Model API returned an empty or unexpected payload structure.');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Custom Model API connection timed out (30s).');
    }
    throw error;
  }
};

/**
 * fetchSmolLMCompletion — Calls the SmolLM3-3B LLM inference API.
 *
 * Supports two deployment configurations:
 *   a. Together.xyz API (default) — cloud-hosted, requires SMOLLM_API_KEY
 *   b. Local Ollama / LM Studio   — localhost URL, no API key needed
 *
 * @param {Array<{role: string, content: string}>} messages — Formatted LLM messages
 * @param {string} systemPrompt — Unified system prompt with instructions and memory
 * @returns {Promise<string>} The AI-generated response text
 * @throws {Error} On API failure, auth error, or timeout
 */
const fetchSmolLMCompletion = async (messages, systemPrompt = MEDICAL_BASE_SYSTEM_PROMPT) => {
  const apiKey = process.env.SMOLLM_API_KEY;
  const apiUrl = process.env.SMOLLM_API_URL || 'https://api.together.xyz/v1/chat/completions';
  const modelName = process.env.SMOLLM_MODEL_NAME || 'SmolLM3-3B';

  // Detect local deployment (no API key needed for localhost)
  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isKeyInvalid = !apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_');

  if (!isLocal && isKeyInvalid) {
    throw new Error('SMOLLM_API_KEY is not configured. Please supply a valid key in your environment variables.');
  }

  // Prepend unified system prompt instructions as the first system message
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  // Set up a 20-second hard timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  const headers = {
    'Content-Type': 'application/json'
  };

  // Only attach the Authorization header if an API key is configured
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
        max_tokens: 512   // Cap response length to keep replies concise
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

/**
 * getMockMedicalAnswer — Local keyword-based medical response simulator.
 *
 * @param {string} message — The user's raw question text
 * @param {string} context — Optional RAG context from uploaded documents
 * @param {Object|null} clinicalProfile — User's clinical memory profile
 * @returns {string} A formatted clinical response with disclaimer
 */
const getMockMedicalAnswer = (message, context = '', clinicalProfile = null) => {
  const msg = message.toLowerCase().trim();

  // Check for patient name / conversation memory questions
  if (msg.includes('my name') || msg.includes('who am i') || msg.includes('what is my name')) {
    const name = clinicalProfile?.patientName || "there";
    return `Your name is **${name}**. I have recorded this in your clinical consultation profile. How can I help clarify your symptoms today?\n\nDisclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns.`;
  }
  if (msg.includes('previous conversation') || msg.includes('remember') || msg.includes('summarize') || msg.includes('earlier')) {
    return `Yes, I maintain complete conversational memory of this consultation thread and your persistent clinical profile. Feel free to ask any follow-up questions regarding symptoms, medications, or next steps.\n\nDisclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns.`;
  }

  // Check if query is off-topic (no medical keywords detected)
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

  // Route to a relevant canned clinical guidance block based on keywords
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

  // Append RAG context if available (appended as a labeled clinical note)
  if (context) {
    clinicalGuidance += `\n\n[Clinical Context: ${context}]`;
  }

  // Always append the medical disclaimer (consistent with live mode)
  return `${clinicalGuidance}\n\nDisclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional for clinical concerns.`;
};

/**
 * generateResponse — Main exported function called by chatController.
 *
 * Supports dynamic model switching across:
 *   1. Mistral 7B (open-mistral-7b) — Recommended production-grade default
 *   2. Ministral 8B (ministral-8b-latest) — Edge precision model
 *   3. Mistral Small 4 (mistral-small-2603) — Deep reasoning 119B MoE
 *   4. AskCare SmolLM2 Medical (askcare-medical) — Specialized compact SLM
 *   5. Mock fallback — Guaranteed offline/fail-safe response
 *
 * @param {Array<{sender: string, content: string}>} chatHistory — Internal message format
 * @param {string} [context] — Optional RAG context from uploaded clinical documents
 * @param {Object|null} [clinicalProfile] — Persistent user clinical memory
 * @param {string|null} [requestedModel] — Model identifier selected by user/client
 * @returns {Promise<{content: string, modelUsed: string}>} The clinical response and model used
 */
exports.generateResponse = async (chatHistory, context = '', clinicalProfile = null, requestedModel = null) => {
  const mistralKey = process.env.mistral_api || process.env.MISTRAL_API_KEY;
  const isMistralConfigured = mistralKey && mistralKey.trim() !== '' && !mistralKey.includes('YOUR_');
  const useCustomModel = process.env.USE_CUSTOM_MODEL === 'true';
  const apiKey = process.env.SMOLLM_API_KEY;
  const apiUrl = process.env.SMOLLM_API_URL || '';
  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isKeyPlaceholder = !apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_');

  // Determine target model (default: open-mistral-7b)
  const defaultMistralModel = process.env.MISTRAL_MODEL_NAME || 'open-mistral-7b';
  const targetModel = requestedModel || defaultMistralModel;

  // Build the complete unified system prompt including user clinical memory + RAG documents
  const fullSystemPrompt = buildSystemPrompt(clinicalProfile, context);

  // Load the last user query to determine domain refusal / mock fallback
  const lastUserMsgObj = [...chatHistory].reverse().find(msg => msg.sender === 'user');
  const userPrompt = lastUserMsgObj ? lastUserMsgObj.content : '';

  // Map internal db message format to LLM standard format (strictly user / assistant roles)
  const dialogueMessages = chatHistory.map(msg => ({
    role: msg.sender === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

  // ── Mode A: Specific AskCare SLM / Custom Model Requested ────────────────
  if (targetModel === 'askcare-medical' || targetModel === 'smollm-medical') {
    if (useCustomModel) {
      try {
        console.log('[AI Service] Routing to Custom Model (Render-hosted Ollama)...');
        const customRes = await fetchCustomModelCompletion(dialogueMessages, fullSystemPrompt);
        return { content: customRes, modelUsed: 'askcare-medical' };
      } catch (error) {
        console.error('[AI Service] Custom Model Error:', error.message);
      }
    }
    if (isLocal || !isKeyPlaceholder) {
      try {
        console.log('[AI Service] Routing to SmolLM / External API...');
        const smolRes = await fetchSmolLMCompletion(dialogueMessages, fullSystemPrompt);
        return { content: smolRes, modelUsed: 'askcare-medical' };
      } catch (error) {
        console.error('[AI Service] SmolLM Error:', error.message);
      }
    }
    // If SLM requested but not running locally, fall through to Mistral 7B
    console.log('[AI Service] SLM not locally available, falling through to Mistral 7B...');
  }

  // ── Mode B: Mistral AI (Mistral 7B / Ministral 8B / Mistral Small 4) ─────
  if (isMistralConfigured) {
    try {
      const mistralModelToUse = (targetModel === 'askcare-medical' || targetModel === 'smollm-medical')
        ? 'open-mistral-7b'
        : targetModel;

      console.log(`[AI Service] Executing clinical inference via Mistral AI (Model: ${mistralModelToUse})...`);
      const result = await fetchMistralCompletion(dialogueMessages, fullSystemPrompt, mistralModelToUse);
      return result; // { content, modelUsed }
    } catch (error) {
      console.error('[AI Service] Mistral AI Error:', error.message);
      // Fall through to Custom Model / SmolLM / Mock
    }
  }

  // ── Mode C: Custom Model (Render / HF Ollama) Fallback ───────────────────
  if (useCustomModel) {
    try {
      console.log('[AI Service] Falling back to Custom Model...');
      const customRes = await fetchCustomModelCompletion(dialogueMessages, fullSystemPrompt);
      return { content: customRes, modelUsed: 'askcare-medical' };
    } catch (error) {
      console.error('[AI Service] Custom Model Fallback Error:', error.message);
    }
  }

  // ── Mode D: SmolLM / External API Fallback ───────────────────────────────
  if (isLocal || !isKeyPlaceholder) {
    try {
      console.log('[AI Service] Falling back to SmolLM API...');
      const smolRes = await fetchSmolLMCompletion(dialogueMessages, fullSystemPrompt);
      return { content: smolRes, modelUsed: 'askcare-medical' };
    } catch (error) {
      console.error('[AI Service] SmolLM Fallback Error:', error.message);
    }
  }

  // ── Mode E: Mock Clinical Fallback ───────────────────────────────────────
  console.log('[AI Service] Using mock fallback clinical answers...');
  const mockAnswer = getMockMedicalAnswer(userPrompt, context, clinicalProfile);
  return { content: mockAnswer, modelUsed: 'mock-clinical' };
};

// Export memory & extraction helpers
exports.extractUserClinicalFacts = extractUserClinicalFacts;
exports.mergeClinicalFacts = mergeClinicalFacts;
exports.extractClinicalFactsWithAI = extractClinicalFactsWithAI;
exports.buildSystemPrompt = buildSystemPrompt;
