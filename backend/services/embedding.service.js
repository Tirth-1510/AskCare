const path = require('path');

let pipelinePromise = null;
let extractor = null;

// Dynamic loader for ES module within CommonJS
const getPipeline = async () => {
  if (extractor) return extractor;
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      console.log('Initializing Xenova Transformers feature extraction pipeline...');
      const { env, pipeline } = await import('@xenova/transformers');
      
      // Configure local caching directory if needed
      env.cacheDir = path.join(__dirname, '../.cache');
      
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Xenova Transformers model Xenova/all-MiniLM-L6-v2 loaded successfully.');
      return extractor;
    })();
  }
  return pipelinePromise;
};

/**
 * Pure Javascript term-frequency string hashing vectorizer for fallback mode.
 * Generates a 384-dimensional normalized vector from keywords.
 */
const getHashEmbedding = (text) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const vector = new Array(384).fill(0);
  
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % 384;
    vector[index] += 1;
  }
  
  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < 384; i++) {
      vector[i] /= magnitude;
    }
  } else {
    // If empty text, return default unit vector
    vector[0] = 1.0;
  }
  
  return vector;
};

/**
 * Generates a 384-dimensional normalized embedding for text.
 * Falls back gracefully to string-hashing vectorizer if offline or blocked.
 */
exports.generateEmbedding = async (text) => {
  if (!text || text.trim() === '') {
    return new Array(384).fill(0);
  }

  try {
    const ext = await getPipeline();
    const output = await ext(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.warn('⚠️ Embedding generation fallback triggered:', error.message);
    return getHashEmbedding(text);
  }
};
