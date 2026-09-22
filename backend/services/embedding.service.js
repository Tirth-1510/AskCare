/**
 * embedding.service.js — Semantic Text Embedding Service
 *
 * Generates dense vector representations (embeddings) for text strings.
 * These vectors are used by the RAG pipeline to find semantically similar
 * document chunks for a given user query.
 *
 * PRIMARY ENGINE: Xenova/all-MiniLM-L6-v2 (via @xenova/transformers)
 *   - A 384-dimensional sentence embedding model
 *   - Runs entirely in Node.js (no Python required) — uses ONNX Runtime
 *   - Model is downloaded and cached on first run in the .cache directory
 *   - Output: L2-normalized unit vectors (dot product = cosine similarity)
 *
 * FALLBACK ENGINE: Hash-based Vectorizer (getHashEmbedding)
 *   - Activates automatically if the Xenova model fails to load or is unavailable
 *   - Pure JavaScript, zero dependencies
 *   - Uses character-level hash to map words to 384-dimensional space
 *   - Less accurate than the real model but always available offline
 *
 * Singleton Pattern:
 *   The Xenova pipeline is expensive to initialize (model load + WASM setup).
 *   getPipeline() uses a module-level singleton (extractor) and a single
 *   initialization Promise (pipelinePromise) to ensure the model is only
 *   loaded once per server process, even under concurrent requests.
 */

const path = require('path');

// Module-level singleton references to the Xenova feature extraction pipeline
let pipelinePromise = null; // Promise that resolves to the extractor instance
let extractor = null;       // The loaded Xenova pipeline instance (cached after first load)

/**
 * getPipeline — Lazily loads and caches the Xenova sentence embedding pipeline.
 *
 * Uses dynamic import() because @xenova/transformers is an ES Module (ESM)
 * and this file is CommonJS. Dynamic import() bridges the two module systems.
 *
 * On first call: starts the pipeline load and stores the Promise.
 * On subsequent calls: returns the cached extractor immediately.
 *
 * @returns {Promise<Object>} The Xenova feature extraction pipeline
 */
const getPipeline = async () => {
  if (extractor) return extractor; // Already loaded — return immediately

  if (!pipelinePromise) {
    // Start loading only once — store the Promise so concurrent calls wait on the same load
    pipelinePromise = (async () => {
      console.log('Initializing Xenova Transformers feature extraction pipeline...');
      const { env, pipeline } = await import('@xenova/transformers');
      
      // Configure local caching directory if needed
      // Model files are stored here after the first download
      env.cacheDir = path.join(__dirname, '../.cache');
      
      // Load the all-MiniLM-L6-v2 model for feature extraction (sentence embeddings)
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Xenova Transformers model Xenova/all-MiniLM-L6-v2 loaded successfully.');
      return extractor;
    })();
  }
  return pipelinePromise; // Return the in-progress or completed Promise
};

/**
 * getHashEmbedding — Pure JavaScript term-frequency string hashing vectorizer.
 *
 * Fallback embedding generator that works without any AI model.
 * Maps each word in the text to a position in a 384-dimensional vector
 * using a djb2-like hash function, then normalizes the result to a unit vector.
 *
 * Limitation: Two semantically related but lexically different words (e.g.,
 * "fever" and "pyrexia") will map to very different positions, unlike the
 * neural model. Accuracy is lower but it's always available.
 *
 * @param {string} text — Input text to vectorize
 * @returns {number[]} A 384-dimensional L2-normalized vector
 */
const getHashEmbedding = (text) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const vector = new Array(384).fill(0); // Initialize 384-dim zero vector
  
  for (const word of words) {
    // djb2-style hash: maps each word to one of 384 vector positions
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer to prevent float overflow
    }
    const index = Math.abs(hash) % 384; // Map hash to a valid vector index
    vector[index] += 1;                  // Increment term frequency at that position
  }
  
  // Normalize vector to unit length (L2 normalization)
  // This makes dot product equivalent to cosine similarity
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < 384; i++) {
      vector[i] /= magnitude;
    }
  } else {
    // If empty text, return default unit vector (first component = 1)
    vector[0] = 1.0;
  }
  
  return vector;
};

/**
 * generateEmbedding — Main exported embedding function.
 *
 * Attempts to generate an embedding using the Xenova neural model.
 * If the model is unavailable or throws an error, automatically falls back
 * to the hash-based vectorizer to ensure the pipeline always produces output.
 *
 * The output vector uses mean pooling + L2 normalization (pooling: 'mean',
 * normalize: true) to produce a fixed-size 384-dim representation regardless
 * of input length.
 *
 * @param {string} text — The text to embed (chunk text or user query)
 * @returns {Promise<number[]>} A 384-dimensional normalized embedding vector
 */
exports.generateEmbedding = async (text) => {
  // Return a zero vector for empty input — avoids embedding meaningless content
  if (!text || text.trim() === '') {
    return new Array(384).fill(0);
  }

  try {
    // Use the Xenova neural model (primary path)
    const ext = await getPipeline();
    const output = await ext(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data); // Convert Float32Array to standard JS Array
  } catch (error) {
    // Log the failure and silently fall back to hash-based embedding
    console.warn('⚠️ Embedding generation fallback triggered:', error.message);
    return getHashEmbedding(text);
  }
};
